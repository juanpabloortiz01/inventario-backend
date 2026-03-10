import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log('Key en uso:', process.env.GEMINI_API_KEY?.substring(0, 15) + '...');

router.post('/analyze-image', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl es requerido' });
    }

    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      },
      `Analizá esta imagen de producto de moda o accesorios y devolvé 
      ÚNICAMENTE un JSON válido sin markdown con esta estructura exacta:
      {
        "categoria": "Gorras|Ropa|Accesorios|Calzado|Otro",
        "color_principal": "color en español",
        "color_secundario": "color en español o null",
        "marca": "marca visible o null",
        "caracteristicas": "descripción máximo 15 palabras en español",
        "estilo": "Casual|Deportivo|Formal|Otro"
      }`
    ]);

    const text = result.response.text();
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

    res.json({ success: true, data: parsed });

  } catch (error) {
    console.error('Error completo:', JSON.stringify(error, null, 2));
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    res.status(500).json({ 
      error: 'Error al analizar la imagen',
      detail: error.message,
      status: error.status
    });
  }
});

router.post('/test', async (req, res) => {
  res.json({ 
    success: true, 
    body: req.body,
    message: 'Endpoint funcionando correctamente' 
  });
});

export default router;
