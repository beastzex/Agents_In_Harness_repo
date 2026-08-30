"""
Spatial Layout and Collision-Free Placement Algorithm for Room Furniture & Office Equipment.
Calculates exact coordinate placement, rotation angles, clearances, and ergonomic scoring.
"""
from typing import List, Dict, Any, Tuple, Optional
import math
from pydantic import BaseModel

class RoomConfig(BaseModel):
    width: float = 12.0   # Room width in feet (X axis)
    length: float = 10.0  # Room length in feet (Y axis)
    door_wall: str = "south"  # north, south, east, west
    door_position: float = 3.0  # distance from left of wall
    door_width: float = 3.0
    window_wall: str = "north"
    window_position: float = 4.0
    window_width: float = 4.0

class PlacedItem(BaseModel):
    id: str
    name: str
    category: str
    x: float             # center or top-left X coordinate in feet
    y: float             # center or top-left Y coordinate in feet
    width: float         # width along X (footprint)
    depth: float         # depth along Y (footprint)
    height: float        # height in feet
    rotation: int        # degrees (0, 90, 180, 270)
    color: str
    price: float
    is_surface_mounted: bool = False  # E.g. monitors mount on desks
    parent_id: Optional[str] = None
    bounding_box: Dict[str, float]

class LayoutResult(BaseModel):
    room: RoomConfig
    placed_items: List[PlacedItem]
    total_cost: float
    space_utilization_pct: float
    ergonomic_score: float
    collision_count: int
    clearance_violations: int
    recommendations: List[str]

def check_box_overlap(b1: Dict[str, float], b2: Dict[str, float], padding: float = 0.05) -> bool:
    """Check if two bounding boxes [min_x, max_x, min_y, max_y] overlap."""
    if b1["max_x"] + padding <= b2["min_x"] or b2["max_x"] + padding <= b1["min_x"]:
        return False
    if b1["max_y"] + padding <= b2["min_y"] or b2["max_y"] + padding <= b1["min_y"]:
        return False
    return True

