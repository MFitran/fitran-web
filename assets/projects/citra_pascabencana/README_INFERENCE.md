# UAV Disaster Classification Model Inference & ONNX Export Guide

This directory contains utility scripts to run local PyTorch inference and export trained `.pt` checkpoints into web-compatible `.onnx` models.

---

## 1. Installation Requirements

Make sure you have Python 3.8+ installed with the following packages:

```bash
pip install ultralytics torch torchvision onnx
```

---

## 2. Running Local Python Inference (`predict.py`)

To run prediction on an image using any trained `.pt` checkpoint:

```bash
python predict.py --image collapsed_building_sample.jpg --model yolo8n_silu_best.pt
```

### Example Console Output:
```
==========================================
TOP-1 PREDICTED CLASS : COLLAPSED BUILDING
CONFIDENCE SCORE     : 98.37%
==========================================
Top-5 Softmax Class Probabilities:
  1. Collapsed Building             :  98.37%
  2. Traffic Incident               :   1.12%
  3. Flooded Area & Water Logging   :   0.35%
  4. Fire & Smoke Outbreak          :   0.11%
  5. Normal (Urban Roadways)        :   0.05%
==========================================
```

---

## 3. Exporting Models to ONNX Format (`export_onnx.py`)

To convert all trained `.pt` checkpoints into web-compatible `.onnx` files:

```bash
python export_onnx.py
```

This script will process all weights in the `models/` directory and generate matching `.onnx` files suitable for `onnxruntime-web` client-side browser execution.
