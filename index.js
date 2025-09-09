const express = require('express');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const { exec } = require('child_process');

const app = express();
app.use(express.json({ limit: '100mb' }));

app.post('/extract-text', async (req, res) => {
  if (!req.body.image_base64) {
    return res.status(400).json({ error: 'Missing image_base64 field' });
  }

  const tempImage = path.join('/tmp', `image_${Date.now()}.png`);

  try {
    // 🖼️ احفظ الصورة مؤقتًا
    fs.writeFileSync(tempImage, Buffer.from(req.body.image_base64, 'base64'));

    // 🔎 OCR بالعربي + الأرقام
    const { data: { text } } = await Tesseract.recognize(tempImage, 'ara', {
      tessedit_pageseg_mode: 6,
      tessedit_char_whitelist: "ابتثجحخدذرزسشصضطظعغفقكلمنهويءآأإؤئ0123456789٠١٢٣٤٥٦٧٨٩"
    });

    // 🧹 تنظيف النص
    const cleanedText = text
      .replace(/[^\u0600-\u06FF0-9٠-٩\s]/g, '') // بس عربي + أرقام
      .replace(/\s+/g, ' ')
      .trim();

    res.json({
      success: true,
      text: cleanedText || 'OCR لم يستطع استخراج نص'
    });

  } catch (err) {
    console.error('OCR Error:', err.toString());
    res.status(500).json({ error: 'فشل في معالجة الصورة', details: err.toString() });

  } finally {
    // 🧹 تنظيف الصورة المؤقتة
    try {
      exec(`rm -f "${tempImage}"`, (err) => {
        if (err) console.error('فشل في تنظيف الصورة المؤقتة:', err);
      });
    } catch (cleanupErr) {
      console.error('Error cleaning temp image:', cleanupErr.toString());
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Image OCR Extractor running on port ${PORT}`));
