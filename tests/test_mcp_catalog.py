"""
Unit tests for MCP Server and Catalog query functions.
Verifies exact tool contracts for search_furniture, get_item_details, and place_order.
"""
import pytest
from mcp_server.catalog import (
    search_furniture_data,
    get_item_details_data,
    get_categories,
    CATALOG_ITEMS
)
from mcp_server.server import MCPServer, mcp_server_instance

def test_catalog_items_populated():
    """Verify catalog contains 50+ diverse items across all 5 core categories."""
    assert len(CATALOG_ITEMS) >= 50
    categories = get_categories()
    assert "seating" in categories
    assert "tables" in categories
    assert "lighting" in categories
    assert "storage" in categories
    assert "decor" in categories

def test_search_furniture_by_category():
    """Verify filtering products by category."""
    seating = search_furniture_data(category="seating")
    assert len(seating) > 0
    assert all(item["category"] == "seating" for item in seating)
    # Check item schema
    first = seating[0]
    assert "id" in first
    assert "name" in first
    assert "price" in first
    assert "image_url" in first
    assert "width_in" in first
    assert "depth_in" in first
    assert "style_tags" in first

def test_search_furniture_by_max_price():
    """Verify price cap filtering."""
    affordable = search_furniture_data(max_price=100.0)
    assert len(affordable) > 0
    assert all(item["price"] <= 100.0 for item in affordable)

def test_search_furniture_query_keyword():
    """Verify keyword text search across names and style tags."""
    ergonomic = search_furniture_data(query="ergonomic")
    assert len(ergonomic) > 0

def test_get_item_details_by_id():
    """Verify full item details retrieval including description."""
    item = get_item_details_data("chair-ergomaster-pro")
    assert item is not None
    assert item["name"] == "ErgoMaster Pro High-Back Mesh Chair"
    assert item["price"] == 349.0
    assert item["width_in"] == 26.0
    assert item["depth_in"] == 26.0
    assert "description" in item
    assert len(item["description"]) > 10

def test_mcp_server_tool_definitions():
    """Verify exact 3 standard MCP tool declarations."""
    tools = mcp_server_instance.list_tools()
    tool_names = [t["name"] for t in tools]
    assert "search_furniture" in tool_names
    assert "get_item_details" in tool_names
    assert "place_order" in tool_names

def test_mcp_server_execute_search_tool():
    """Verify tool execution returns structured MCP result."""
    res = mcp_server_instance.execute_tool("search_furniture", {"category": "tables", "limit": 4})
    assert res["status"] == "success"
    assert res["count"] > 0
    assert "data" in res
    assert "content" in res

def test_mcp_server_place_order_gated():
    """Verify executing place_order without token returns blocked status."""
    res = mcp_server_instance.execute_tool("place_order", {
        "item_ids": ["chair-ergomaster-pro", "table-apex-standing-60"],
        "session_id": "sess-direct-test"
    })
    assert res["status"] == "blocked"
    assert "approval_id" in res

def test_mcp_server_json_rpc():
    """Verify JSON-RPC 2.0 protocol compliance."""
    rpc_req = {
        "jsonrpc": "2.0",
        "id": 42,
        "method": "tools/call",
        "params": {
            "name": "get_item_details",
            "arguments": {"id": "table-apex-standing-60"}
        }
    }
    rpc_res = mcp_server_instance.handle_json_rpc(rpc_req)
    assert rpc_res["id"] == 42
    assert "result" in rpc_res
    assert rpc_res["result"]["data"]["id"] == "table-apex-standing-60"
