"""
Unit tests for Sandbox Layout Algorithm and isolated execution runner.
"""
import pytest
from sandbox.layout_algorithm import RoomConfig, compute_layout, check_box_overlap
from sandbox.runner import LayoutSandboxRunner

@pytest.fixture
def sample_items():
    return [
        {
            "id": "desk-1",
            "name": "Standing Desk",
            "category": "desk",
            "width": 5.0,
            "depth": 2.5,
            "height": 2.8,
            "price": 499.0,
            "color": "#3B82F6"
        },
        {
            "id": "chair-1",
            "name": "Mesh Ergonomic Chair",
            "category": "chair",
            "width": 2.2,
            "depth": 2.2,
            "height": 3.8,
            "price": 349.0,
            "color": "#10B981"
        },
        {
            "id": "monitor-1",
            "name": "Ultrawide Monitor",
            "category": "monitor",
            "width": 2.8,
            "depth": 0.8,
            "height": 1.8,
            "price": 449.0,
            "color": "#8B5CF6"
        },
        {
            "id": "storage-1",
            "name": "Bookshelf Credenza",
            "category": "storage",
            "width": 3.5,
            "depth": 1.2,
            "height": 4.5,
            "price": 219.0,
            "color": "#F59E0B"
        }
    ]

def test_box_overlap_detection():
    """Verify 2D bounding box intersection logic."""
    b1 = {"min_x": 0.0, "max_x": 4.0, "min_y": 0.0, "max_y": 4.0}
    b2 = {"min_x": 3.0, "max_x": 7.0, "min_y": 3.0, "max_y": 7.0}
    b3 = {"min_x": 5.0, "max_x": 8.0, "min_y": 5.0, "max_y": 8.0}
    
    assert check_box_overlap(b1, b2) is True
    assert check_box_overlap(b1, b3) is False

def test_compute_layout_placements(sample_items):
    """Verify layout coordinates are calculated without floor collisions."""
    room = RoomConfig(width=12.0, length=10.0, door_wall="south", door_position=3.0, door_width=3.0)
    result = compute_layout(room, sample_items)

    assert len(result.placed_items) == 4
    assert result.collision_count == 0
    assert result.total_cost == 499.0 + 349.0 + 449.0 + 219.0
    assert result.ergonomic_score >= 80.0
    assert result.space_utilization_pct > 0.0

    # Desk check
    desk = next(i for i in result.placed_items if i.category == "desk")
    assert desk.x >= 0.0 and desk.y >= 0.0

    # Chair should be placed in front of desk
    chair = next(i for i in result.placed_items if i.category == "chair")
    assert chair.y < desk.y

    # Monitor should be marked as surface mounted on desk
    monitor = next(i for i in result.placed_items if i.category == "monitor")
    assert monitor.is_surface_mounted is True
    assert monitor.parent_id == desk.id

def test_sandbox_runner_execution(sample_items):
    """Verify sandbox isolates execution and captures stdout and telemetry."""
    runner = LayoutSandboxRunner()
    room_data = {"width": 14.0, "length": 12.0, "door_wall": "south", "door_position": 2.0, "door_width": 3.0}

    res = runner.execute_layout_script(room_data, sample_items)

    assert res.success is True
    assert res.execution_time_ms > 0.0
    assert "[Sandbox] Initializing room grid" in res.stdout_log
    assert "[Sandbox] Collision check:" in res.stdout_log
    assert "placed_items" in res.output_data
    assert len(res.output_data["placed_items"]) == 4
    assert res.error is None
