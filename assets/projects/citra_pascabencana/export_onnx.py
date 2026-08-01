"""
ONNX Model Exporter for UAV Disaster Classification Models (Opset 17)

Usage:
  pip install ultralytics onnx
  python export_onnx.py
"""

import os
from ultralytics import YOLO

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

model_files = [
    "yolo8n_silu_best.pt",
    "yolo8n_relu_best.pt",
    "yolo11n_silu_best.pt",
    "yolo11n_relu_best.pt",
    "yolo12n_silu_best.pt",
    "yolo12n_relu_best.pt"
]

print("=== Starting ONNX Model Export (Opset 17) ===")

for pt_file in model_files:
    pt_path = os.path.join(MODELS_DIR, pt_file)
    if not os.path.exists(pt_path):
        print(f"[SKIP] Model file not found: {pt_path}")
        continue
    
    print(f"Exporting {pt_file} to ONNX (opset=17)...")
    try:
        model = YOLO(pt_path)
        # Force opset=17 for ONNX Runtime Web compatibility
        onnx_path = model.export(format="onnx", imgsz=640, opset=17, simplify=True)
        print(f"[SUCCESS] Exported -> {onnx_path}")
    except Exception as e:
        print(f"[ERROR] Failed to export {pt_file}: {e}")

print("=== Export Complete ===")
