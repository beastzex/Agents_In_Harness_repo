"""
Model Context Protocol (MCP) Server for Catalog & Layout Tooling.
Exposes JSON-RPC / FastMCP compatible tools for catalog searching, item retrieval, and inventory checks.
"""
from typing import Dict, Any, List, Optional
import json
import logging
from .catalog import search_catalog_data, get_product_by_id, get_categories, Product

logger = logging.getLogger("mcp_server")

# Standard MCP Tool Definitions
MCP_TOOL_DEFINITIONS = [
    {
        "name": "search_catalog",
        "description": "Search the office furniture and equipment catalog with optional filters for category, max budget, dimensions, and keyword search.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Keyword search (e.g. 'standing desk', 'mesh chair', 'curved monitor')"
                },
                "category": {
                    "type": "string",
                    "description": "Product category: 'desk', 'chair', 'monitor', 'storage', 'lighting', 'accessory'"
                },
                "max_price": {
                    "type": "number",
                    "description": "Maximum price in USD"
                },
                "max_width": {
                    "type": "number",
                    "description": "Maximum width in feet (room constraint)"
                }
            }
        }
    },
    {
        "name": "get_product_details",
        "description": "Retrieve comprehensive dimensions, clearance requirements, pricing, and features for a specific product ID.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "product_id": {
                    "type": "string",
                    "description": "Exact product ID (e.g. 'desk-apex-standing', 'chair-ergohuman-mesh')"
                }
            },
            "required": ["product_id"]
        }
    },
    {
        "name": "list_categories",
        "description": "List all available product categories in the store catalog.",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    }
]

class MCPServer:
    """TrueForge MCP Server instance managing catalog queries and tool dispatches."""
    
    def __init__(self, name: str = "TrueForge-Catalog-MCP"):
        self.name = name
        self.version = "1.0.0"

    def list_tools(self) -> List[Dict[str, Any]]:
        """Return MCP tool catalog definitions."""
        return MCP_TOOL_DEFINITIONS

    def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute an MCP tool call by name with validated arguments.
        Returns a standard MCP result structure with content payload.
        """
        try:
            if tool_name == "search_catalog":
                query = arguments.get("query")
                category = arguments.get("category")
                max_price = arguments.get("max_price")
                max_width = arguments.get("max_width")
                
                results = search_catalog_data(
                    query=query,
                    category=category,
                    max_price=max_price,
                    max_width=max_width
                )
                items_data = [item.model_dump() for item in results]
                return {
                    "status": "success",
                    "tool": tool_name,
                    "count": len(items_data),
                    "data": items_data,
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(items_data, indent=2)
                        }
                    ]
                }

            elif tool_name == "get_product_details":
                product_id = arguments.get("product_id")
                if not product_id:
                    return {
                        "status": "error",
                        "error": "Missing required argument 'product_id'"
                    }
                item = get_product_by_id(product_id)
                if not item:
                    return {
                        "status": "error",
                        "error": f"Product with ID '{product_id}' not found in catalog."
                    }
                item_data = item.model_dump()
                return {
                    "status": "success",
                    "tool": tool_name,
                    "data": item_data,
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(item_data, indent=2)
                        }
                    ]
                }

            elif tool_name == "list_categories":
                categories = get_categories()
                return {
                    "status": "success",
                    "tool": tool_name,
                    "data": categories,
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(categories)
                        }
                    ]
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
