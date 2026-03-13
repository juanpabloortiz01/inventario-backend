import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Endpoint público para n8n - no requiere auth
router.get('/products/:negocio_id', async (req, res) => {
  try {
    const { negocio_id } = req.params;

    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('negocio_id', negocio_id)
      .eq('activo', true)
      .order('categoria');

    if (error) throw error;

    // Formatear para el agente de WhatsApp
    const catalogo = data.map(p => 
      `${p.nombre} - ${p.categoria} - Color: ${p.color_principal}${p.color_secundario ? '/' + p.color_secundario : ''} - ${p.marca || ''} - Tallas: ${p.variantes || 'única'} - Stock: ${p.stock} - Precio: $${p.precio}`
    ).join('\n');

    res.json({
      success: true,
      negocio_id,
      total_productos: data.length,
      productos: data,
      catalogo_texto: catalogo
    });

  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      error: 'Error al obtener productos',
      detail: error.message
    });
  }
});

export default router;
