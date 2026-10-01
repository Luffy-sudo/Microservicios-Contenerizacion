import { MongoClient, Db } from 'mongodb';

const mongoHost = process.env.DB_HOST || 'bd-festivos';
const mongoPort = process.env.DB_PORT || '27017';
const mongoUser = process.env.DB_USER || 'admin';
const mongoPassword = process.env.DB_PASSWORD || 'admin123';
const mongoDbName = process.env.DB_NAME || 'festivos_db';

export const mongoUri =
  process.env.MONGO_URI ||
  (mongoUser && mongoPassword
    ? `mongodb://${encodeURIComponent(mongoUser)}:${encodeURIComponent(mongoPassword)}@${mongoHost}:${mongoPort}/${mongoDbName}?authSource=admin`
    : `mongodb://${mongoHost}:${mongoPort}/${mongoDbName}`);

export const client = new MongoClient(mongoUri, {
  serverSelectionTimeoutMS: 5000,
});

export let db: Db;

export async function initDb(): Promise<Db> {
  let retries = 10;
  while (retries > 0) {
    try {
      await client.connect();
      db = client.db(mongoDbName);

      // Asegurar índices en colecciones
      const festivosCollection = db.collection('festivos');
      await festivosCollection.createIndex(
        { nombre: 1, anio: 1, fechaCelebracion: 1 },
        { unique: true }
      );
      await festivosCollection.createIndex({ anio: 1 });
      await festivosCollection.createIndex({ fechaCelebracion: 1 });

      const consultasCollection = db.collection('consultas_festivos');
      await consultasCollection.createIndex({ fechaConsultada: 1 });
      await consultasCollection.createIndex({ fechaRegistro: -1 });

      // Asegurar tipos de festivos base
      const tiposCollection = db.collection('tipos');
      const countTipos = await tiposCollection.countDocuments();
      if (countTipos === 0) {
        await tiposCollection.insertMany([
          {
            id: 1,
            tipo: 'Fijo',
            descripcion: 'Festivo con fecha fija inamovible (ej. Año Nuevo, Día del Trabajo, Navidad)'
          },
          {
            id: 2,
            tipo: 'Ley Emiliani (Trasladable a lunes)',
            descripcion: 'Fecha fija pero se traslada al lunes siguiente (Ley 51 de 1983)'
          },
          {
            id: 3,
            tipo: 'Basado en Pascua (Fijo)',
            descripcion: 'Semana Santa, calculado relativo al Domingo de Resurrección'
          },
          {
            id: 4,
            tipo: 'Basado en Pascua y Ley Emiliani',
            descripcion: 'Calculado sobre Pascua y trasladado al lunes siguiente (ej. Corpus Christi)'
          }
        ]);
        console.log('✅ Colección tipos inicializada en MongoDB');
      }

      console.log(`✅ Base de datos MongoDB [${mongoDbName}] conectada e inicializada exitosamente`);
      return db;
    } catch (err: any) {
      retries -= 1;
      console.warn(`⏳ Esperando conexión con MongoDB (${mongoHost}:${mongoPort})... reintentos restantes: ${retries}`);
      if (retries === 0) {
        console.error('❌ Error conectando a MongoDB:', err.message);
      } else {
        await new Promise((res) => setTimeout(res, 2000));
      }
    }
  }
  return db;
}
