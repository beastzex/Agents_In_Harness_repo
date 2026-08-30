"""
Live AI Copilot for Real-Time Spatial Layout Adjustments.
Translates user conversational instructions (e.g. 'move sofa towards wall', 'move bed to north wall', 'rotate chair 90 degrees')
into live coordinate updates on the 2D architectural blueprint floor plan using GPT-OSS-120B.
"""
from typing import List, Dict, Any, Optional
import json
import logging
from pathlib import Path
from pydantic import BaseModel

try:
    from dotenv import load_dotenv
    _env_path = Path(__file__).resolve().parent.parent / ".env"
    if _env_path.exists():
        load_dotenv(_env_path, override=True)
except Exception:
    pass

from .llm_client import llm_client

logger = logging.getLogger("ai_copilot")

class LiveDesignCopilot:
    """Processes natural language room redesign instructions and recalculates 2D coordinates."""

    def __init__(self):
        self.llm = llm_client

    async def process_instruction(
        self,
        instruction: str,
        room: Dict[str, Any],
        items: List[Dict[str, Any]],
        current_theme: str = "cad-architectural"
    ) -> Dict[str, Any]:
        """
        Takes user instruction, current room spec, and items, then uses GPT-OSS-120B
        to return updated coordinates (xFt, yFt, rotationDeg) and an architectural explanation.
        """
        width_ft = float(room.get("width_ft", room.get("width", 16.0)))
        length_ft = float(room.get("length_ft", room.get("length", 12.0)))

        items_summary = []
        for it in items:
            items_summary.append({
                "id": it.get("id"),
                "name": it.get("name"),
                "category": it.get("category"),
                "current_x": it.get("xFt", it.get("positionX", 2.0)),
                "current_y": it.get("yFt", it.get("positionY", 2.0)),
                "current_rotation": it.get("rotationDeg", 0),
                "width_ft": it.get("widthFt", round((it.get("dimensions", {}).get("width", 36) / 12), 2)),
                "depth_ft": it.get("depthFt", round((it.get("dimensions", {}).get("depth", 24) / 12), 2)),
            })

        system_prompt = f"""You are an expert AI Architectural Design Copilot.
You modify furniture placements inside a {width_ft}ft wide by {length_ft}ft long room in real-time.
Room boundaries: X from 0.8 to {width_ft - 0.8} ft, Y from 0.8 to {length_ft - 0.8} ft.
South entry door is at X=3.0 to 6.0 ft, Y={length_ft} ft. Keep 36" clearance near the door.

When the user asks to adjust the layout:
1. Target the specific item mentioned (e.g. sofa, bed, desk, table, chair, nightstand, bookshelf, lamp).
2. Compute the new x, y, and rotation for items.
3. If the user mentions a theme ('cad', 'blueprint', 'warm editorial', 'cyber emerald', 'oled dark'), suggest it.
4. Return STRICT JSON with this exact schema:
{{
  "reply": "Conversational explanation of changes in 1-2 crisp architectural sentences.",
  "suggested_theme": "cad-architectural" | "cyber-emerald" | "classic-blueprint" | "warm-editorial" | "oled-monochrome" | null,
  "placements": [
    {{
      "id": "item_id_here",
      "x": float_coordinate,
      "y": float_coordinate,
      "rotation": 0 | 90 | 180 | 270
    }}
  ]
}}"""

        user_prompt = f"""Current Furniture State in {width_ft}x{length_ft}ft room:
{json.dumps(items_summary, indent=2)}

User Instruction: "{instruction}"
Current Theme: {current_theme}

Produce the updated layout JSON:"""

        # Try LLM first
        if self.llm.enabled:
            try:
                llm_text = await self.llm.generate_reasoning(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    temperature=0.3,
                    max_tokens=600
                )

                start_idx = llm_text.find("{")
                end_idx = llm_text.rfind("}")
                if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                    json_str = llm_text[start_idx:end_idx + 1]
                    parsed = json.loads(json_str)
                    
                    reply = parsed.get("reply", "Layout updated based on your architectural design instruction.")
                    theme = parsed.get("suggested_theme")
                    placements_list = parsed.get("placements", [])

                    if placements_list:
                        placement_map = {p.get("id"): p for p in placements_list if isinstance(p, dict)}
                        updated_items = []
                        for it in items:
                            it_copy = dict(it)
                            if it_copy.get("id") in placement_map:
                                p = placement_map[it_copy.get("id")]
                                it_copy["xFt"] = float(p.get("x", it_copy.get("xFt", 2.0)))
                                it_copy["yFt"] = float(p.get("y", it_copy.get("yFt", 2.0)))
                                it_copy["rotationDeg"] = int(p.get("rotation", it_copy.get("rotationDeg", 0)))
                            updated_items.append(it_copy)

                        return {
                            "success": True,
                            "reply": reply,
                            "updated_items": updated_items,
                            "suggested_theme": theme,
                            "instruction": instruction
                        }
            except Exception as e:
                logger.warning(f"Error executing LLM copilot reasoning: {e}")

        # High-Fidelity Intelligent Deterministic Semantic Copilot
        lowered = instruction.lower().strip()
        updated_items = []
        reply = "Adjusted spatial coordinates to align with your design request."
        theme = None

        # Theme detection
        if "cad" in lowered or "black and white" in lowered or "draft" in lowered:
            theme = "cad-architectural"
            reply = "Switched to Architectural CAD drafting theme."
        elif "blueprint" in lowered or "blue" in lowered or "navy" in lowered:
            theme = "classic-blueprint"
            reply = "Switched to Classic Navy Architectural Blueprint theme."
        elif "editorial" in lowered or "warm" in lowered or "stone" in lowered or "cream" in lowered:
            theme = "warm-editorial"
            reply = "Switched to Warm Editorial Minimalist styling."
        elif "dark" in lowered or "oled" in lowered or "black" in lowered:
            theme = "oled-monochrome"
            reply = "Switched to OLED Monochrome Deep Pitch Black theme."
        elif "green" in lowered or "emerald" in lowered or "matrix" in lowered:
            theme = "cyber-emerald"
            reply = "Switched to Cyber Emerald Matrix theme."

        # Target item detection
        target_name = None
        if "sofa" in lowered or "couch" in lowered or "sectional" in lowered:
            target_name = "sofa"
        elif "bed" in lowered:
            target_name = "bed"
        elif "desk" in lowered or "table" in lowered or "coffee" in lowered:
            target_name = "table"
        elif "chair" in lowered or "seating" in lowered:
            target_name = "chair"
        elif "shelf" in lowered or "bookshelf" in lowered or "credenza" in lowered or "dresser" in lowered:
            target_name = "storage"
        elif "lamp" in lowered or "light" in lowered:
            target_name = "lamp"

        for idx, it in enumerate(items):
            it_copy = dict(it)
            w_ft = it_copy.get("widthFt", round((it_copy.get("dimensions", {}).get("width", 36) / 12), 2))
            d_ft = it_copy.get("depthFt", round((it_copy.get("dimensions", {}).get("depth", 24) / 12), 2))
            cur_x = float(it_copy.get("xFt", 2.0))
            cur_y = float(it_copy.get("yFt", 2.0))
            cur_rot = int(it_copy.get("rotationDeg", 0))

            it_name_lower = it_copy.get("name", "").lower()
            it_cat_lower = it_copy.get("category", "").lower()

            matches_target = False
            if target_name:
                if target_name == "sofa" and ("sofa" in it_name_lower or "couch" in it_name_lower or it_cat_lower == "seating"):
                    matches_target = True
                elif target_name == "bed" and ("bed" in it_name_lower or it_cat_lower == "beds"):
                    matches_target = True
                elif target_name == "table" and ("table" in it_name_lower or "desk" in it_name_lower or it_cat_lower == "tables"):
                    matches_target = True
                elif target_name == "chair" and ("chair" in it_name_lower or it_cat_lower == "seating"):
                    matches_target = True
                elif target_name == "storage" and ("shelf" in it_name_lower or "dresser" in it_name_lower or it_cat_lower == "storage"):
                    matches_target = True
                elif target_name == "lamp" and ("lamp" in it_name_lower or it_cat_lower == "lighting"):
                    matches_target = True

            # Execute specific movement on targeted item or globally
            if "wall" in lowered or "north" in lowered or "up" in lowered:
                if target_name and matches_target:
                    it_copy["yFt"] = 1.0
                    it_copy["xFt"] = round((width_ft - w_ft) / 2, 2)
                    reply = f"Moved {it_copy.get('name')} flush against the North wall."
                elif not target_name:
                    if it_cat_lower in ["beds", "tables", "seating"]:
                        it_copy["yFt"] = 1.0
                        it_copy["xFt"] = round((width_ft - w_ft) / 2, 2)
                    elif it_cat_lower in ["storage", "nightstands"]:
                        it_copy["xFt"] = round(width_ft - w_ft - 1.0, 2)
                    reply = "Anchored primary furniture flush against the perimeter walls to open up the central floor."

            elif "south" in lowered or "down" in lowered:
                if target_name and matches_target:
                    it_copy["yFt"] = round(length_ft - d_ft - 1.5, 2)
                    reply = f"Shifted {it_copy.get('name')} toward the South wall with entry clearance."

            elif "east" in lowered or "right" in lowered:
                if target_name and matches_target:
                    it_copy["xFt"] = round(width_ft - w_ft - 1.0, 2)
                    reply = f"Positioned {it_copy.get('name')} along the East wall."

            elif "west" in lowered or "left" in lowered:
                if target_name and matches_target:
                    it_copy["xFt"] = 1.0
                    reply = f"Positioned {it_copy.get('name')} along the West wall."

            elif "rotate" in lowered:
                if target_name and matches_target:
                    it_copy["rotationDeg"] = (cur_rot + 90) % 360
                    reply = f"Rotated {it_copy.get('name')} by 90°."
                elif not target_name:
                    it_copy["rotationDeg"] = (cur_rot + 90) % 360
                    reply = "Rotated furniture pieces 90° for optimal natural light orientation."

            elif "center" in lowered:
                it_copy["xFt"] = round((width_ft - w_ft) / 2 + (idx - 1) * 1.5, 2)
                it_copy["yFt"] = round((length_ft - d_ft) / 2, 2)
                reply = "Centered the primary furniture arrangement with 360° perimeter walkways."

            elif "walkway" in lowered or "door" in lowered or "clearance" in lowered:
                if cur_y > length_ft - 4.5 and cur_x < 7.0:
                    it_copy["yFt"] = max(1.5, length_ft - 5.5)
                reply = "Maintained a generous 48\" unobstructed walkway from the main entrance door."

            updated_items.append(it_copy)

        return {
            "success": True,
            "reply": reply,
            "updated_items": updated_items,
            "suggested_theme": theme,
            "instruction": instruction
        }

live_copilot_instance = LiveDesignCopilot()
