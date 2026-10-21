"""
Teaching Analytics & History API Routes
Provides session metrics, pacing analysis, and report exports.
"""

from fastapi import APIRouter, HTTPException, Response
from backend.analytics.coach import teaching_coach
from backend.db.repositories import LectureSessionRepository

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/session/{session_id}")
async def get_session_analytics(session_id: str):
    data = teaching_coach.get_session_analytics(session_id)
    if "error" in data:
        raise HTTPException(status_code=404, detail="Session not found")
    return data

@router.get("/session/{session_id}/export")
async def export_session_report(session_id: str, format: str = "markdown"):
    analytics = teaching_coach.get_session_analytics(session_id)
    if "error" in analytics:
        raise HTTPException(status_code=404, detail="Session not found")

    if format == "json":
        return analytics

    # Format Markdown Report
    title = analytics.get("title", "Lecture Session")
    duration_min = round(analytics.get("duration_seconds", 0) / 60, 1)
    recap = analytics.get("recap_summary") or teaching_coach.generate_recap(session_id)

    md_content = f"""# Manoeuvre Lecture Report: {title}

**Generated**: Automatically by Manoeuvre Teaching Suite
**Session ID**: `{session_id}`

---

## 1. Executive Summary
- **Total Duration**: {duration_min} minutes
- **Pacing Evaluation**: **{analytics.get('pacing_evaluation')}** ({analytics.get('avg_time_per_slide_sec')}s / slide)
- **Slides Covered**: {analytics.get('slides_viewed')}
- **Slide Transitions**: {analytics.get('transitions_count')}
- **Annotations Created**: {analytics.get('annotations_count')}
- **AI Teaching Queries**: {analytics.get('ai_queries_count')} (Avg latency: {analytics.get('avg_ai_latency_ms')} ms)

---

## 2. Teaching Recap & Pedagogical Insights
{recap}

---

## 3. Slide Breakdown
"""
    breakdown = analytics.get("slide_timing_breakdown", {})
    if breakdown:
        md_content += "| Slide Index | Estimated Time Spent |\n|---|---|\n"
        for s_idx, secs in breakdown.items():
            md_content += f"| Slide {s_idx} | {secs}s |\n"
    else:
        md_content += "_No slide transitions recorded during this session._\n"

    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=manoeuvre_report_{session_id}.md"}
    )
