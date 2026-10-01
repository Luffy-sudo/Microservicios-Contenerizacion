import { db } from './db';

export interface FestivoDTO {
  id?: string | number;
  nombre: string;
  dia: number;
  mes: number;
  diasPascua: number;
  idTipo: number;
  tipoNombre?: string;
  anio: number;
  fechaCelebracion: string; // YYYY-MM-DD
}

// Algoritmo de Butcher / Meeus para calcular el Domingo de Pascua (Resurrección)
export function calcularDomingoPascua(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = Marzo, 4 = Abril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

// Trasladar una fecha al siguiente lunes si no cae en lunes (Ley Emiliani)
export function trasladarAlLunes(fecha: Date): Date {
  const resultado = new Date(fecha.getTime());
  const diaSemana = resultado.getUTCDay(); // 0: Domingo, 1: Lunes, ..., 6: Sábado
  if (diaSemana !== 1) {
    const diasASumar = diaSemana === 0 ? 1 : 8 - diaSemana;
    resultado.setUTCDate(resultado.getUTCDate() + diasASumar);
  }
  return resultado;
}

// Formatear Date a YYYY-MM-DD (UTC)
export function formatDateUTC(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const NOMBRES_TIPOS: Record<number, string> = {
  1: 'Fijo',
  2: 'Ley Emiliani (Trasladable a lunes)',
  3: 'Basado en Pascua (Fijo)',
  4: 'Basado en Pascua y Ley Emiliani',
};

// Definición de las reglas de los festivos en Colombia
const REGLAS_FESTIVOS = [
  // Tipo 1: Fijos
  { nombre: 'Año Nuevo', dia: 1, mes: 1, idTipo: 1, diasPascua: 0 },
  { nombre: 'Día del Trabajo', dia: 1, mes: 5, idTipo: 1, diasPascua: 0 },
  { nombre: 'Día de la Independencia', dia: 20, mes: 7, idTipo: 1, diasPascua: 0 },
  { nombre: 'Batalla de Boyacá', dia: 7, mes: 8, idTipo: 1, diasPascua: 0 },
  { nombre: 'Inmaculada Concepción', dia: 8, mes: 12, idTipo: 1, diasPascua: 0 },
  { nombre: 'Navidad', dia: 25, mes: 12, idTipo: 1, diasPascua: 0 },

  // Tipo 2: Ley Emiliani (Fecha fija, pero se traslada al siguiente lunes)
  { nombre: 'Reyes Magos (Epifanía)', dia: 6, mes: 1, idTipo: 2, diasPascua: 0 },
  { nombre: 'Día de San José', dia: 19, mes: 3, idTipo: 2, diasPascua: 0 },
  { nombre: 'San Pedro y San Pablo', dia: 29, mes: 6, idTipo: 2, diasPascua: 0 },
  { nombre: 'Asunción de la Virgen', dia: 15, mes: 8, idTipo: 2, diasPascua: 0 },
  { nombre: 'Día de la Raza', dia: 12, mes: 10, idTipo: 2, diasPascua: 0 },
  { nombre: 'Todos los Santos', dia: 1, mes: 11, idTipo: 2, diasPascua: 0 },
  { nombre: 'Independencia de Cartagena', dia: 11, mes: 11, idTipo: 2, diasPascua: 0 },

  // Tipo 3: Relativo a Pascua (Fijo, sin traslado)
  { nombre: 'Jueves Santo', dia: 0, mes: 0, idTipo: 3, diasPascua: -3 },
  { nombre: 'Viernes Santo', dia: 0, mes: 0, idTipo: 3, diasPascua: -2 },
  { nombre: 'Domingo de Pascua', dia: 0, mes: 0, idTipo: 3, diasPascua: 0 },

  // Tipo 4: Relativo a Pascua y con Ley Emiliani (Se traslada al siguiente lunes)
  { nombre: 'Ascensión del Señor', dia: 0, mes: 0, idTipo: 4, diasPascua: 40 }, // Se corre a +43 (lunes)
  { nombre: 'Corpus Christi', dia: 0, mes: 0, idTipo: 4, diasPascua: 60 },      // Se corre a +64 (lunes)
  { nombre: 'Sagrado Corazón de Jesús', dia: 0, mes: 0, idTipo: 4, diasPascua: 68 }, // Se corre a +71 (lunes)
];

export async function calcularFestivosAnio(anio: number): Promise<FestivoDTO[]> {
  const pascua = calcularDomingoPascua(anio);
  const festivos: FestivoDTO[] = [];

  for (const regla of REGLAS_FESTIVOS) {
    let fechaCelebracion: Date;

    if (regla.idTipo === 1) {
      fechaCelebracion = new Date(Date.UTC(anio, regla.mes - 1, regla.dia));
    } else if (regla.idTipo === 2) {
      const fechaBase = new Date(Date.UTC(anio, regla.mes - 1, regla.dia));
      fechaCelebracion = trasladarAlLunes(fechaBase);
    } else if (regla.idTipo === 3) {
      fechaCelebracion = new Date(pascua.getTime());
      fechaCelebracion.setUTCDate(pascua.getUTCDate() + regla.diasPascua);
    } else {
      // Tipo 4: Pascua + diasPascua y trasladar al siguiente lunes
      const fechaBase = new Date(pascua.getTime());
      fechaBase.setUTCDate(pascua.getUTCDate() + regla.diasPascua);
      fechaCelebracion = trasladarAlLunes(fechaBase);
    }

    const dto: FestivoDTO = {
      nombre: regla.nombre,
      dia: regla.dia || fechaCelebracion.getUTCDate(),
      mes: regla.mes || fechaCelebracion.getUTCMonth() + 1,
      diasPascua: regla.diasPascua,
      idTipo: regla.idTipo,
      tipoNombre: NOMBRES_TIPOS[regla.idTipo] || `Tipo ${regla.idTipo}`,
      anio,
      fechaCelebracion: formatDateUTC(fechaCelebracion),
    };

    festivos.push(dto);
  }

  // Ordenar por fecha de celebración
  festivos.sort((a, b) => a.fechaCelebracion.localeCompare(b.fechaCelebracion));
  return festivos;
}

// Obtiene festivos de MongoDB o los calcula y PUEBLA la colección en MongoDB automáticamente
export async function obtenerOPoblarFestivos(anio: number): Promise<FestivoDTO[]> {
  try {
    if (!db) {
      return calcularFestivosAnio(anio);
    }

    const collection = db.collection('festivos');
    const docs = await collection.find({ anio }).sort({ fechaCelebracion: 1 }).toArray();

    if (docs.length > 0) {
      return docs.map((d) => ({
        id: d._id.toString(),
        nombre: d.nombre,
        dia: d.dia,
        mes: d.mes,
        diasPascua: d.diasPascua,
        idTipo: d.idTipo,
        tipoNombre: d.tipoNombre || NOMBRES_TIPOS[d.idTipo] || `Tipo ${d.idTipo}`,
        anio: d.anio,
        fechaCelebracion: d.fechaCelebracion,
      }));
    }

    // Si no existen en MongoDB, los calculamos y POBALMOS la colección
    console.log(`📥 [MongoDB] Poblando festivos_db.festivos para el año ${anio}...`);
    const festivos = await calcularFestivosAnio(anio);

    const docsToInsert = festivos.map((f) => ({
      nombre: f.nombre,
      dia: f.dia,
      mes: f.mes,
      diasPascua: f.diasPascua,
      idTipo: f.idTipo,
      tipoNombre: f.tipoNombre,
      anio: f.anio,
      fechaCelebracion: f.fechaCelebracion,
      creadoEn: new Date(),
    }));

    try {
      await collection.insertMany(docsToInsert, { ordered: false });
    } catch (e: any) {
      // Ignorar duplicados si se insertaron concurrentemente
    }

    // Consultamos de nuevo para devolver con los _ids generados por MongoDB
    const docsActualizados = await collection.find({ anio }).sort({ fechaCelebracion: 1 }).toArray();
    return docsActualizados.map((d) => ({
      id: d._id.toString(),
      nombre: d.nombre,
      dia: d.dia,
      mes: d.mes,
      diasPascua: d.diasPascua,
      idTipo: d.idTipo,
      tipoNombre: d.tipoNombre || NOMBRES_TIPOS[d.idTipo] || `Tipo ${d.idTipo}`,
      anio: d.anio,
      fechaCelebracion: d.fechaCelebracion,
    }));
  } catch (err: any) {
    console.error('Error al obtener/poblar festivos en MongoDB:', err.message);
    return calcularFestivosAnio(anio);
  }
}

// Verifica si una fecha exacta es festiva y registra la petición en la colección consultas_festivos (MongoDB)
export async function verificarFecha(anio: number, mes: number, dia: number) {
  const festivos = await obtenerOPoblarFestivos(anio);
  const fechaStr = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  const festivoEncontrado = festivos.find((f) => f.fechaCelebracion === fechaStr);

  const esFestivo = !!festivoEncontrado;
  const descripcion = festivoEncontrado ? festivoEncontrado.nombre : 'Día laboral ordinario';

  // Registrar auditoría en MongoDB
  if (db) {
    try {
      await db.collection('consultas_festivos').insertOne({
        fechaConsultada: fechaStr,
        esFestivo,
        descripcion,
        fechaRegistro: new Date(),
      });
    } catch (err: any) {
      console.warn('No se pudo registrar la consulta en MongoDB:', err.message);
    }
  }

  return {
    fecha: fechaStr,
    esFestivo,
    nombreFestivo: festivoEncontrado ? festivoEncontrado.nombre : null,
    tipo: festivoEncontrado ? festivoEncontrado.tipoNombre || `Tipo ${festivoEncontrado.idTipo}` : null,
  };
}
