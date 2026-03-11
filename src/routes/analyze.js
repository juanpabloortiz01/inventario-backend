import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import OpenAI from 'openai';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
console.log('OpenAI Key en uso:', process.env.OPENAI_API_KEY ? 'cargada' : 'undefined');

router.post('/analyze-image', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl es requerido' });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analizá esta imagen de producto de moda o accesorios y devolvé 
              ÚNICAMENTE un JSON válido sin markdown con esta estructura exacta:
              {
                "categoria": "Gorras|Ropa|Accesorios|Calzado|Otro",
                "color_principal": "color en español",
                "color_secundario": "color en español o null",
                "marca": "marca visible o null",
                "caracteristicas": "descripción máximo 15 palabras en español",
                "estilo": "Casual|Deportivo|Formal|Otro"
              }`
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    const text = response.choices[0].message.content;
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
