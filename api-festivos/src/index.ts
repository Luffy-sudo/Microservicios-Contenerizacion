import express from 'express';
import cors from 'cors';
import { initDb, db } from './db';
import { obtenerOPoblarFestivos, verificarFecha } from './festivosService';
import { openApiFestivosSpec, swaggerHandler } from './swagger';

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());

// Swagger Docs
app.get('/api/swagger.json', (_req, res) => res.json(openApiFestivosSpec));
app.get('/', swaggerHandler);
app.get('/swagger-ui.html', swaggerHandler);
app.get('/docs', swaggerHandler);

// GET /api/festivos/tipos
app.get('/api/festivos/tipos', async (_req, res) => {
  try {
    if (!db) {
      return res.json([
        { id: 1, tipo: 'Fijo' },
        { id: 2, tipo: 'Ley Emiliani (Trasladable a lunes)' },
        { id: 3, tipo: 'Basado en Pascua (Fijo)' },
        { id: 4, tipo: 'Basado en Pascua y Ley Emiliani' },
      ]);
    }
    const tipos = await db.collection('tipos').find().sort({ id: 1 }).toArray();
    res.json(tipos.map((t) => ({ id: t.id, tipo: t.tipo, descripcion: t.descripcion })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/festivos/obtener/:anio
app.get('/api/festivos/obtener/:anio', async (req, res) => {
  const anio = parseInt(req.params.anio, 10);
  if (isNaN(anio) || anio < 1900 || anio > 2100) {
    return res.status(400).json({ error: 'Año inválido. Debe estar entre 1900 y 2100' });
  }

  try {
    const festivos = await obtenerOPoblarFestivos(anio);
    res.json(festivos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/festivos/poblar/:anio
app.post('/api/festivos/poblar/:anio', async (req, res) => {
  const anio = parseInt(req.params.anio, 10);
  if (isNaN(anio)) {
    return res.status(400).json({ error: 'Año inválido' });
  }

  try {
    const festivos = await obtenerOPoblarFestivos(anio);
    res.json({
      mensaje: `Colección en MongoDB poblada exitosamente con ${festivos.length} festivos para el año ${anio}`,
      totalFestivos: festivos.length,
      motor: 'MongoDB',
      festivos,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/festivos/verificar/:anio/:mes/:dia
app.get('/api/festivos/verificar/:anio/:mes/:dia', async (req, res) => {
  const anio = parseInt(req.params.anio, 10);
  const mes = parseInt(req.params.mes, 10);
  const dia = parseInt(req.params.dia, 10);

  if (isNaN(anio) || isNaN(mes) || isNaN(dia) || mes < 1 || mes > 12 || dia < 1 || dia > 31) {
    return res.status(400).json({ error: 'Parámetros de fecha inválidos' });
  }

  try {
    const resultado = await verificarFecha(anio, mes, dia);
    res.json(resultado);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/festivos/status
app.get('/api/festivos/status', async (_req, res) => {
  try {
    if (!db) {
      return res.json({
        servicio: 'API Festivos',
        estado: 'Conectando...',
        motor: 'MongoDB',
      });
    }
    const festivosCount = await db.collection('festivos').countDocuments();
    const consultasCount = await db.collection('consultas_festivos').countDocuments();
    res.json({
      servicio: 'API Festivos',
      estado: 'Operacional',
      motor: 'MongoDB (NoSQL)',
      baseDatos: 'festivos_db',
      colecciones: ['festivos', 'tipos', 'consultas_festivos'],
      totalFestivosPoblados: festivosCount,
      totalConsultasRegistradas: consultasCount,
    });
  } catch (err: any) {
    res.status(500).json({
      servicio: 'API Festivos',
      estado: 'Error de BD',
      motor: 'MongoDB',
      error: err.message,
    });
  }
});

app.listen(port, '0.0.0.0', async () => {
  console.log(`🚀 API Festivos (MongoDB) corriendo en http://0.0.0.0:${port}`);
  await initDb();
});
