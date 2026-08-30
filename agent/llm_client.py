"""
Groq LLM Client for TrueForge Agent.
Uses Groq's OpenAI-compatible API to power dynamic agent reasoning with GPT-OSS-120B.
"""
import os
import json
import logging
from pathlib import Path
import httpx
from typing import Optional, List, Dict, Any

try:
    from dotenv import load_dotenv
    _env_path = Path(__file__).resolve().parent.parent / ".env"
    if _env_path.exists():
        load_dotenv(_env_path, override=True)
except Exception:
    pass

logger = logging.getLogger("llm_client")

class GroqLLMClient:
    """Async LLM client using Groq's OpenAI-compatible chat completions endpoint."""

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "")
        self.model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        self.base_url = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
        self.enabled = bool(self.api_key)
        
        if self.enabled:
            logger.info(f"Groq LLM client initialized with model: {self.model}")
        else:
            logger.warning("GROQ_API_KEY not set — LLM reasoning will use deterministic fallback messages.")

    async def generate_reasoning(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 500,
    ) -> str:
        """
        Generate a reasoning response from the LLM.
        Falls back to a deterministic message if the API is unavailable.
        """
        if not self.enabled:
            return user_prompt  # Fallback: use the deterministic message

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                        "stream": False,
                    },
                )

                if response.status_code != 200:
                    logger.warning(f"Groq API returned {response.status_code}: {response.text[:200]}")
                    return user_prompt  # Fallback

                data = response.json()
                message = data.get("choices", [{}])[0].get("message", {})
                # GPT-OSS-120B is a reasoning model: output may be in 'reasoning' field 
                # instead of 'content'. Check both, preferring 'content' if non-empty.
                content = message.get("content", "") or ""
                reasoning = message.get("reasoning", "") or ""
                result = content.strip() if content.strip() else reasoning.strip()
                return result if result else user_prompt

        except httpx.TimeoutException:
            logger.warning("Groq API request timed out — using fallback reasoning.")
            return user_prompt
        except Exception as e:
            logger.warning(f"Groq API error: {e} — using fallback reasoning.")
            return user_prompt

    async def select_best_item(
        self,
        items: List[Dict[str, Any]],
        context: str,
        budget_remaining: float,
    ) -> int:
        """
        Ask the LLM to pick the best item index from a list based on context.
        Returns the 0-based index of the best item. Falls back to 0 if unavailable.
        """
        if not self.enabled or not items:
            return 0

        items_summary = "\n".join([
            f"[{i}] {item.get('name', 'Unknown')} — ${item.get('price', 0)} — {item.get('material', '')} — {item.get('dimensions', {}).get('width_in', '?')}\"W × {item.get('dimensions', {}).get('depth_in', '?')}\"D"
            for i, item in enumerate(items)
        ])

        prompt = f"""Given these furniture options for a renovation project:

{items_summary}

Context: {context}
Remaining budget: ${budget_remaining:.2f}

Which item index (0-{len(items)-1}) is the best choice? Reply with ONLY the number."""

        try:
            result = await self.generate_reasoning(
                system_prompt="You are a furniture selection assistant. Reply with only a single number — the index of the best item.",
                user_prompt=prompt,
                temperature=0.3,
                max_tokens=10,
            )
            # Extract number from response
            for char in result.strip():
                if char.isdigit():
                    idx = int(char)
                    if 0 <= idx < len(items):
                        return idx
            return 0
        except Exception:
            return 0


# System prompts for different reasoning stages
SYSTEM_PROMPTS = {
    "planning": """You are a senior autonomous renovation architect AI agent. You are analyzing a room renovation request.
Your job is to produce a brief, precise 2-3 sentence analysis of the spatial constraints, aesthetic goals, and budget strategy.
Be specific about measurements and design principles. Sound confident and technical.""",

    "search_strategy": """You are an autonomous furniture procurement agent reasoning about which catalog items to search for.
Explain your search strategy in 1-2 concise sentences. Reference the specific room dimensions, style, and budget constraints.
Sound deliberate and calculated.""",

    "item_evaluation": """You are evaluating a furniture item that was returned from a live MCP catalog search.
Explain in 1-2 sentences why this item was selected — mention its dimensions, material quality, price-to-value ratio, and spatial fit.
Be precise about clearance margins and budget impact.""",

    "sandbox_reasoning": """You are preparing to run a deterministic spatial physics computation in a sandboxed Python container.
Explain in 1-2 sentences what geometric calculations will be performed — reference Shapely geometry, rectangle packing, door arc clearances, and collision detection.
Sound technical and precise.""",

    "approval_gate": """You are an AI agent that has reached a security gate. A sensitive financial action (place_order) requires explicit human authorization.
Explain in 1-2 sentences why execution is halted and what the user needs to approve. Reference the exact dollar amount and item count.
Sound serious about security and trust.""",
}

# Global singleton
llm_client = GroqLLMClient()
