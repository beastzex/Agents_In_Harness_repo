"""
Furniture catalog specifications, data loading, and query functions for TrueForge MCP Server.
"""
from typing import List, Optional, Dict, Any
from pathlib import Path
import json
import logging
from pydantic import BaseModel, Field

logger = logging.getLogger("mcp_catalog")

class FurnitureItem(BaseModel):
    id: str
    name: str
    category: str
    price: float
    image_url: str
    width_in: float
    depth_in: float
    style_tags: List[str] = Field(default_factory=list)
    description: str

def _load_catalog() -> List[FurnitureItem]:
    """Load catalog from furniture.json file or fall back to default seed."""
    possible_paths = [
        Path(__file__).parent.parent / "catalog" / "furniture.json",
        Path(__file__).parent.parent / "backend" / "catalog" / "furniture.json",
        Path(__file__).parent / "furniture.json",
    ]
    for p in possible_paths:
        if p.exists():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    items = [FurnitureItem(**it) for it in data]
                    logger.info(f"Loaded {len(items)} catalog items from {p}")
                    return items
            except Exception as e:
                logger.error(f"Error loading {p}: {e}")

    # Fallback default seed
    return [
        FurnitureItem(
            id="chair-ergomaster-pro",
            name="ErgoMaster Pro High-Back Mesh Chair",
            category="seating",
            price=349.00,
            image_url="https://images.unsplash.com/photo-1580481077197-9e7f7228a05c?auto=format&fit=crop&w=600&q=80",
            width_in=26.0,
            depth_in=26.0,
            style_tags=["ergonomic", "modern", "executive"],
            description="Premium breathable Korean mesh task chair with 4D adjustable armrests."
        ),
        FurnitureItem(
            id="table-apex-standing-60",
            name="ApexPro Motorized Dual-Motor Standing Desk (60x30)",
            category="tables",
            price=499.00,
            image_url="https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80",
            width_in=60.0,
            depth_in=30.0,
            style_tags=["ergonomic", "modern", "tech"],
            description="Dual-motor motorized standing desk with 4-memory digital display keypad."
        )
    ]

CATALOG_ITEMS: List[FurnitureItem] = _load_catalog()

def search_furniture_data(
    query: Optional[str] = None,
    max_price: Optional[float] = None,
    category: Optional[str] = None,
    limit: int = 12
) -> List[Dict[str, Any]]:
    """
    Search catalog matching query, category, and max_price.
    Returns array of { id, name, category, price, image_url, width_in, depth_in, style_tags }.
    """
    results: List[Dict[str, Any]] = []
    
    for item in CATALOG_ITEMS:
        # Category filter (supports plural or singular, e.g. seating/chair, tables/desk)
        if category:
            cat_lower = category.lower().strip()
            item_cat = item.category.lower().strip()
            
            # Map common category synonyms & specific sub-roles
            name_desc_lower = f"{item.name} {item.description}".lower()
            
            if cat_lower in ["sofas", "sofa", "sectional", "couches"]:
                category_matches = item_cat in ["seating", "sofa"] and any(w in name_desc_lower for w in ["sofa", "sectional", "couch", "chaise"])
            elif cat_lower in ["coffee-tables", "coffee_table", "center_table", "coffee table"]:
                category_matches = item_cat in ["tables", "table"] and any(w in name_desc_lower for w in ["coffee", "oval", "travertine", "round", "center"])
            elif cat_lower in ["media-consoles", "tv-units", "tv console", "media", "showcase", "entertainment"]:
                category_matches = item_cat in ["storage"] and any(w in name_desc_lower for w in ["tv", "console", "credenza", "showcase", "cabinet", "media"])
            elif cat_lower in ["indoor-plants", "plants", "plant", "planter", "botanical"]:
                category_matches = (item_cat in ["decor", "plant", "plants"]) and any(w in name_desc_lower for w in ["plant", "monstera", "fig", "tree", "planter"])
            elif cat_lower in ["beds", "bed", "bedframe", "platform bed", "mattress"]:
                category_matches = item_cat in ["beds", "bed"] or "bed" in name_desc_lower
            elif cat_lower in ["nightstands", "nightstand", "bedside", "side table"]:
                category_matches = item_cat in ["nightstands", "nightstand"] or "nightstand" in name_desc_lower or "bedside" in name_desc_lower
            elif cat_lower in ["seating", "chair", "chairs", "seat"]:
                category_matches = item_cat in ["seating", "chair", "sofa"]
            elif cat_lower in ["tables", "table", "desk", "desks"]:
                category_matches = item_cat in ["tables", "desk"]
            elif cat_lower in ["lighting", "light", "lamps", "lamp"]:
                category_matches = item_cat in ["lighting", "light"]
            elif cat_lower in ["storage", "shelves", "bookshelf", "cabinet", "dresser", "wardrobe"]:
                category_matches = item_cat in ["storage"]
            elif cat_lower in ["rugs", "rug", "carpet", "carpets"]:
                category_matches = item_cat in ["rugs", "rug", "decor"] and "rug" in name_desc_lower
            elif cat_lower in ["decor", "decoration", "accessories", "accessory"]:
                category_matches = item_cat in ["decor", "accessory"]
            else:
                category_matches = item_cat == cat_lower

            if not category_matches:
                continue

        # Max price filter
        if max_price is not None and item.price > max_price:
            continue

        # Query search across name, description, category, and style tags
        if query:
            q_terms = query.lower().split()
            item_text = f"{item.name} {item.description} {item.category} {' '.join(item.style_tags)}".lower()
            if not any(term in item_text for term in q_terms):
                continue

        # Standard summary shape (without full description)
        results.append({
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "price": item.price,
            "image_url": item.image_url,
            "width_in": item.width_in,
            "depth_in": item.depth_in,
            "style_tags": item.style_tags
        })

        if len(results) >= limit:
            break

    if len(results) == 0 and query:
        # Fall back to category-only search if query was too narrow
        return search_furniture_data(query=None, max_price=max_price, category=category, limit=limit)

    return results

def get_item_details_data(item_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve full item details by ID.
    Returns full item object including description.
    """
    for item in CATALOG_ITEMS:
        if item.id == item_id:
            return {
                "id": item.id,
                "name": item.name,
                "category": item.category,
                "price": item.price,
                "image_url": item.image_url,
                "width_in": item.width_in,
                "depth_in": item.depth_in,
                "style_tags": item.style_tags,
                "description": item.description
            }
    return None

def get_categories() -> List[str]:
    """Return all distinct categories in catalog."""
    return sorted(list({item.category for item in CATALOG_ITEMS}))
