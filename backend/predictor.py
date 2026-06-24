from flask import Flask, jsonify, request
from PIL import Image
from flask_cors import CORS
from transformers import pipeline
import os
import io

model_path = os.path.abspath("./model/smogy")

pipe = pipeline("image-classification", model=model_path)


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes



@app.route('/image', methods = ["POST"])
def img_upload():
    img_ = request.files['image']  # Get file from form

    img = Image.open(img_.stream)
    #img = Image.open(io.BytesIO(img_.read()))
    

    # Display basic info
    print("Image received...")
    print(f"Format: {img.format}")
    print(f"Size: {img.size} (width x height)")
    print(f"Mode: {img.mode}")

    result = pipe(img)
    top = result[0]
    print(f"Prediction: {top['label']}")
    print(f"Confidence: {top['score'] * 100:.2f}%")
    return jsonify({
    "label": top["label"],
    "confidence": round(top["score"] * 100, 2)
    })



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)