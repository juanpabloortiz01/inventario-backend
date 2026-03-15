import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import analyzeRouter from './routes/analyze.js';
import productsRouter from './routes/products.js';
import catalogRouter from './routes/catalog.js';
import whatsappRouter from './routes/whatsapp.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api', analyzeRouter);
app.use('/api', productsRouter);
app.use('/api', catalogRouter);
app.use('/api', whatsappRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend corriendo en puerto ${PORT}`);
});
