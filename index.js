const express = require('express');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const { exec } = require('child_process');
const Jimp = require('jimp'); // ✅ بديل sharp

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

    // ✨ افتح الصورة بجيمب وحسّنها قبل الـ OCR
    const image = await Jimp.read(tempImage);
    image
      .greyscale() // تحويل الصورة لأبيض وأسود
      .contrast(0.5) // تحسين التباين
      .normalize() // تطبيع الألوان
      .write(tempImage); // احفظ فوق نفس الملف

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
const express = require('express');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');   // 👈 تحسين الصور
const { exec } = require('child_process');

const app = express();
app.use(express.json({ limit: '100mb' }));

app.post('/extract-text', async (req, res) => {
  if (!req.body.image_base64) {
    return res.status(400).json({ error: 'Missing image_base64 field' });
  }

  const tempImage = path.join('/tmp', `image_${Date.now()}.png`);
  const cleanedImage = tempImage.replace('.png', '_clean.png');

  try {
    // 🖼️ احفظ الصورة مؤقتًا
    fs.writeFileSync(tempImage, Buffer.from(req.body.image_base64, 'base64'));

    // ✨ تحسين الصورة (تكبير + أبيض وأسود + Normalize)
    await sharp(tempImage)
      .resize({ width: 1200 })  // تكبير العرض لزيادة الدقة
      .grayscale()              // حولها لأبيض وأسود
      .normalize()              // زوّد التباين
      .toFile(cleanedImage);

    // 🔎 OCR بالعربي + الأرقام
    const { data: { text } } = await Tesseract.recognize(cleanedImage, 'ara', {
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
    // 🧹 تنظيف الملفات المؤقتة
    try {
      exec(`rm -f "${tempImage}" "${cleanedImage}"`, (err) => {
        if (err) console.error('فشل في تنظيف الملفات المؤقتة:', err);
      });
    } catch (cleanupErr) {
      console.error('Error cleaning temp files:', cleanupErr.toString());
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Image OCR Extractor running on port ${PORT}`));
