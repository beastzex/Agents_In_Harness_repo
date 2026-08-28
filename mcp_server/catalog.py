"""
Product catalog data and query models for TrueForge MCP Server.
Provides realistic office furniture, electronics, and accessories with spatial dimensions and pricing.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class Product(BaseModel):
    id: str
    name: str
    category: str
    price: float
    width: float   # in feet (e.g. 5.0 = 60 inches)
    depth: float   # in feet (e.g. 2.5 = 30 inches)
    height: float  # in feet (e.g. 2.5 = 30 inches)
    clearance_front: float = 2.5  # Required free space in front
    clearance_sides: float = 0.5  # Required free space on sides
    color: str = "#3B82F6"
    description: str
    features: List[str] = Field(default_factory=list)
    in_stock: bool = True

CATALOG_ITEMS: List[Product] = [
    # Desks
    Product(
        id="desk-apex-standing",
        name="ApexPro Electric Standing Desk (60x30)",
        category="desk",
        price=499.00,
        width=5.0,
        depth=2.5,
        height=2.8,
        clearance_front=3.0,
        clearance_sides=0.5,
        color="#3B82F6",
        description="Dual-motor height adjustable motorized desk with memory presets and cable management tray.",
        features=["Motorized height adjustment", "Anti-collision sensor", "60x30 inch solid surface", "350lb lift capacity"]
    ),
    Product(
        id="desk-compact-corner",
        name="L-Shaped Corner Workstation Desk",
        category="desk",
        price=379.00,
        width=4.5,
        depth=4.0,
        height=2.5,
        clearance_front=3.0,
        clearance_sides=0.5,
        color="#2563EB",
        description="Space-saving corner layout desk with integrated monitor shelf and headphone hook.",
        features=["L-shaped ergonomic fit", "Reversible orientation", "Heavy-duty steel frame"]
    ),
    Product(
        id="desk-minimalist-oak",
        name="Nordic Oak Solid Wood Desk (48x24)",
        category="desk",
        price=299.00,
        width=4.0,
        depth=2.0,
        height=2.5,
        clearance_front=2.5,
        clearance_sides=0.5,
        color="#D97706",
        description="Clean aesthetic minimalist solid oak timber desk with bevelled edges.",
        features=["Solid FSC oak", "Bevelled comfort edge", "Integrated power strip bracket"]
    ),

    # Chairs
    Product(
        id="chair-ergohuman-mesh",
        name="ErgoMaster High-Back Mesh Task Chair",
        category="chair",
        price=349.00,
        width=2.2,
        depth=2.2,
        height=3.8,
        clearance_front=1.5,
        clearance_sides=1.0,
        color="#10B981",
        description="Dynamic lumbar support, 4D adjustable armrests, breathable Korean mesh back.",
        features=["Dynamic 4D armrests", "Self-adjusting lumbar", "135-degree recline mechanism", "Class-4 gas cylinder"]
    ),
    Product(
        id="chair-executive-leather",
        name="Zenith Executive Leather Lounge Chair",
        category="chair",
        price=420.00,
        width=2.4,
        depth=2.4,
        height=4.0,
        clearance_front=1.5,
        clearance_sides=1.0,
        color="#059669",
        description="Top-grain Italian leather chair with high-density memory foam cushioning.",
        features=["Top-grain leather", "Tilt tension lock", "Polished aluminum wheelbase"]
    ),

    # Monitors & Displays
    Product(
        id="monitor-ultrawide-34",
        name="UltraView 34\" Curved WQHD IPS Monitor",
        category="monitor",
        price=449.00,
        width=2.8,
        depth=0.8,
        height=1.8,
        clearance_front=1.5,
        clearance_sides=0.2,
        color="#8B5CF6",
        description="3440x1440p 144Hz curved ultrawide display with USB-C 90W power delivery.",
        features=["1900R curvature", "90W USB-C hub", "HDR400 certification", "Picture-by-Picture"]
    ),
    Product(
        id="monitor-dual-27-bundle",
        name="Dual 27\" 4K ProArt Displays + Dual Arm",
        category="monitor",
        price=599.00,
        width=4.2,
        depth=0.9,
        height=1.8,
        clearance_front=1.5,
        clearance_sides=0.2,
        color="#7C3AED",
        description="Two 27-inch 4K color-accurate IPS panels mounted on heavy duty gas spring dual monitor arm.",
        features=["99% DCI-P3 color gamut", "Gas-spring articulated arm", "Single clamp mount"]
    ),

    # Storage & Bookshelves
    Product(
        id="storage-oak-credenza",
        name="Nordic Minimalist Bookshelf & Credenza",
        category="storage",
        price=219.00,
        width=3.5,
        depth=1.2,
        height=4.5,
        clearance_front=2.0,
        clearance_sides=0.2,
        color="#F59E0B",
        description="3-tier vertical bookshelf with soft-close lower storage cabinet.",
        features=["Anti-tip safety brackets", "Adjustable inner shelves", "Cable grommet pass-through"]
    ),
    Product(
        id="storage-filing-pedestal",
        name="Lockable Mobile File Pedestal with Cushion Top",
        category="storage",
        price=129.00,
        width=1.3,
        depth=1.8,
        height=2.0,
        clearance_front=1.5,
        clearance_sides=0.2,
        color="#D97706",
        description="Under-desk rolling file cabinet with padded seat cushion for guest seating.",
        features=["Fits under standard desks", "Central lock", "Cushioned seating top"]
    ),

    # Lighting & Accessories
    Product(
        id="light-monitor-bar",
        name="Lumina Smart ScreenBar Monitor Light & Puck",
        category="lighting",
        price=89.00,
        width=1.5,
        depth=0.3,
        height=0.3,
        clearance_front=0.5,
        clearance_sides=0.1,
        color="#EC4899",
        description="Asymmetric optical design screen bar with wireless desktop control puck and auto-dimming.",
        features=["Zero screen glare", "Auto ambient light sensor", "Stepless color temperature"]
    ),
    Product(
        id="light-standing-floor",
        name="Solstice Arc Floor Reading Lamp",
        category="lighting",
        price=119.00,
        width=1.5,
        depth=1.5,
        height=5.5,
        clearance_front=1.0,
        clearance_sides=0.5,
        color="#F43F5E",
        description="Sleek arched matte black floor lamp with diffused warm-to-cool LED temperature control.",
        features=["3000K-6000K tunable", "Weighted marble base", "Touch slider"]
    ),

    # Ergonomic Accessories
    Product(
        id="acc-cable-management",
        name="ProClean Under-Desk Cable Management Mesh & Raceway",
        category="accessory",
        price=39.00,
        width=2.0,
        depth=0.5,
        height=0.4,
        clearance_front=0.0,
        clearance_sides=0.0,
        color="#64748B",
        description="Flame-retardant under-desk cable tray with reusable velcro ties and magnetic clip bundle.",
        features=["Zero-drill clamps", "Flame-retardant fabric", "Accommodates dual surge protectors"]
    ),
    Product(
        id="acc-anti-fatigue-mat",
        name="ErgoFlow Terrain Active Standing Mat",
        category="accessory",
        price=69.00,
        width=2.5,
        depth=2.0,
        height=0.2,
        clearance_front=1.0,
        clearance_sides=0.5,
        color="#475569",
        description="Multi-density polyurethane standing mat with massage mounds and stretch rails.",
        features=["High-density rebound foam", "Non-slip bevelled edge", "Relieves knee & lower back pressure"]
    )
]

def search_catalog_data(
    query: Optional[str] = None,
    category: Optional[str] = None,
    max_price: Optional[float] = None,
    max_width: Optional[float] = None,
    in_stock_only: bool = True
) -> List[Product]:
    """Filter catalog items based on criteria."""
    results = []
    for item in CATALOG_ITEMS:
        if in_stock_only and not item.in_stock:
            continue
        if category and item.category.lower() != category.lower():
            continue
        if max_price is not None and item.price > max_price:
            continue
        if max_width is not None and item.width > max_width:
            continue
        if query:
            q = query.lower()
            text_match = (
                q in item.name.lower() or
                q in item.description.lower() or
                any(q in f.lower() for f in item.features)
            )
            if not text_match:
                continue
        results.append(item)
    return results

def get_product_by_id(product_id: str) -> Optional[Product]:
    for item in CATALOG_ITEMS:
        if item.id == product_id:
            return item
    return None

def get_categories() -> List[str]:
    return sorted(list({item.category for item in CATALOG_ITEMS}))
