"""
Provider-Agnostic AI Service Adapters
Supports Google Gemini, OpenAI, and an Offline/Mock Provider with rich fallbacks.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
import time
import httpx
from backend.core.logging import logger
from backend.ai.prompts import (
    SYSTEM_PROMPT_LECTURE_ASSISTANT,
    build_explain_prompt,
    build_summary_prompt,
    build_mcq_prompt,
    build_analogy_prompt,
    build_code_prompt,
    build_recap_prompt
)

class AIProvider(ABC):
    @abstractmethod
    async def generate_response(self, prompt: str, system_prompt: str = SYSTEM_PROMPT_LECTURE_ASSISTANT) -> Dict[str, Any]:
        pass

    async def explain_slide(self, title: str, text: str, focus: str = "general") -> Dict[str, Any]:
        prompt = build_explain_prompt(title, text, focus)
        return await self.generate_response(prompt)

    async def summarize_slide(self, title: str, text: str) -> Dict[str, Any]:
        prompt = build_summary_prompt(title, text)
        return await self.generate_response(prompt)

    async def generate_mcq(self, title: str, text: str, count: int = 3) -> Dict[str, Any]:
        prompt = build_mcq_prompt(title, text, count)
        return await self.generate_response(prompt)

    async def generate_analogy(self, title: str, text: str) -> Dict[str, Any]:
        prompt = build_analogy_prompt(title, text)
        return await self.generate_response(prompt)

    async def generate_code(self, title: str, text: str, language: str = "python") -> Dict[str, Any]:
        prompt = build_code_prompt(title, text, language)
        return await self.generate_response(prompt)

    async def generate_recap(self, duration_sec: int, slides_count: int, annotations_count: int, topics: List[str]) -> Dict[str, Any]:
        prompt = build_recap_prompt(duration_sec, slides_count, annotations_count, topics)
        return await self.generate_response(prompt)

# -------------------------------------------------------------
# Mock / Offline AI Provider (Zero API Keys required, fast, intelligent)
# -------------------------------------------------------------
class MockAIProvider(AIProvider):
    def __init__(self, model_name: str = "mock-model"):
        self.model_name = model_name

    async def generate_response(self, prompt: str, system_prompt: str = SYSTEM_PROMPT_LECTURE_ASSISTANT) -> Dict[str, Any]:
        start_time = time.time()
        
        # Determine query type from prompt keywords
        p_lower = prompt.lower()
        if "multiple choice questions" in p_lower:
            text = (
                "### Quick Quiz: Comprehension Check\n\n"
                "**Q1. What is the primary purpose of the mechanism discussed on this slide?**\n"
                "- [ ] A) To minimize execution overhead by 50%\n"
                "- [x] B) To establish a decoupled abstraction layer between hardware and presentation logic\n"
                "- [ ] C) To replace local persistence with cloud-only storage\n"
                "- [ ] D) To increase latency in high-frequency streams\n\n"
                "*Explanation: Option B correctly defines the architectural separation of concerns described.*"
            )
        elif "summarize this slide" in p_lower:
            text = (
                "### Key Takeaways\n\n"
                "- **Core Architecture**: The system prioritizes local-first processing, ensuring low-latency gesture interpretation.\n"
                "- **Deterministic Control**: Mode transitions are managed on the edge controller while complex rendering remains host-bound.\n"
                "- **Teaching Flow**: Non-intrusive annotations allow the lecturer to maintain audience focus without breaking stride."
            )
        elif "analogy" in p_lower:
            text = (
                "### Conceptual Analogy\n\n"
                "Think of this mechanism like an **air traffic control tower**: instead of every airplane (sensor or button) "
                "trying to talk directly to every passenger terminal (UI view), they all report to the tower (Manoeuvre Core). "
                "The tower sequences, validates, and routes the signals safely and deterministically."
            )
        elif "code" in p_lower:
            text = (
                "### Python Demonstration\n\n"
                "```python\n"
                "# Example implementation of the slide's algorithm\n"
                "def process_lecture_stream(events: list) -> dict:\n"
                "    \"\"\"Aggregates high-frequency gestures into pedagogical metrics.\"\"\"\n"
                "    total_transitions = sum(1 for e in events if e.get('type') == 'SLIDE_CHANGE')\n"
                "    return {'slide_transitions': total_transitions, 'status': 'OPTIMAL'}\n"
                "```"
            )
        elif "recap" in p_lower:
            text = (
                "### Lecture Executive Recap\n\n"
                "- **Pacing & Coverage**: Steady delivery across all slides, averaging 2.4 minutes per slide.\n"
                "- **Engagement & Highlighting**: Key concepts in Section 2 received targeted vector annotations.\n"
                "- **Follow-up Recommendation**: Begin next class with a 3-minute review of slide 4's core trade-offs."
            )
        else:
            text = (
                "### Slide Explanation\n\n"
                "This slide highlights the interaction between sensor telemetry and host-side execution. "
                "By decoupling the hardware input stream from presentation rendering, educators achieve "
                "smooth, fluid navigation while preserving lecture focus."
            )

        latency_ms = int((time.time() - start_time) * 1000) + 120
        return {
            "response_text": text,
            "provider": "mock",
            "model": self.model_name,
            "latency_ms": latency_ms,
            "tokens_used": 185
        }

# -------------------------------------------------------------
# Google Gemini Provider
# -------------------------------------------------------------
class GeminiProvider(AIProvider):
    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model_name = model_name
        self.endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"

    async def generate_response(self, prompt: str, system_prompt: str = SYSTEM_PROMPT_LECTURE_ASSISTANT) -> Dict[str, Any]:
        start = time.time()
        headers = {"Content-Type": "application/json"}
        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"parts": [{"text": prompt}]}]
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.post(self.endpoint, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                latency_ms = int((time.time() - start) * 1000)
                tokens = data.get("usageMetadata", {}).get("totalTokenCount", 0)
                return {
                    "response_text": text,
                    "provider": "gemini",
                    "model": self.model_name,
                    "latency_ms": latency_ms,
                    "tokens_used": tokens
                }
            except Exception as e:
                logger.error(f"[GEMINI] API request error: {e}")
                raise RuntimeError(f"Gemini API error: {str(e)}")

# -------------------------------------------------------------
# OpenAI Provider
# -------------------------------------------------------------
class OpenAIProvider(AIProvider):
    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model_name = model_name
        self.endpoint = "https://api.openai.com/v1/chat/completions"

    async def generate_response(self, prompt: str, system_prompt: str = SYSTEM_PROMPT_LECTURE_ASSISTANT) -> Dict[str, Any]:
        start = time.time()
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.post(self.endpoint, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                text = data["choices"][0]["message"]["content"]
                latency_ms = int((time.time() - start) * 1000)
                tokens = data.get("usage", {}).get("total_tokens", 0)
                return {
                    "response_text": text,
                    "provider": "openai",
                    "model": self.model_name,
                    "latency_ms": latency_ms,
                    "tokens_used": tokens
                }
            except Exception as e:
                logger.error(f"[OPENAI] API request error: {e}")
                raise RuntimeError(f"OpenAI API error: {str(e)}")

def get_ai_provider(provider_type: str, api_key: str = "", model_name: Optional[str] = None) -> AIProvider:
    p = (provider_type or "mock").lower()
    if p == "gemini" and api_key:
        return GeminiProvider(api_key=api_key, model_name=model_name or "gemini-1.5-flash")
    elif p == "openai" and api_key:
        return OpenAIProvider(api_key=api_key, model_name=model_name or "gpt-4o-mini")
    return MockAIProvider(model_name=model_name or "mock-offline")
