"""
Unit tests for MCP Server and Catalog query functions.
"""
import pytest
from mcp_server.catalog import (
    search_catalog_data,
    get_product_by_id,
    get_categories,
    CATALOG_ITEMS
)
from mcp_server.server import MCPServer, mcp_server_instance

def test_catalog_items_populated():
    """Verify default catalog contains diverse furniture and electronics."""
    assert len(CATALOG_ITEMS) >= 10
    categories = get_categories()
    assert "desk" in categories
    assert "chair" in categories
    assert "monitor" in categories
    assert "storage" in categories

def test_search_catalog_by_category():
    """Verify filtering products by category."""
    desks = search_catalog_data(category="desk")
    assert len(desks) > 0
    assert all(item.category == "desk" for item in desks)

def test_search_catalog_by_max_price():
    """Verify price cap filtering."""
    affordable = search_catalog_data(max_price=300.0)
    assert len(affordable) > 0
    assert all(item.price <= 300.0 for item in affordable)

def test_search_catalog_query_keyword():
    """Verify keyword text search across names and features."""
    ergonomic = search_catalog_data(query="lumbar")
    assert len(ergonomic) > 0
    assert any("lumbar" in item.description.lower() or any("lumbar" in f.lower() for f in item.features) for item in ergonomic)

def test_get_product_by_id():
    """Verify product retrieval by exact ID."""
    prod = get_product_by_id("desk-apex-standing")
    assert prod is not None
    assert prod.name == "ApexPro Electric Standing Desk (60x30)"
    assert prod.width == 5.0
    assert prod.depth == 2.5

def test_mcp_server_tool_definitions():
    """Verify standard MCP tool declarations."""
    tools = mcp_server_instance.list_tools()
    tool_names = [t["name"] for t in tools]
    assert "search_catalog" in tool_names
    assert "get_product_details" in tool_names
    assert "list_categories" in tool_names

def test_mcp_server_execute_tool():
    """Verify tool execution returns structured MCP result."""
    res = mcp_server_instance.execute_tool("search_catalog", {"category": "chair"})
    assert res["status"] == "success"
    assert res["count"] > 0
    assert "data" in res
    assert "content" in res

def test_mcp_server_json_rpc():
    """Verify JSON-RPC 2.0 protocol compliance."""
    rpc_req = {
        "jsonrpc": "2.0",
        "id": 42,
        "method": "tools/call",
        "params": {
            "name": "get_product_details",
            "arguments": {"product_id": "chair-ergohuman-mesh"}
        }
    }
    rpc_res = mcp_server_instance.handle_json_rpc(rpc_req)
    assert rpc_res["id"] == 42
    assert "result" in rpc_res
    assert rpc_res["result"]["data"]["id"] == "chair-ergohuman-mesh"
