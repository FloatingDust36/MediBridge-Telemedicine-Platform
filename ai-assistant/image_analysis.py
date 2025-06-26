# image_analysis.py

from transformers import ViTForImageClassification, ViTImageProcessor
from PIL import Image
import torch

# Load model and processor
processor = ViTImageProcessor.from_pretrained("google/vit-base-patch16-224")
model = ViTForImageClassification.from_pretrained("google/vit-base-patch16-224")

def classify_image(image_path: str) -> dict:
    try:
        image = Image.open(image_path).convert("RGB")
        inputs = processor(images=image, return_tensors="pt")
        with torch.no_grad():
            outputs = model(**inputs)
        logits = outputs.logits
        predicted_class_idx = logits.argmax(-1).item()
        label = model.config.id2label[predicted_class_idx]
        confidence = torch.softmax(logits, dim=1)[0][predicted_class_idx].item()

        return {
            "label": label,
            "confidence": round(confidence * 100, 2),
            "disclaimer": "This is not a clinical diagnosis. Please consult a medical professional for an official assessment."
        }

    except Exception as e:
        return {"error": str(e)}