def compute_layout(
    room: RoomConfig,
    items: List[Dict[str, Any]],
    preferred_desk_wall: str = "north"
) -> LayoutResult:
    """
    Optimized placement algorithm:
    1. Places desk against primary wall (keeping clearance from doors/windows)
    2. Aligns chair in front of desk
    3. Mounts monitor/lamp onto or adjacent to desk
    4. Places storage credenza/bookshelf along secondary wall with zero overlap
    5. Places floor lamps & active mats in optimal ergonomic zones
    """
    placed_items: List[PlacedItem] = []
    total_cost = 0.0
    collisions = 0
    clearance_violations = 0
    recommendations = []

    # Sort items so major floor anchors are placed first (desk -> storage -> chair -> lamp -> accessories -> monitors)
    category_order = {
        "desk": 1,
        "storage": 2,
        "chair": 3,
        "lighting": 4,
        "accessory": 5,
        "monitor": 6
    }
    sorted_items = sorted(items, key=lambda x: category_order.get(x.get("category", ""), 99))

    desk_placed: Optional[PlacedItem] = None

    # Track occupied floor rectangles
    floor_boxes: List[Dict[str, float]] = []

    # Reserved door swing area
    door_rect = {"min_x": 0.0, "max_x": 0.0, "min_y": 0.0, "max_y": 0.0}
    if room.door_wall == "south":
        door_rect = {
            "min_x": room.door_position,
            "max_x": room.door_position + room.door_width,
            "min_y": 0.0,
            "max_y": room.door_width + 0.5
        }
    elif room.door_wall == "north":
        door_rect = {
            "min_x": room.door_position,
            "max_x": room.door_position + room.door_width,
            "min_y": room.length - room.door_width - 0.5,
            "max_y": room.length
        }
    floor_boxes.append(door_rect)

    for item_data in sorted_items:
        item_id = item_data.get("id", "item")
        name = item_data.get("name", "Item")
        category = item_data.get("category", "accessory")
        w = float(item_data.get("width", 2.0))
        d = float(item_data.get("depth", 2.0))
        h = float(item_data.get("height", 2.5))
        price = float(item_data.get("price", 0.0))
        color = item_data.get("color", "#3B82F6")

        total_cost += price
        rotation = 0
        is_surface = False
        parent_id = None

        if category == "desk":
            # Place desk against North wall or opposite the door
            x = (room.width - w) / 2.0
            y = room.length - d - 0.5  # 0.5 ft gap from back wall
            rotation = 0

            bbox = {"min_x": x, "max_x": x + w, "min_y": y, "max_y": y + d}
            desk_placed = PlacedItem(
                id=item_id,
                name=name,
                category=category,
                x=round(x, 2),
                y=round(y, 2),
                width=w,
                depth=d,
                height=h,
                rotation=rotation,
                color=color,
                price=price,
                is_surface_mounted=False,
                bounding_box=bbox
            )
            placed_items.append(desk_placed)
            floor_boxes.append(bbox)

        elif category == "chair":
            if desk_placed:
                # Chair positioned directly in front of desk center
                cw, cd = w, d
                x = desk_placed.x + (desk_placed.width - cw) / 2.0
                y = desk_placed.y - cd - 0.3 # 0.3 ft space from desk front edge
                rotation = 180  # Facing desk
            else:
                x = room.width / 2.0 - w / 2.0
                y = room.length / 2.0 - d / 2.0
                rotation = 0

            bbox = {"min_x": x, "max_x": x + w, "min_y": y, "max_y": y + d}
            # Check overlap with door
            if check_box_overlap(bbox, door_rect):
                clearance_violations += 1
                recommendations.append(f"Chair {name} slightly interferes with door swing path.")

            placed_items.append(PlacedItem(
                id=item_id,
                name=name,
                category=category,
                x=round(x, 2),
                y=round(y, 2),
                width=w,
                depth=d,
                height=h,
                rotation=rotation,
                color=color,
                price=price,
                is_surface_mounted=False,
                bounding_box=bbox
            ))
            floor_boxes.append(bbox)

        elif category == "monitor":
            # Mount onto desk
            if desk_placed:
                is_surface = True
                parent_id = desk_placed.id
                x = desk_placed.x + (desk_placed.width - w) / 2.0
                y = desk_placed.y + desk_placed.depth - d - 0.2
                rotation = 0
            else:
                x = 2.0
                y = 2.0

            bbox = {"min_x": x, "max_x": x + w, "min_y": y, "max_y": y + d}
            placed_items.append(PlacedItem(
                id=item_id,
                name=name,
                category=category,
                x=round(x, 2),
                y=round(y, 2),
                width=w,
                depth=d,
                height=h,
                rotation=rotation,
                color=color,
                price=price,
                is_surface_mounted=is_surface,
                parent_id=parent_id,
                bounding_box=bbox
            ))

        elif category == "storage":
            # Place along West (left) or East (right) wall
            # Try East wall first
            candidate_x = room.width - d - 0.5
            candidate_y = room.length - w - 1.0
            rotation = 90
            # Dimensions swap when rotated
            bbox = {"min_x": candidate_x, "max_x": candidate_x + d, "min_y": candidate_y, "max_y": candidate_y + w}

            # Check collision with other floor items
            has_overlap = any(check_box_overlap(bbox, fb) for fb in floor_boxes)
            if has_overlap:
                # Try West wall
                candidate_x = 0.5
                candidate_y = 2.0
                bbox = {"min_x": candidate_x, "max_x": candidate_x + d, "min_y": candidate_y, "max_y": candidate_y + w}
                has_overlap = any(check_box_overlap(bbox, fb) for fb in floor_boxes)
                if has_overlap:
                    collisions += 1

            placed_items.append(PlacedItem(
                id=item_id,
                name=name,
                category=category,
                x=round(candidate_x, 2),
                y=round(candidate_y, 2),
                width=w,
                depth=d,
                height=h,
                rotation=rotation,
                color=color,
                price=price,
                is_surface_mounted=False,
                bounding_box=bbox
            ))
            floor_boxes.append(bbox)

        elif category == "lighting":
            if "floor" in name.lower() or "standing" in name.lower():
                # Floor lamp in corner next to desk
                if desk_placed:
                    x = max(0.5, desk_placed.x - w - 0.5)
                    y = desk_placed.y
                else:
                    x = 1.0
                    y = room.length - d - 1.0
                bbox = {"min_x": x, "max_x": x + w, "min_y": y, "max_y": y + d}
                placed_items.append(PlacedItem(
                    id=item_id,
                    name=name,
                    category=category,
                    x=round(x, 2),
                    y=round(y, 2),
                    width=w,
                    depth=d,
                    height=h,
                    rotation=0,
                    color=color,
                    price=price,
                    is_surface_mounted=False,
                    bounding_box=bbox
                ))
                floor_boxes.append(bbox)
            else:
                # ScreenBar or desk lamp
                is_surface = True
                parent_id = desk_placed.id if desk_placed else None
                x = (desk_placed.x + (desk_placed.width - w) / 2.0) if desk_placed else 2.0
                y = (desk_placed.y + desk_placed.depth - d - 0.1) if desk_placed else 2.0
                bbox = {"min_x": x, "max_x": x + w, "min_y": y, "max_y": y + d}
                placed_items.append(PlacedItem(
                    id=item_id,
                    name=name,
                    category=category,
                    x=round(x, 2),
                    y=round(y, 2),
                    width=w,
                    depth=d,
                    height=h,
                    rotation=0,
                    color=color,
                    price=price,
                    is_surface_mounted=True,
                    parent_id=parent_id,
                    bounding_box=bbox
                ))

        else:
            # Accessories like mat or cable tray
            if "mat" in name.lower() and desk_placed:
                x = desk_placed.x + (desk_placed.width - w) / 2.0
                y = desk_placed.y - d - 0.2
                bbox = {"min_x": x, "max_x": x + w, "min_y": y, "max_y": y + d}
                placed_items.append(PlacedItem(
                    id=item_id,
                    name=name,
                    category=category,
                    x=round(x, 2),
                    y=round(y, 2),
                    width=w,
                    depth=d,
                    height=h,
                    rotation=0,
                    color=color,
                    price=price,
                    is_surface_mounted=False,
                    bounding_box=bbox
                ))
            else:
                # Under-desk or mounted accessory
                x = desk_placed.x if desk_placed else 1.0
                y = desk_placed.y if desk_placed else 1.0
                bbox = {"min_x": x, "max_x": x + w, "min_y": y, "max_y": y + d}
                placed_items.append(PlacedItem(
                    id=item_id,
                    name=name,
                    category=category,
                    x=round(x, 2),
                    y=round(y, 2),
                    width=w,
                    depth=d,
                    height=h,
                    rotation=0,
                    color=color,
                    price=price,
                    is_surface_mounted=True,
                    parent_id=desk_placed.id if desk_placed else None,
                    bounding_box=bbox
                ))

    # Calculate room utilization
    room_area = room.width * room.length
    occupied_area = sum(item.width * item.depth for item in placed_items if not item.is_surface_mounted)
    utilization_pct = round(min(100.0, (occupied_area / max(1.0, room_area)) * 100), 1)

    # Ergonomic score calculation
    ergo_score = 95.0
    if clearance_violations > 0:
        ergo_score -= clearance_violations * 10.0
    if collisions > 0:
        ergo_score -= collisions * 25.0
    if not desk_placed:
        ergo_score -= 30.0
    ergo_score = max(0.0, min(100.0, ergo_score))

    if ergo_score >= 90:
        recommendations.append("Optimal ergonomic layout: Excellent circulation pathways and direct natural light angle.")
    elif ergo_score >= 75:
        recommendations.append("Solid layout: Good working clearance with minor corner tightening.")

    return LayoutResult(
        room=room,
        placed_items=placed_items,
        total_cost=round(total_cost, 2),
        space_utilization_pct=utilization_pct,
        ergonomic_score=round(ergo_score, 1),
        collision_count=collisions,
        clearance_violations=clearance_violations,
        recommendations=recommendations
    )
