from jinja2 import Environment, FileSystemLoader
from pathlib import Path

TEMPLATE_PATH = Path(__file__).resolve().parent.parent / "templates"
env = Environment(loader=FileSystemLoader(TEMPLATE_PATH))

def generate_advice(symptoms, severity=None, duration=None, name=None, age=None):
    template = env.get_template("advice_template.txt")
    rendered = template.render(
        symptoms=symptoms,
        severity=severity,
        duration=duration,
        name=name,
        age=age
    )
    return rendered.strip()