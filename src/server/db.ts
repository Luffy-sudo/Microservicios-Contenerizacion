import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

class DatabaseManager {
  private pool: Pool | null = null;
  private connected: boolean = false;
  private connectionError: string | null = null;

  constructor() {
    this.initPool();
  }

  private initPool() {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      (process.env.DB_HOST
        ? `postgresql://${process.env.DB_USER || 'admin'}:${process.env.DB_PASSWORD || 'admin123'}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'monedas_db'}`
        : null);

    if (!connectionString) {
      this.connected = false;
      return;
    }

    try {
      this.pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 3000,
        idleTimeoutMillis: 10000,
        max: 10,
      });

      this.pool.on('error', (err) => {
        console.error('⚠️ PostgreSQL pool idle client error (no fatal):', err.message);
      });

      this.pool
        .query('SELECT 1')
        .then(async () => {
          this.connected = true;
          this.connectionError = null;
          console.log('✅ Conexión establecida exitosamente con PostgreSQL:', connectionString.replace(/:[^:@]+@/, ':***@'));
          await this.initSchema();
        })
        .catch((err) => {
          this.connected = false;
          this.connectionError = err.message;
          console.warn('⚠️ No se pudo conectar a PostgreSQL (usando almacén en memoria):', err.message);
        });
    } catch (err: any) {
      this.connected = false;
      this.connectionError = err.message;
    }
  }

  public isAvailable(): boolean {
    return this.connected && this.pool !== null;
  }

  public getConnectionStatus() {
    return {
      connected: this.connected,
      error: this.connectionError,
      engine: 'PostgreSQL',
      configuredUrl: process.env.DATABASE_URL ? 'Configurado' : 'No configurado',
    };
  }

  public async query(text: string, params?: any[]) {
    if (!this.pool) throw new Error('PostgreSQL pool no inicializado');
    return this.pool.query(text, params);
  }

  private async initSchema() {
    if (!this.pool) return;
    try {
      // 1. Create Moneda table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS Moneda(
          Id SERIAL PRIMARY KEY,
          Moneda VARCHAR(100) NOT NULL UNIQUE,
          Sigla VARCHAR(5) NOT NULL,
          Simbolo VARCHAR(5) NULL,
          Emisor VARCHAR(100) NULL,
          Imagen BYTEA NULL
        );
      `);

      // 2. Create CambioMoneda table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS CambioMoneda(
          Id SERIAL PRIMARY KEY,
          IdMoneda INT NOT NULL REFERENCES Moneda(Id) ON DELETE CASCADE,
          Fecha DATE NOT NULL,
          Cambio FLOAT NOT NULL
        );
      `);

      // 3. Create Pais table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS Pais(
          Id SERIAL PRIMARY KEY,
          Pais VARCHAR(100) NOT NULL UNIQUE,
          CodigoAlfa2 VARCHAR(5) NOT NULL,
          CodigoAlfa3 VARCHAR(5) NOT NULL,
          IdMoneda INT NOT NULL REFERENCES Moneda(Id) ON DELETE CASCADE,
          Mapa BYTEA NULL,
          Bandera BYTEA NULL
        );
      `);

      // 4. Create Usuario table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS Usuario(
          Id SERIAL PRIMARY KEY,
          Usuario VARCHAR(100) NOT NULL UNIQUE,
          Nombre VARCHAR(100) NOT NULL,
          Clave VARCHAR(100) NOT NULL,
          Activo BOOL DEFAULT true NOT NULL,
          Foto BYTEA NULL,
          Roles VARCHAR(100) NULL
        );
      `);

      // Check if Moneda table has records; if not, seed initial data
      const countRes = await this.pool.query('SELECT COUNT(*) FROM Moneda');
      const count = parseInt(countRes.rows[0].count, 10);

      if (count === 0) {
        console.log('🌱 Inicializando datos en PostgreSQL desde seedData.json...');
        const seedPath = path.resolve(process.cwd(), 'src/server/seedData.json');
        if (fs.existsSync(seedPath)) {
          const raw = fs.readFileSync(seedPath, 'utf8');
          const seed = JSON.parse(raw);

          // Seed Monedas
          for (const m of seed.monedas) {
            await this.pool.query(
              'INSERT INTO Moneda (Id, Sigla, Moneda, Simbolo, Emisor) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (Moneda) DO NOTHING',
              [m.id, m.sigla, m.nombre, m.simbolo, m.emisor]
            );
          }

          // Seed Paises
          for (const p of seed.paises) {
            await this.pool.query(
              'INSERT INTO Pais (Id, Pais, CodigoAlfa2, CodigoAlfa3, IdMoneda) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (Pais) DO NOTHING',
              [p.id, p.nombre, p.codigoAlfa2, p.codigoAlfa3, p.idMoneda]
            );
          }

          // Seed Cambios
          for (const c of seed.cambios) {
            await this.pool.query(
              'INSERT INTO CambioMoneda (IdMoneda, Fecha, Cambio) VALUES ($1, $2, $3)',
              [c.idMoneda, c.fecha, c.valor]
            );
          }

          // Seed Usuarios
          await this.pool.query(
            "INSERT INTO Usuario (Usuario, Nombre, Clave, Roles) VALUES ('fray', 'Fray León Osorio Rivera', '123', 'Administrador') ON CONFLICT (Usuario) DO NOTHING"
          );
          await this.pool.query(
            "INSERT INTO Usuario (Usuario, Nombre, Clave, Roles) VALUES ('frayosorio', 'Fray León Osorio Rivera', '123', 'Usuario') ON CONFLICT (Usuario) DO NOTHING"
          );

          console.log('✅ Datos iniciales cargados en PostgreSQL exitosamente.');
        }
      }
    } catch (err) {
      console.error('Error al inicializar esquema PostgreSQL:', err);
    }
  }
}

export const db = new DatabaseManager();
