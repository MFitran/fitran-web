"""
Python Inference Script for UAV Disaster Classification (.pt checkpoints)

Usage:
  pip install ultralytics torch
  python predict.py --image path/to/disaster_sample.jpg --model yolo8n_silu_best.pt
"""

import argparse
import os
from ultralytics import YOLO

def run_prediction(image_path, model_name="yolo8n_silu_best.pt"):
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    model_path = os.path.join(models_dir, model_name)
    
    if not os.path.exists(model_path):
        print(f"Error: Model checkpoint not found at {model_path}")
        return

    print(f"Loading PyTorch Model Checkpoint: {model_name}...")
    model = YOLO(model_path)
    
    print(f"Running Inference on: {image_path}...")
    results = model(image_path)
    
    for r in results:
        top1_id = r.probs.top1
        top1_class = r.names[top1_id]
        top1_conf = float(r.probs.top1conf) * 100
        
        print("\n==========================================")
        print(f"TOP-1 PREDICTED CLASS : {top1_class.upper()}")
        print(f"CONFIDENCE SCORE     : {top1_conf:.2f}%")
        print("==========================================")
        print("Top-5 Softmax Class Probabilities:")
        
        # Sort top-5 probabilities
        top5_ids = r.probs.top5
        top5_confs = r.probs.top5conf.tolist()
        for rank, (cls_id, conf) in enumerate(zip(top5_ids, top5_confs), 1):
            cls_name = r.names[cls_id]
            print(f"  {rank}. {cls_name:<30} : {conf*100:6.2f}%")
        print("==========================================\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run inference using trained UAV disaster classification models.")
    parser.add_argument("--image", type=str, default="collapsed_building_sample.jpg", help="Path to input image file.")
    parser.add_argument("--model", type=str, default="yolo8n_silu_best.pt", help="Model checkpoint filename in models/ folder.")
    
    args = parser.parse_args()
    
    img_path = args.image
    if not os.path.isabs(img_path):
        img_path = os.path.join(os.path.dirname(__file__), img_path)
        
    run_prediction(img_path, args.model)
