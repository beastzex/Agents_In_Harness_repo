"""
Unit tests for Sandbox Layout Algorithm and isolated execution runner.
Verifies greedy 2D rectangle packing, coordinate placements, unplaced item handling, and budget checks.
"""
import pytest
from sandbox.layout_algorithm import pack_furniture_layout, check_overlap
from sandbox.runner import LayoutSandboxRunner

@pytest.fixture
def sample_items():
    return [
        {
            "id": "table-1",
            "name": "Standing Desk 60x30",
            "category": "tables",
            "width_in": 60.0,
            "depth_in": 30.0,
            "price": 499.0
        },
        {
            "id": "chair-1",
            "name": "Ergo Mesh Chair",
            "category": "seating",
            "width_in": 26.0,
            "depth_in": 26.0,
            "price": 349.0
        },
        {
            "id": "light-1",
            "name": "Arc Floor Lamp",
            "category": "lighting",
            "width_in": 18.0,
            "depth_in": 18.0,
            "price": 139.0
        },
        {
            "id": "storage-1",
            "name": "Bookshelf Credenza",
            "category": "storage",
            "width_in": 44.0,
            "depth_in": 16.0,
            "price": 269.0
        }
    ]

def test_box_overlap_detection():
    """Verify 2D bounding box intersection logic."""
    b1 = {"min_x": 0.0, "max_x": 4.0, "min_y": 0.0, "max_y": 4.0}
    b2 = {"min_x": 3.0, "max_x": 7.0, "min_y": 3.0, "max_y": 7.0}
    b3 = {"min_x": 5.0, "max_x": 8.0, "min_y": 5.0, "max_y": 8.0}
    
    assert check_overlap(b1, b2) is True
    assert check_overlap(b1, b3) is False

def test_greedy_rectangle_packing_success(sample_items):
    """Verify all items are placed without overlap in standard 12x10 room."""
    room = {"width_ft": 12.0, "length_ft": 10.0, "door_wall": "south", "door_position_ft": 3.0, "door_width_ft": 3.0}
    result = pack_furniture_layout(room, sample_items, budget=1500.0)

    assert result["fits"] is True
    assert len(result["placements"]) == 4
    assert len(result["unplaced_item_ids"]) == 0
    assert result["total_cost"] == 499.0 + 349.0 + 139.0 + 269.0
    assert result["over_budget"] is False
    assert result["space_utilization_pct"] > 0.0

    # Ensure no placed items overlap each other
    boxes = []
    for p in result["placements"]:
        box = {
            "min_x": p["x"],
            "max_x": p["x"] + p["width_ft"],
            "min_y": p["y"],
            "max_y": p["y"] + p["depth_ft"]
        }
        for existing in boxes:
            assert check_overlap(box, existing) is False, f"Overlap detected between {p['name']} and existing item"
        boxes.append(box)

def test_greedy_packing_unplaced_items_in_tiny_room(sample_items):
    """Verify algorithm rejects and reports items that do not fit in a 3x3 ft room."""
    tiny_room = {"width_ft": 3.0, "length_ft": 3.0}
    result = pack_furniture_layout(tiny_room, sample_items, budget=2000.0)

    # Some items won't fit
    assert len(result["unplaced_item_ids"]) > 0
    assert result["fits"] is False

def test_greedy_packing_over_budget_detection(sample_items):
    """Verify over_budget flag is set when total cost exceeds budget."""
    room = {"width_ft": 12.0, "length_ft": 10.0}
    # Set low budget of $500 (items sum to >$1200)
    result = pack_furniture_layout(room, sample_items, budget=500.0)

    assert result["over_budget"] is True
    assert result["fits"] is False

def test_sandbox_runner_execution(sample_items):
    """Verify sandbox isolates execution and captures stdout and telemetry."""
    runner = LayoutSandboxRunner()
    room_data = {"width_ft": 14.0, "length_ft": 12.0, "door_wall": "south"}

    res = runner.execute_layout_script(room_data, sample_items, budget=1600.0)

    assert res.success is True
    assert res.execution_time_ms > 0.0
    assert "[Sandbox] Initializing room grid" in res.stdout_log
    assert "[Sandbox] Packing completed" in res.stdout_log
    assert "placements" in res.output_data
    assert len(res.output_data["placements"]) == 4
    assert res.error is None
