import dotenv from 'dotenv';
dotenv.config();

import express from 'express';

const router = express.Router();

const EVOLUTION_URL = process.env.EVOLUTION_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

console.log('EVOLUTION_URL:', EVOLUTION_URL);
console.log('EVOLUTION_API_KEY:', EVOLUTION_API_KEY ? 'cargada' : 'undefined');

router.get('/whatsapp-qr/:negocio_id', async (req, res) => {
  try {
    const { negocio_id } = req.params;
    const instancia = `instancia-negocio-${negocio_id}`;

    const response = await fetch(`${EVOLUTION_URL}/instance/connect/${instancia}`, {
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });

    const data = await response.json();

    if (data.base64) {
      // Devolver imagen del QR directamente
      const base64Data = data.base64.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      res.setHeader('Content-Type', 'image/png');
      res.send(buffer);
    } else {
      res.status(404).json({ error: 'QR no disponible', detail: data });
    }

  } catch (error) {
    console.error('Error obteniendo QR:', error);
    res.status(500).json({ error: 'Error al obtener QR', detail: error.message });
  }
});

export default router;
