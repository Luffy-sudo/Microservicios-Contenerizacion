import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin123',
  database: process.env.DB_NAME || 'calendario_db',
  connectionTimeoutMillis: 5000,
});

export async function initDb() {
  let retries = 5;
  while (retries > 0) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS DiaLaboral (
            Id SERIAL PRIMARY KEY,
            Fecha DATE NOT NULL UNIQUE,
            Anio INT NOT NULL,
            Mes INT NOT NULL,
            Dia INT NOT NULL,
            DiaSemana VARCHAR(20) NOT NULL,
            EsFinDeSemana BOOLEAN NOT NULL,
            EsFestivo BOOLEAN NOT NULL,
            NombreFestivo VARCHAR(150),
            EsLaboral BOOLEAN NOT NULL,
            CreadoEn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_dialaboral_anio ON DiaLaboral(Anio);
        CREATE INDEX IF NOT EXISTS idx_dialaboral_eslaboral ON DiaLaboral(EsLaboral);

        CREATE TABLE IF NOT EXISTS PeticionCalendario (
            Id SERIAL PRIMARY KEY,
            TipoPeticion VARCHAR(50) NOT NULL,
            Detalle VARCHAR(255) NOT NULL,
            DiasAfectados INT DEFAULT 0,
            FechaPeticion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Base de datos calendario_db conectada e inicializada correctamente');
      break;
    } catch (err: any) {
      console.warn(`⏳ Esperando conexión con PostgreSQL (calendario_db)... reintentos restantes: ${retries - 1}`);
      retries -= 1;
      if (retries === 0) {
        console.error('❌ Error conectando a calendario_db:', err.message);
      } else {
        await new Promise((res) => setTimeout(res, 2000));
      }
    }
  }
}
