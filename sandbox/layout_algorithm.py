"""
Greedy 2D Rectangle-Packing Spatial Layout Algorithm for TrueForge Sandbox.
Calculates collision-free coordinate placements, rotations, unplaced items, and budget adherence.
"""
from typing import List, Dict, Any, Tuple, Optional
import math
from pydantic import BaseModel, Field

class RoomDimensions(BaseModel):
    width_ft: float = 12.0
    length_ft: float = 10.0
    door_wall: str = "south"
    door_position_ft: float = 3.0
    door_width_ft: float = 3.0

class ItemPlacement(BaseModel):
    item_id: str
    x: float
    y: float
    rotation: int = 0
    name: Optional[str] = None
    category: Optional[str] = None
    width_ft: Optional[float] = None
    depth_ft: Optional[float] = None
    price: Optional[float] = None

class LayoutAlgorithmOutput(BaseModel):
    fits: bool
    placements: List[ItemPlacement]
    unplaced_item_ids: List[str]
    total_cost: float
    over_budget: bool
    space_utilization_pct: float = 0.0

def check_overlap(box1: Dict[str, float], box2: Dict[str, float], padding: float = 0.1) -> bool:
    """Check if two axis-aligned bounding boxes [min_x, max_x, min_y, max_y] overlap."""
    if box1["max_x"] + padding <= box2["min_x"] or box2["max_x"] + padding <= box1["min_x"]:
        return False
    if box1["max_y"] + padding <= box2["min_y"] or box2["max_y"] + padding <= box1["min_y"]:
        return False
    return True

def pack_furniture_layout(
    room: Dict[str, Any],
    items: List[Dict[str, Any]],
    budget: Optional[float] = None
) -> Dict[str, Any]:
    """
    Honest Greedy Rectangle-Packing Algorithm:
    1. Extracts room dimensions (width_ft, length_ft).
    2. Converts item dimensions from inches (width_in, depth_in) to feet.
    3. Sorts items by footprint area descending (larger floor anchors first).
    4. Walks 2D grid of room coordinates in 0.5ft increments.
    5. Tests rotations (0 and 90 degrees) to fit without overlapping previous items or door swing.
    6. Rejects and reports any items that do not fit.
    7. Evaluates total cost against budget.
    """
    # Extract room dimensions
    width_ft = float(room.get("width_ft", room.get("width", 12.0)))
    length_ft = float(room.get("length_ft", room.get("length", 10.0)))
    budget_limit = float(budget if budget is not None else room.get("budget", 2000.0))

    door_pos = float(room.get("door_position_ft", room.get("door_position", 3.0)))
    door_w = float(room.get("door_width_ft", room.get("door_width", 3.0)))
    door_wall = room.get("door_wall", "south")

    # Define reserved door swing clearance zone
    door_box = {"min_x": 0.0, "max_x": 0.0, "min_y": 0.0, "max_y": 0.0}
    if door_wall == "south":
        door_box = {"min_x": door_pos, "max_x": min(width_ft, door_pos + door_w), "min_y": 0.0, "max_y": min(length_ft, door_w + 0.5)}
    elif door_wall == "north":
        door_box = {"min_x": door_pos, "max_x": min(width_ft, door_pos + door_w), "min_y": max(0.0, length_ft - door_w - 0.5), "max_y": length_ft}

    occupied_boxes: List[Dict[str, float]] = [door_box]
    placements: List[Dict[str, Any]] = []
    unplaced_item_ids: List[str] = []
    total_cost = 0.0

    # Parse and normalize items (convert inches to feet)
    normalized_items = []
    for item in items:
        item_id = str(item.get("id") or item.get("item_id", "item"))
        name = str(item.get("name", "Furniture Item"))
        category = str(item.get("category", "decor")).lower()
        price = float(item.get("price", 0.0))
        
        # Dimensions in inches converted to feet
        if "width_in" in item:
            w_ft = round(float(item["width_in"]) / 12.0, 2)
            d_ft = round(float(item.get("depth_in", item["width_in"])) / 12.0, 2)
        elif "width" in item:
            w_ft = float(item["width"])
            d_ft = float(item.get("depth", 2.0))
        else:
            w_ft, d_ft = 2.0, 2.0

        area = w_ft * d_ft
        total_cost += price
        normalized_items.append({
            "item_id": item_id,
            "name": name,
            "category": category,
            "price": price,
            "w_ft": w_ft,
            "d_ft": d_ft,
            "area": area
        })

    # Sort largest floor footprint items first
    normalized_items.sort(key=lambda it: it["area"], reverse=True)

    grid_step = 0.5  # 6-inch grid walking
    wall_margin = 0.25 # 3-inch margin from walls

    for it in normalized_items:
        placed = False
        w = it["w_ft"]
        d = it["d_ft"]

        # Try orientations: rotation 0 (w x d) then rotation 90 (d x w)
        orientations = [(w, d, 0), (d, w, 90)]

        # Search grid from back wall (North, max Y) towards front (South, Y=0)
        # to place main furniture against walls
        y_steps = [round(y * grid_step, 2) for y in range(int((length_ft - min(w, d) - wall_margin) / grid_step), -1, -1)]
        x_steps = [round(x * grid_step, 2) for x in range(0, int((width_ft - min(w, d) - wall_margin) / grid_step) + 1)]

        for cur_w, cur_d, rot in orientations:
            if placed:
                break
            for y in y_steps:
                if placed:
                    break
                if y + cur_d > length_ft - wall_margin or y < wall_margin:
                    continue

                for x in x_steps:
                    if x + cur_w > width_ft - wall_margin or x < wall_margin:
                        continue

                    candidate_box = {
                        "min_x": x,
                        "max_x": x + cur_w,
                        "min_y": y,
                        "max_y": y + cur_d
                    }

                    # Check overlap against all occupied boxes
                    has_collision = any(check_overlap(candidate_box, box) for box in occupied_boxes)
                    if not has_collision:
                        # Placed successfully!
                        placements.append({
                            "item_id": it["item_id"],
                            "name": it["name"],
                            "category": it["category"],
                            "price": it["price"],
                            "x": round(x, 2),
                            "y": round(y, 2),
                            "rotation": rot,
                            "width_ft": round(cur_w, 2),
                            "depth_ft": round(cur_d, 2)
                        })
                        occupied_boxes.append(candidate_box)
                        placed = True
                        break

        if not placed:
            unplaced_item_ids.append(it["item_id"])

    # Over budget check
    over_budget = total_cost > budget_limit
    fits = len(unplaced_item_ids) == 0 and not over_budget

    # Spatial utilization calculation
    room_area = width_ft * length_ft
    placed_area = sum(p.get("width_ft", 2.0) * p.get("depth_ft", 2.0) for p in placements)
    utilization_pct = round(min(100.0, (placed_area / max(1.0, room_area)) * 100), 1)

    # Return exact contract shape
    return {
        "fits": fits,
        "placements": placements,
        "unplaced_item_ids": unplaced_item_ids,
        "total_cost": round(total_cost, 2),
        "over_budget": over_budget,
        "space_utilization_pct": utilization_pct
    }
