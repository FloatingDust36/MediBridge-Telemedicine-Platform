import re

# Define patterns that are considered unsafe, inappropriate, or unethical
UNSAFE_PATTERNS = [
    r"fake (a )?fever",
    r"suicide|kill myself|end my life",
    r"overdose|take too much",
    r"how to get sick",
    r"abort|miscarriage|terminate.*pregnancy",
    r"fake (injur|illness)",
    r"how to pass a drug test",
]

VAGUE_SYMPTOMS = [
    "i feel bad",
    "i feel weird",
    "not feeling good",
    "unwell",
    "idk what's wrong"
]

def is_unsafe_input(text):
    for pattern in UNSAFE_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False

def patch_input(text):
    for vague in VAGUE_SYMPTOMS:
        if vague in text.lower():
            return "Can you describe your symptoms in more detail? For example, any pain, fever, nausea, or fatigue?"
    return text