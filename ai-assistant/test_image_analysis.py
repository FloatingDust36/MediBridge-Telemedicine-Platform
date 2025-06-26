# test_image_analysis.py

from image_analysis import classify_image

def test_image(path):
    print("📷 Testing image:", path)
    result = classify_image(path)
    if "error" in result:
        print("❌ Error:", result["error"])
    else:
        print(f"🖼️ Detected: {result['label']} ({result['confidence']}% confidence)")
        print(f"⚠️ Disclaimer: {result['disclaimer']}")

if __name__ == "__main__":
    test_image("test_images/rash.jpg")
