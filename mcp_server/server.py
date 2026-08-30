"""
Model Context Protocol (MCP) Server for The Renovation Architect.
Exposes exactly three MCP tools: search_furniture, get_item_details, and place_order.
Supports standard MCP JSON-RPC 2.0 tool discovery and execution.
"""
from typing import Dict, Any, List, Optional
import json
import logging
import datetime
from .catalog import search_furniture_data, get_item_details_data, get_categories, CATALOG_ITEMS
from agent.approval_gate import approval_gate_instance, OrderPayload, ApprovalBlockedException

logger = logging.getLogger("mcp_server")

# Exact MCP Tool Definitions matching hackathon contract
MCP_TOOL_DEFINITIONS = [
    {
        "name": "search_furniture",
        "description": "Search the curated furniture and decor catalog by keywords, category (seating, tables, lighting, storage, decor), max price, and return limit.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query terms or style keywords (e.g. 'ergonomic chair', 'oak standing desk', 'minimalist lamp')"
                },
                "max_price": {
                    "type": "number",
                    "description": "Optional upper price limit in USD"
                },
                "category": {
                    "type": "string",
                    "description": "Furniture category: 'seating', 'tables', 'lighting', 'storage', 'decor'"
                },
                "limit": {
                    "type": "number",
                    "description": "Maximum number of items to return (default 12)",
                    "default": 12
                }
            }
        }
    },
    {
        "name": "get_item_details",
        "description": "Retrieve comprehensive dimensions, detailed description, imagery, and style tags for a specific furniture item ID.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "string",
                    "description": "Exact product ID (e.g. 'chair-ergomaster-pro', 'table-apex-standing-60')"
                }
            },
            "required": ["id"]
        }
    },
    {
        "name": "place_order",
        "description": "SENSITIVE GATED ACTION: Place an order for the selected furniture item IDs. Execution is strictly blocked by the Human-in-the-Loop approval gate until explicit user authorization is provided.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "item_ids": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Array of item IDs to procure"
                },
                "session_id": {
                    "type": "string",
                    "description": "Current agent session ID"
                },
                "approval_token": {
                    "type": "string",
                    "description": "Cryptographic approval token generated upon human authorization"
                }
            },
            "required": ["item_ids"]
        }
    }
]

class MCPServer:
    """TrueForge MCP Server instance managing catalog queries and tool dispatches."""
    
    def __init__(self, name: str = "TrueForge-Furniture-MCP"):
        self.name = name
        self.version = "1.0.0"

    def list_tools(self) -> List[Dict[str, Any]]:
        """Return exact MCP tool declarations."""
        return MCP_TOOL_DEFINITIONS

    def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute an MCP tool call by name with validated arguments.
        Returns a standard MCP result structure.
        """
        try:
            if tool_name == "search_furniture" or tool_name == "search_catalog":
                query = arguments.get("query")
                category = arguments.get("category")
                max_price = arguments.get("max_price")
                limit = int(arguments.get("limit", 12))
                
                results = search_furniture_data(
                    query=query,
                    category=category,
                    max_price=max_price,
                    limit=limit
                )
                return {
                    "status": "success",
                    "tool": "search_furniture",
                    "count": len(results),
                    "data": results,
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(results, indent=2)
                        }
                    ]
                }

            elif tool_name == "get_item_details" or tool_name == "get_product_details":
                item_id = arguments.get("id") or arguments.get("product_id")
                if not item_id:
                    return {
                        "status": "error",
                        "error": "Missing required argument 'id'"
                    }
                item = get_item_details_data(item_id)
                if not item:
                    return {
                        "status": "error",
                        "error": f"Item with ID '{item_id}' not found in catalog."
                    }
                return {
                    "status": "success",
                    "tool": "get_item_details",
                    "data": item,
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(item, indent=2)
                        }
                    ]
                }

            elif tool_name == "place_order":
                item_ids = arguments.get("item_ids", [])
                if not item_ids:
                    return {
                        "status": "error",
                        "error": "Missing or empty 'item_ids' array."
                    }

                session_id = arguments.get("session_id", "sess-direct-mcp")
                approval_token = arguments.get("approval_token")

                # Resolve items and total
                matched_items = []
                total_cost = 0.0
                for iid in item_ids:
                    detail = get_item_details_data(iid)
                    if detail:
                        matched_items.append(detail)
                        total_cost += detail.get("price", 0.0)

                order_payload = OrderPayload(
                    item_ids=item_ids,
                    items=matched_items,
                    total=round(total_cost, 2)
                )

                try:
                    order_result = approval_gate_instance.verify_and_execute_order(
                        session_id=session_id,
                        order_payload=order_payload,
                        approval_token=approval_token
                    )
                    return {
                        "status": "success",
                        "tool": "place_order",
                        "data": order_result,
                        "content": [
                            {
                                "type": "text",
                                "text": json.dumps(order_result, indent=2)
                            }
                        ]
                    }
                except ApprovalBlockedException as e:
                    return {
                        "status": "blocked",
                        "tool": "place_order",
                        "error": e.message,
                        "approval_id": e.approval_request.approval_id,
                        "session_id": session_id,
                        "total": order_payload.total,
                        "content": [
                            {
                                "type": "text",
                                "text": f"SECURITY GATE BLOCKED: Human approval required for approval_id={e.approval_request.approval_id}"
                            }
                        ]
                    }
                except Exception as e:
                    return {
                        "status": "error",
                        "tool": "place_order",
                        "error": str(e)
                    }

            else:
                return {
                    "status": "error",
                    "error": f"Unknown tool: '{tool_name}'"
                }

        except Exception as e:
            logger.error(f"Error executing MCP tool {tool_name}: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "tool": tool_name,
                "error": str(e)
            }

    def handle_json_rpc(self, request_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Standard MCP JSON-RPC 2.0 request handler."""
        req_id = request_payload.get("id", 1)
        method = request_payload.get("method")
        params = request_payload.get("params", {})

        if method == "tools/list":
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "tools": self.list_tools()
                }
            }
        elif method == "tools/call":
            tool_name = params.get("name")
            arguments = params.get("arguments", {})
            exec_result = self.execute_tool(tool_name, arguments)
            if exec_result.get("status") == "error":
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {
                        "code": -32000,
                        "message": exec_result.get("error", "Execution failed")
                    }
                }
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": exec_result
            }
        else:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {
                    "code": -32601,
                    "message": f"Method '{method}' not found"
                }
            }

# Default singleton instance
mcp_server_instance = MCPServer()
