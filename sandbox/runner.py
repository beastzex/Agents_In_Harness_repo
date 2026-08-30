"""
Sandbox Execution Engine for TrueForge Agent.
Safely executes layout placement algorithms and computational geometry scripts in an isolated context,
returning telemetry, stdout logs, execution timing, and structured coordinate results.
"""
from typing import Dict, Any, Optional
import io
import sys
import time
import traceback
import json
from .layout_algorithm import RoomConfig, compute_layout, LayoutResult

class SandboxExecutionResult:
    def __init__(
        self,
        success: bool,
        output_data: Optional[Dict[str, Any]] = None,
        stdout_log: str = "",
        stderr_log: str = "",
        execution_time_ms: float = 0.0,
        code_executed: str = "",
        error: Optional[str] = None
    ):
        self.success = success
        self.output_data = output_data or {}
        self.stdout_log = stdout_log
        self.stderr_log = stderr_log
        self.execution_time_ms = round(execution_time_ms, 2)
        self.code_executed = code_executed
        self.error = error

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "execution_time_ms": self.execution_time_ms,
            "stdout": self.stdout_log,
            "stderr": self.stderr_log,
            "output_data": self.output_data,
            "code_executed": self.code_executed,
            "error": self.error
        }

class LayoutSandboxRunner:
    """Executes layout code within an isolated python runtime namespace."""

    def __init__(self, timeout_seconds: float = 5.0):
        self.timeout_seconds = timeout_seconds

    def execute_layout_script(
        self,
        room_data: Dict[str, Any],
        items_data: list,
        custom_code: Optional[str] = None
    ) -> SandboxExecutionResult:
        """
        Executes spatial placement algorithm in sandbox.
        If custom_code is provided, runs it in an isolated global scope with RoomConfig and compute_layout injected.
        """
        start_time = time.perf_counter()
        stdout_capture = io.StringIO()
        stderr_capture = io.StringIO()

        old_stdout = sys.stdout
        old_stderr = sys.stderr

        default_code = f"""# TrueForge Layout Optimization Sandbox Script
import json
print(f"[Sandbox] Initializing room grid: {room_data.get('width', 12)}x{room_data.get('length', 10)} ft")
print(f"[Sandbox] Solving placement constraints for {len(items_data)} items...")

room = RoomConfig(**room_data)
result = compute_layout(room, items_data)

print(f"[Sandbox] Collision check: {{result.collision_count}} collisions, {{result.clearance_violations}} clearance alerts.")
print(f"[Sandbox] Spatial utilization: {{result.space_utilization_pct}}%, Ergonomic score: {{result.ergonomic_score}}/100")
sandbox_result = result.model_dump()
"""
        code_to_run = custom_code if custom_code else default_code

        # Strict whitelist of allowed modules in sandbox
        ALLOWED_MODULES = {"math", "json", "random", "typing", "collections"}
        FORBIDDEN_PATTERNS = ["__subclasses__", "__bases__", "__globals__", "__builtins__", "os.", "sys.", "subprocess", "shutil", "socket", "open("]

        if custom_code and any(pat in custom_code for pat in FORBIDDEN_PATTERNS):
            return SandboxExecutionResult(
                success=False,
                error="Sandbox Security Violation: Dangerous instruction or module access detected.",
                code_executed=custom_code
            )

        def safe_import(name, *args, **kwargs):
            if name in ALLOWED_MODULES:
                return __import__(name, *args, **kwargs)
            raise ImportError(f"Sandbox Security Violation: Module '{name}' is not permitted.")

        try:
            sys.stdout = stdout_capture
            sys.stderr = stderr_capture

            safe_builtins = {
                "print": print,
                "len": len,
                "range": range,
                "min": min,
                "max": max,
                "sum": sum,
                "round": round,
                "dict": dict,
                "list": list,
                "str": str,
                "int": int,
                "float": float,
                "bool": bool,
                "enumerate": enumerate,
                "isinstance": isinstance,
                "abs": abs,
                "zip": zip,
                "__import__": safe_import,
            }

            sandbox_globals = {
                "RoomConfig": RoomConfig,
                "compute_layout": compute_layout,
                "room_data": room_data,
                "items_data": items_data,
                "json": json,
                "__builtins__": safe_builtins
            }
            sandbox_locals = {}

            # Execute code in isolated namespace
            exec(code_to_run, sandbox_globals, sandbox_locals)

            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            output_data = sandbox_locals.get("sandbox_result") or sandbox_globals.get("sandbox_result")

            # Fallback if variable wasn't directly assigned in custom script
            if output_data is None:
                room = RoomConfig(**room_data)
                output_data = compute_layout(room, items_data).model_dump()

            return SandboxExecutionResult(
                success=True,
                output_data=output_data,
                stdout_log=stdout_capture.getvalue(),
                stderr_log=stderr_capture.getvalue(),
                execution_time_ms=elapsed_ms,
                code_executed=code_to_run
            )

        except Exception as e:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            err_msg = f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
            return SandboxExecutionResult(
                success=False,
                output_data={},
                stdout_log=stdout_capture.getvalue(),
                stderr_log=stderr_capture.getvalue(),
                execution_time_ms=elapsed_ms,
                code_executed=code_to_run,
                error=err_msg
            )
        finally:
            sys.stdout = old_stdout
            sys.stderr = old_stderr

sandbox_runner_instance = LayoutSandboxRunner()
