import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

router.get('/catalog/:negocio_id', async (req, res) => {
  try {
    const { negocio_id } = req.params;

    // Obtener negocio
    const { data: negocio } = await supabase
      .from('negocios')
      .select('*')
      .eq('id', negocio_id)
      .single();

    // Obtener productos
    const { data: productos } = await supabase
      .from('productos')
      .select('*')
      .eq('negocio_id', negocio_id)
      .eq('activo', true);

    // Generar HTML del catálogo
    const productosHTML = productos.map(p => `
      <div class="producto">
        <img src="${p.url_foto}" alt="${p.nombre}" onerror="this.style.display='none'"/>
        <div class="info">
          <h3>${p.nombre}</h3>
          <p class="categoria">${p.categoria} · ${p.estilo}</p>
          <p>🎨 <strong>Color:</strong> ${p.color_principal}${p.color_secundario ? '/' + p.color_secundario : ''}</p>
          ${p.marca ? `<p>🏷️ <strong>Marca:</strong> ${p.marca}</p>` : ''}
          <p>📐 <strong>Tallas:</strong> ${p.variantes || 'Única'}</p>
          <p>📦 <strong>Stock:</strong> ${p.stock} unidades</p>
          <p class="precio">💰 $${p.precio}</p>
          ${p.caracteristicas ? `<p class="caract">${p.caracteristicas}</p>` : ''}
        </div>
      </div>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; background: #f5f5f5; color: #333; }
        
        .header {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          color: white;
          padding: 40px;
          text-align: center;
        }
        .header h1 { font-size: 36px; margin-bottom: 8px; }
        .header p { font-size: 16px; opacity: 0.8; }
        
        .catalogo {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          padding: 32px;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .producto {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
        }
        
        .producto img {
          width: 100%;
          height: 220px;
          object-fit: cover;
        }
        
        .info {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .info h3 { font-size: 18px; color: #1a1a2e; }
        .categoria { color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
        .precio { font-size: 22px; font-weight: bold; color: #e63946; margin-top: 8px; }
        .caract { font-size: 13px; color: #666; font-style: italic; }
        
        .footer {
          text-align: center;
          padding: 24px;
          color: #888;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${negocio?.nombre || 'Catálogo de Productos'}</h1>
        <p>Catálogo actualizado · ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      
      <div class="catalogo">
        ${productosHTML}
      </div>
      
      <div class="footer">
        <p>📱 ${negocio?.whatsapp || ''} · ✉️ ${negocio?.email || ''}</p>
        <p>Precios y stock sujetos a disponibilidad</p>
      </div>
    </body>
    </html>
    `;

    // Generar PDF con Puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="catalogo-${negocio_id}.pdf"`);
    res.send(pdf);

  } catch (error) {
    console.error('Error generando catálogo:', error);
    res.status(500).json({ error: 'Error al generar el catálogo', detail: error.message });
  }
});

export default router;
