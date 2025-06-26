from PIL import Image
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification

MODEL_NAME = "google/vit-base-patch16-224"

processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
model = AutoModelForImageClassification.from_pretrained(MODEL_NAME)
model.eval()

def analyze_image(image_path):
    try:
        image = Image.open(image_path).convert("RGB")
    except Exception as e:
        return "Error", 0.0  # return fallback values

    inputs = processor(images=image, return_tensors="pt")

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        predicted_class_idx = logits.argmax(-1).item()

    label = model.config.id2label[predicted_class_idx]
    confidence = torch.nn.functional.softmax(logits, dim=-1)[0][predicted_class_idx].item()

    return label, confidence
