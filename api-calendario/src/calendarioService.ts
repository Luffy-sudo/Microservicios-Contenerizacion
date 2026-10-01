import { pool } from './db';

const API_FESTIVOS_URL = process.env.API_FESTIVOS_URL || 'http://api-festivos:3001';

interface FestivoRemoto {
  id?: number;
  nombre: string;
  dia: number;
  mes: number;
  fechaCelebracion: string;
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Consultar festivos desde el microservicio API Festivos
async function obtenerFestivosDesdeApi(anio: number): Promise<FestivoRemoto[]> {
  try {
    const res = await fetch(`${API_FESTIVOS_URL}/api/festivos/obtener/${anio}`);
    if (res.ok) {
      return (await res.json()) as FestivoRemoto[];
    }
  } catch (err: any) {
    console.warn(`No se pudo conectar directamente a ${API_FESTIVOS_URL}: ${err.message}. Intentando localhost:8081...`);
    try {
      const resLocal = await fetch(`http://localhost:8081/api/festivos/obtener/${anio}`);
      if (resLocal.ok) {
        return (await resLocal.json()) as FestivoRemoto[];
      }
    } catch (e) {
      // Ignorar
    }
  }
  return [];
}

// Genera el calendario de un año completo y PUEBLA la base de datos calendario_db
export async function generarYPoblarCalendarioAnio(anio: number) {
  // 1. Obtener festivos de API Festivos
  const festivos = await obtenerFestivosDesdeApi(anio);
  const mapaFestivos = new Map<string, string>();
  for (const f of festivos) {
    mapaFestivos.set(f.fechaCelebracion, f.nombre);
  }

  // 2. Iterar todos los días del año
  const fechaInicio = new Date(Date.UTC(anio, 0, 1));
  const fechaFin = new Date(Date.UTC(anio, 11, 31));

  let actual = new Date(fechaInicio.getTime());
  let totalDias = 0;
  let totalLaborales = 0;
  let totalFestivos = 0;
  let totalFinesDeSemana = 0;

  while (actual <= fechaFin) {
    const y = actual.getUTCFullYear();
    const m = actual.getUTCMonth() + 1;
    const d = actual.getUTCDate();
    const fechaStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const diaSemanaNum = actual.getUTCDay(); // 0 = Domingo, 6 = Sábado
    const nombreDiaSemana = DIAS_SEMANA[diaSemanaNum];

    const esFinDeSemana = diaSemanaNum === 0 || diaSemanaNum === 6;
    const esFestivo = mapaFestivos.has(fechaStr);
    const nombreFestivo = mapaFestivos.get(fechaStr) || null;
    const esLaboral = !esFinDeSemana && !esFestivo;

    totalDias += 1;
    if (esLaboral) totalLaborales += 1;
    if (esFestivo) totalFestivos += 1;
    if (esFinDeSemana) totalFinesDeSemana += 1;

    // Poblar en la tabla DiaLaboral de calendario_db
    await pool.query(
      `INSERT INTO DiaLaboral (Fecha, Anio, Mes, Dia, DiaSemana, EsFinDeSemana, EsFestivo, NombreFestivo, EsLaboral)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (Fecha) DO UPDATE 
       SET EsFestivo = EXCLUDED.EsFestivo,
           NombreFestivo = EXCLUDED.NombreFestivo,
           EsLaboral = EXCLUDED.EsLaboral`,
      [fechaStr, y, m, d, nombreDiaSemana, esFinDeSemana, esFestivo, nombreFestivo, esLaboral]
    );

    actual.setUTCDate(actual.getUTCDate() + 1);
  }

  // Registrar en PeticionCalendario
  await pool.query(
    `INSERT INTO PeticionCalendario (TipoPeticion, Detalle, DiasAfectados)
     VALUES ($1, $2, $3)`,
    ['GENERACION_ANIO', `Generado calendario laboral año ${anio}`, totalDias]
  );

  return {
    anio,
    totalDias,
    totalLaborales,
    totalFestivos,
    totalFinesDeSemana,
    festivosDetectados: festivos.length,
  };
}

// Obtener o autogenerar el calendario de un año
export async function obtenerCalendarioAnio(anio: number) {
  try {
    const res = await pool.query(
      `SELECT Id as id, TO_CHAR(Fecha, 'YYYY-MM-DD') as fecha, Anio as anio, Mes as mes, Dia as dia,
              DiaSemana as "diaSemana", EsFinDeSemana as "esFinDeSemana", EsFestivo as "esFestivo",
              NombreFestivo as "nombreFestivo", EsLaboral as "esLaboral"
       FROM DiaLaboral
       WHERE Anio = $1
       ORDER BY Fecha ASC`,
      [anio]
    );

    if (res.rows.length >= 365) {
      return res.rows;
    }

    // Si aún no está en BD, lo generamos y poblamos
    console.log(`📥 Base de datos calendario_db vacía para el año ${anio}. Generando y poblando...`);
    await generarYPoblarCalendarioAnio(anio);

    const resFinal = await pool.query(
      `SELECT Id as id, TO_CHAR(Fecha, 'YYYY-MM-DD') as fecha, Anio as anio, Mes as mes, Dia as dia,
              DiaSemana as "diaSemana", EsFinDeSemana as "esFinDeSemana", EsFestivo as "esFestivo",
              NombreFestivo as "nombreFestivo", EsLaboral as "esLaboral"
       FROM DiaLaboral
       WHERE Anio = $1
       ORDER BY Fecha ASC`,
      [anio]
    );
    return resFinal.rows;
  } catch (err: any) {
    console.error('Error al obtener calendario:', err.message);
    throw err;
  }
}

// Verificar si una fecha es laboral
export async function verificarFechaLaboral(fechaStr: string) {
  const parts = fechaStr.split('-');
  const anio = parseInt(parts[0], 10);

  // Asegurar que el año esté generado
  await obtenerCalendarioAnio(anio);

  const res = await pool.query(
    `SELECT Id as id, TO_CHAR(Fecha, 'YYYY-MM-DD') as fecha, Anio as anio, Mes as mes, Dia as dia,
            DiaSemana as "diaSemana", EsFinDeSemana as "esFinDeSemana", EsFestivo as "esFestivo",
            NombreFestivo as "nombreFestivo", EsLaboral as "esLaboral"
     FROM DiaLaboral
     WHERE Fecha = $1`,
    [fechaStr]
  );

  // Registrar la consulta
  await pool.query(
    `INSERT INTO PeticionCalendario (TipoPeticion, Detalle, DiasAfectados)
     VALUES ($1, $2, $3)`,
    ['VERIFICAR_FECHA', `Consulta día laboral para ${fechaStr}`, 1]
  );

  return res.rows[0] || null;
}

// Calcular días hábiles entre dos fechas
export async function calcularDiasHabiles(inicioStr: string, finStr: string) {
  const anioInicio = parseInt(inicioStr.split('-')[0], 10);
  const anioFin = parseInt(finStr.split('-')[0], 10);

  for (let a = anioInicio; a <= anioFin; a++) {
    await obtenerCalendarioAnio(a);
  }

  const res = await pool.query(
    `SELECT COUNT(*) as "totalDias",
            COUNT(*) FILTER (WHERE EsLaboral = true) as "diasLaborales",
            COUNT(*) FILTER (WHERE EsFestivo = true) as "diasFestivos",
            COUNT(*) FILTER (WHERE EsFinDeSemana = true) as "finesDeSemana"
     FROM DiaLaboral
     WHERE Fecha >= $1 AND Fecha <= $2`,
    [inicioStr, finStr]
  );

  const fila = res.rows[0];

  // Registrar cálculo
  await pool.query(
    `INSERT INTO PeticionCalendario (TipoPeticion, Detalle, DiasAfectados)
     VALUES ($1, $2, $3)`,
    ['CALCULO_RANGO', `Cálculo de días hábiles entre ${inicioStr} y ${finStr}`, parseInt(fila.totalDias, 10)]
  );

  return {
    fechaInicio: inicioStr,
    fechaFin: finStr,
    totalDias: parseInt(fila.totalDias, 10),
    diasLaborales: parseInt(fila.diasLaborales, 10),
    diasFestivos: parseInt(fila.diasFestivos, 10),
    finesDeSemana: parseInt(fila.finesDeSemana, 10),
  };
}
