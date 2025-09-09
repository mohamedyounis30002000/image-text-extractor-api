const express = require('express');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const { exec } = require('child_process');

const app = express();
app.use(express.json({ limit: '50mb' })); // استقبل Base64 كبير

// API لمعالجة صورة واحدة Base64
app.post('/extract-text', async (req, res) => {
  const { image_base64 } = req.body;

  if (!image_base64) {
    return res.status(400).json({ error: 'Missing image_base64 field' });
  }

  const tempImage = path.join('/tmp', `upload_${Date.now()}.png`);
  try {
    // 🖼️ احفظ الصورة
    fs.writeFileSync(tempImage, Buffer.from(image_base64, 'base64'));

    // 🔎 OCR عربي فقط مع تحسينات
    const { data: { text } } = await Tesseract.recognize(tempImage, 'ara', {
      tessedit_char_whitelist: "ابتثجحخدذرزسشصضطظعغفقكلمنهويءآأإؤئ", // فقط الحروف العربية
      tessedit_pageseg_mode: 3 // صفحة واحدة نص كامل
    });

    res.json({
      success: true,
      text: text.trim() || 'OCR لم يستطع استخراج نص'
    });

  } catch (err) {
    console.error('OCR Error:', err.toString());
    res.status(500).json({ error: 'فشل في معالجة الصورة', details: err.toString() });

  } finally {
    // 🧹 امسح الصورة المؤقتة
    try {
      exec(`rm -f "${tempImage}"`, (err) => {
        if (err) console.error('فشل في تنظيف الصورة المؤقتة:', err);
      });
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr.toString());
    }
  }
});

const PORT = process.env.PORT || 6000;
app.listen(PORT, () => console.log(`Image OCR API تعمل على المنفذ ${PORT}`));
