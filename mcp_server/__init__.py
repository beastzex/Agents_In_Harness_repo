"""
MCP Server package for TrueForge system.
"""
from .catalog import (
    FurnitureItem,
    CATALOG_ITEMS,
    search_furniture_data,
    get_item_details_data,
    get_categories
)
from .server import (
    MCPServer,
    mcp_server_instance,
    MCP_TOOL_DEFINITIONS
)

__all__ = [
    "FurnitureItem",
    "CATALOG_ITEMS",
    "search_furniture_data",
    "get_item_details_data",
    "get_categories",
    "MCPServer",
    "mcp_server_instance",
    "MCP_TOOL_DEFINITIONS"
]
