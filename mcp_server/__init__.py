"""
MCP Server package for TrueForge agent system.
"""
from .catalog import Product, CATALOG_ITEMS, search_catalog_data, get_product_by_id, get_categories
from .server import MCPServer, mcp_server_instance, MCP_TOOL_DEFINITIONS

__all__ = [
    "Product",
    "CATALOG_ITEMS",
    "search_catalog_data",
    "get_product_by_id",
    "get_categories",
    "MCPServer",
    "mcp_server_instance",
    "MCP_TOOL_DEFINITIONS"
]
