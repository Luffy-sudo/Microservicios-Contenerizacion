import express from 'express';
import cors from 'cors';
import { initDb, pool } from './db';
import {
  generarYPoblarCalendarioAnio,
  obtenerCalendarioAnio,
  verificarFechaLaboral,
  calcularDiasHabiles,
} from './calendarioService';
import { openApiCalendarioSpec, swaggerHandler } from './swagger';

const app = express();
const port = parseInt(process.env.PORT || '3002', 10);

app.use(cors());
app.use(express.json());

// Swagger Docs
app.get('/api/swagger.json', (_req, res) => res.json(openApiCalendarioSpec));
app.get('/', swaggerHandler);
app.get('/swagger-ui.html', swaggerHandler);
app.get('/docs', swaggerHandler);

// GET /api/calendario/obtener/:anio
app.get('/api/calendario/obtener/:anio', async (req, res) => {
  const anio = parseInt(req.params.anio, 10);
  if (isNaN(anio) || anio < 1900 || anio > 2100) {
    return res.status(400).json({ error: 'Año inválido' });
  }

  try {
    const calendario = await obtenerCalendarioAnio(anio);
    res.json(calendario);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/calendario/generar/:anio
app.post('/api/calendario/generar/:anio', async (req, res) => {
  const anio = parseInt(req.params.anio, 10);
  if (isNaN(anio)) {
    return res.status(400).json({ error: 'Año inválido' });
  }

  try {
    const resumen = await generarYPoblarCalendarioAnio(anio);
    res.json({
      mensaje: `Calendario laboral año ${anio} generado y guardado en la base de datos calendario_db`,
      ...resumen,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/calendario/es-laboral/:fecha
app.get('/api/calendario/es-laboral/:fecha', async (req, res) => {
  const { fecha } = req.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return res.status(400).json({ error: 'Formato de fecha inválido. Utilice YYYY-MM-DD' });
  }

  try {
    const detalle = await verificarFechaLaboral(fecha);
    if (!detalle) {
      return res.status(404).json({ error: 'No se encontró información para la fecha' });
    }
    res.json(detalle);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/calendario/dias-habiles?inicio=YYYY-MM-DD&fin=YYYY-MM-DD
app.get('/api/calendario/dias-habiles', async (req, res) => {
  const { inicio, fin } = req.query;
  if (typeof inicio !== 'string' || typeof fin !== 'string') {
    return res.status(400).json({ error: 'Parámetros "inicio" y "fin" requeridos (formato YYYY-MM-DD)' });
  }

  try {
    const calculo = await calcularDiasHabiles(inicio, fin);
    res.json(calculo);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/calendario/status
app.get('/api/calendario/status', async (_req, res) => {
  try {
    const diasCount = await pool.query('SELECT COUNT(*) FROM DiaLaboral');
    const peticionesCount = await pool.query('SELECT COUNT(*) FROM PeticionCalendario');
    const aniosRes = await pool.query('SELECT DISTINCT Anio FROM DiaLaboral ORDER BY Anio');

    res.json({
      servicio: 'API Calendario Laboral',
      estado: 'Operacional',
      baseDatos: 'calendario_db',
      aniosDisponiblesEnBD: aniosRes.rows.map((r) => r.anio),
      totalDiasPoblados: parseInt(diasCount.rows[0].count, 10),
      totalPeticionesRegistradas: parseInt(peticionesCount.rows[0].count, 10),
    });
  } catch (err: any) {
    res.status(500).json({
      servicio: 'API Calendario Laboral',
      estado: 'Error de BD',
      error: err.message,
    });
  }
});

app.listen(port, '0.0.0.0', async () => {
  console.log(`🚀 API Calendario Laboral corriendo en http://0.0.0.0:${port}`);
  await initDb();
});
