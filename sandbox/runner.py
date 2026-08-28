"""
Sandbox Execution Engine for TrueForge Agent.
Safely executes layout placement algorithms and computational geometry scripts in an isolated context,
returning telemetry, stdout logs, execution timing, and structured coordinate results.
"""
from typing import Dict, Any, Optional, List
import io
import sys
import time
import traceback
import json
from .layout_algorithm import pack_furniture_layout, check_overlap

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
        budget: Optional[float] = None,
        custom_code: Optional[str] = None
    ) -> SandboxExecutionResult:
        """
        Executes dynamic greedy rectangle packing code in isolated sandbox namespace.
        """
        start_time = time.perf_counter()
        stdout_capture = io.StringIO()
        stderr_capture = io.StringIO()

        old_stdout = sys.stdout
        old_stderr = sys.stderr

        width_ft = room_data.get("width_ft", room_data.get("width", 12.0))
        length_ft = room_data.get("length_ft", room_data.get("length", 10.0))
        budget_val = budget if budget is not None else room_data.get("budget", 2000.0)

        # Dynamic agent-generated script template
        default_code = f"""# TrueForge Layout Geometry & Packing Sandbox
import json

print(f"[Sandbox] Initializing room grid: {width_ft} ft x {length_ft} ft (Budget: ${budget_val:.2f})")
print(f"[Sandbox] Executing greedy 2D rectangle packing for {len(items_data)} items...")

layout_output = pack_furniture_layout(room_data, items_data, budget={budget_val})

print(f"[Sandbox] Packing completed. Placements: {{len(layout_output['placements'])}}, Unplaced: {{len(layout_output['unplaced_item_ids'])}}")
print(f"[Sandbox] Total cost: ${{layout_output['total_cost']:.2f}}, Fits room & budget: {{layout_output['fits']}}")

sandbox_result = layout_output
"""
        code_to_run = custom_code if custom_code else default_code

        # Whitelist and security checks
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
                "sorted": sorted,
                "__import__": safe_import,
            }

            sandbox_globals = {
                "pack_furniture_layout": pack_furniture_layout,
                "check_overlap": check_overlap,
                "room_data": room_data,
                "items_data": items_data,
                "budget": budget_val,
                "json": json,
                "__builtins__": safe_builtins
            }
            sandbox_locals = {}

            # Execute code in isolated sandbox namespace
            exec(code_to_run, sandbox_globals, sandbox_locals)

            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            output_data = sandbox_locals.get("sandbox_result") or sandbox_globals.get("sandbox_result")

            if output_data is None:
                output_data = pack_furniture_layout(room_data, items_data, budget_val)

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
