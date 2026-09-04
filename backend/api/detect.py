from fastapi import APIRouter, UploadFile, File, HTTPException
from ultralytics import YOLO
from core.config import settings
import time
import os
import io
from PIL import Image

router = APIRouter()

# Global model variable to load it only once
model = None

def get_model():
    global model
    if model is None:
        if not os.path.exists(settings.MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at {settings.MODEL_PATH}. Please upload it.")
        model = YOLO(settings.MODEL_PATH)
    return model

@router.post("/detect")
async def detect_waste(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

    try:
        start_time = time.time()
        
        # Read image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        
        try:
            yolo_model = get_model()
        except FileNotFoundError as e:
            # Return a specific error code if model is missing so frontend can handle it
            raise HTTPException(status_code=503, detail=str(e))
            
        # Run inference
        results = yolo_model(image)
        
        processing_time = round(time.time() - start_time, 2)
        
        detections = []
        class_names = {0: "plastic", 1: "paper", 2: "glass", 3: "metal"}
        
        for r in results:
            boxes = r.boxes
            for box in boxes:
                # get coordinates
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                
                # get confidence
                conf = float(box.conf[0])
                
                # get class id
                cls = int(box.cls[0])
                class_name = class_names.get(cls, "unknown")
                
                detections.append({
                    "class_name": class_name,
                    "confidence": round(conf, 2),
                    "box": [round(x1, 2), round(y1, 2), round(x2, 2), round(y2, 2)]
                })
        
        # Calculate overall confidence
        overall_confidence = "Low"
        if detections:
            avg_conf = sum(d["confidence"] for d in detections) / len(detections)
            if avg_conf > 0.85:
                overall_confidence = "High"
            elif avg_conf > 0.60:
                overall_confidence = "Medium"
                
        return {
            "success": True,
            "detections": detections,
            "object_count": len(detections),
            "overall_confidence": overall_confidence,
            "processing_time": processing_time,
            "image_width": image.width,
            "image_height": image.height
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
