"""
Sandbox package for layout execution and spatial optimization.
"""
from .layout_algorithm import RoomConfig, PlacedItem, LayoutResult, compute_layout, check_box_overlap
from .runner import LayoutSandboxRunner, SandboxExecutionResult, sandbox_runner_instance

__all__ = [
    "RoomConfig",
    "PlacedItem",
    "LayoutResult",
    "compute_layout",
    "check_box_overlap",
    "LayoutSandboxRunner",
    "SandboxExecutionResult",
    "sandbox_runner_instance"
]
