# Manoeuvre AI, Speech & OCR Integration Specification

## 1. Provider-Agnostic Adapter Pattern

Manoeuvre decouples business logic from external AI services through an abstract interface:

```python
class AIProvider(ABC):
    @abstractmethod
    async def generate_response(self, prompt: str, system_prompt: str, context: LectureContext) -> AIResult:
        pass

    @abstractmethod
    async def generate_mcq(self, slide_content: str, count: int = 3) -> list[MCQQuestion]:
        pass

    @abstractmethod
    async def generate_recap(self, session_summary: SessionStats, context: list[str]) -> str:
        pass
```

### Supported Providers:
1. **Google Gemini (`gemini-1.5-flash`, `gemini-1.5-pro`)**:
   - Native multimodal and large context window capability.
   - Configurable through `GEMINI_API_KEY`.
2. **OpenAI (`gpt-4o`, `gpt-4o-mini`)**:
   - Structured JSON outputs and low latency.
   - Configurable through `OPENAI_API_KEY`.
3. **Local Offline / Mock Provider (`mock`)**:
   - Generates deterministic, intelligent responses offline without network or API keys.
   - Used for automated tests, development, and fallback when network is absent or keys are unconfigured.

## 2. Lecture Context Window Management
To avoid ballooning token costs and latency, context is structured systematically:
- **Immediate Slide Context**: Current slide text + OCR layout blocks + active slide notes.
- **Session Trajectory Context**: List of previously viewed slide titles + duration per slide.
- **Recent Transcripts**: Last 3 spoken segments from the lecturer.
- **Previous Annotations**: Types of annotations created on the current slide (e.g., "Lecturer highlighted paragraph 2").

## 3. Speech-to-Text (Voice Mode)
- **Workflow**:
  1. Glove enters `VOICE` mode.
  2. Lecturer holds `ACTION` button -> sends `button_event(button="ACTION", action="press_down", mode="VOICE")`.
  3. Desktop initiates local audio recording from default microphone.
  4. Lecturer speaks a command (e.g. "Explain the formula on this slide in simple terms").
  5. Lecturer releases `ACTION` button -> sends `button_event(button="ACTION", action="release", mode="VOICE")`.
  6. Desktop stops recording and delivers audio buffer to the Speech Transcriber (Whisper API or local offline wav fallback).
  7. Transcript is parsed into an AI query and routed to the active `AIProvider`.
  8. Result is streamed to the AI Workspace and displayed as a floating card on the transparent overlay.

## 4. OCR Slide Layout Engine
- For PDF slides:
  - Text and bounding boxes are extracted directly from vector text elements in the PDF stream.
  - Highlighting maps directly to these vector bounding boxes.
- For raster image slides:
  - Extracted text layout structure format:
    ```json
    [
      {
        "id": "blk_01",
        "text": "Convolutional Neural Networks",
        "bbox": [0.12, 0.08, 0.76, 0.14],
        "confidence": 0.98
      }
    ]
    ```
