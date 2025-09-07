# Image Text Extractor API

Node.js REST API to extract text from **images (PNG/JPG/Base64)** using **tesseract.js**.  
Supports **Arabic + English OCR**.

## 🚀 Usage
POST `/extract-text`

### Request body:
```json
{
  "image_base64": "<Base64 string>"
}