"""
Teaching-Focused AI Prompt Templates for Manoeuvre
"""

SYSTEM_PROMPT_LECTURE_ASSISTANT = """
You are Manoeuvre AI, an expert teaching assistant for university professors and educators.
Your mission is to provide clear, pedagogically sound, and engaging explanations, summaries,
questions, analogies, and code snippets based on the active lecture slides.
Keep responses concise, well-structured, and formatted in clean markdown.
"""

def build_explain_prompt(slide_title: str, slide_text: str, focus: str = "general") -> str:
    return f"""
Explain the following lecture slide content clearly for students:
Slide Title: {slide_title}
Content:
{slide_text}

Focus: {focus}
Provide a crisp explanation with key points and practical intuition.
"""

def build_summary_prompt(slide_title: str, slide_text: str) -> str:
    return f"""
Summarize this slide into 3 concise key takeaways:
Slide Title: {slide_title}
Content:
{slide_text}

Format as bullet points with bold keywords.
"""

def build_mcq_prompt(slide_title: str, slide_text: str, count: int = 3) -> str:
    return f"""
Generate {count} high-quality Multiple Choice Questions (MCQs) testing comprehension of this slide:
Slide Title: {slide_title}
Content:
{slide_text}

For each question, provide:
1. Question text
2. 4 distinct options (A, B, C, D)
3. The correct answer key
4. A 1-sentence pedagogical explanation of why that answer is correct.
"""

def build_analogy_prompt(slide_title: str, slide_text: str) -> str:
    return f"""
Provide an intuitive, memorable real-world analogy to explain the core concept on this slide:
Slide Title: {slide_title}
Content:
{slide_text}
"""

def build_code_prompt(slide_title: str, slide_text: str, language: str = "python") -> str:
    return f"""
Generate clean, heavily-commented educational {language} code illustrating the concept on this slide:
Slide Title: {slide_title}
Content:
{slide_text}
"""

def build_recap_prompt(duration_sec: int, slides_count: int, annotations_count: int, topics: list[str]) -> str:
    duration_min = round(duration_sec / 60, 1)
    topics_str = ", ".join(topics) if topics else "general lecture topics"
    return f"""
Generate an executive teaching recap for this completed lecture session:
- Total Duration: {duration_min} minutes
- Slides Covered: {slides_count}
- On-Slide Annotations: {annotations_count}
- Topics Covered: {topics_str}

Highlight pacing evaluation, core concepts covered, and suggested review questions for students.
"""
