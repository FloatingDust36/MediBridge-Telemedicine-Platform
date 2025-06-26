# pdf_generator.py

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from datetime import datetime
import os

PDF_DIR = "pdfs"
os.makedirs(PDF_DIR, exist_ok=True)

def generate_pdf(session_data: dict):
    session_id = session_data["session_id"]
    filename = os.path.join(PDF_DIR, f"{session_id}.pdf")

    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4

    x_margin = 50
    y = height - 50
    line_height = 16

    def draw_line(text, font="Helvetica", size=11):
        nonlocal y
        if y < 50:
            c.showPage()
            y = height - 50
        c.setFont(font, size)
        c.drawString(x_margin, y, text)
        y -= line_height

    # Header
    draw_line("🩺 MediBridge AI Health Assistant — Session Summary", size=14)
    draw_line(f"Session ID: {session_id}")
    draw_line(f"Start Time: {session_data['start_time']}")
    draw_line("-" * 70)

    # Entries
    for i, entry in enumerate(session_data["entries"], 1):
        draw_line(f"🗓 Entry {i} — {entry['timestamp']}", size=12)
        draw_line(f"👤 User Input: {entry['user_input']}")
        draw_line(f"🤖 AI Reply: {entry['ai_reply']}")
        draw_line(f"📊 Parsed Symptoms: {entry['symptoms']}")
        draw_line(f"🧠 Triage Level: {entry['triage_result']['level']} - {entry['triage_result']['reason']}")
        draw_line(f"💡 Recommendation: {entry['triage_result']['recommendation']}")
        draw_line(f"📚 Reasoning: {entry['reasoning']}")
        draw_line("-" * 70)

    # Footer
    draw_line("⚠️ Disclaimer: This AI assistant does not provide medical diagnoses or treatment.")
    draw_line("It is designed to help users identify when to seek professional care.", size=9)

    c.save()
    print(f"🧾 PDF generated: {filename}")
