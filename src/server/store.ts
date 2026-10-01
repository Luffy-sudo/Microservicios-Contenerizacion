import fs from 'fs';
import path from 'path';
import { db } from './db';

export interface Moneda {
  id: number;
  nombre: string;
  sigla: string;
  simbolo?: string | null;
  emisor?: string | null;
}

export interface Pais {
  id: number;
  nombre: string;
  codigoAlfa2: string;
  codigoAlfa3: string;
  idMoneda: number;
  moneda?: Moneda;
}

export interface CambioMoneda {
  id: number;
  idMoneda: number;
  fecha: string;
  valor: number;
  moneda?: Moneda;
}

export interface Usuario {
  id: number;
  usuario: string;
  nombre: string;
  clave?: string;
  roles?: string;
}

export interface CapitalDto {
  ciudad: string;
  estado: string;
}

class MonedaStore {
  private monedas: Map<number, Moneda> = new Map();
  private paises: Map<number, Pais> = new Map();
  private cambios: CambioMoneda[] = [];
  private usuarios: Map<number, Usuario> = new Map();
  private nextMonedaId = 1;
  private nextPaisId = 1;
  private nextUsuarioId = 1;

  constructor() {
    this.cargarDatos();
  }

  private cargarDatos() {
    try {
      const seedPath = path.resolve(process.cwd(), 'src/server/seedData.json');
      if (fs.existsSync(seedPath)) {
        const raw = fs.readFileSync(seedPath, 'utf-8');
        const data = JSON.parse(raw);

        if (Array.isArray(data.monedas)) {
          for (const m of data.monedas) {
            this.monedas.set(m.id, m);
            if (m.id >= this.nextMonedaId) this.nextMonedaId = m.id + 1;
          }
        }

        if (Array.isArray(data.paises)) {
          for (const p of data.paises) {
            this.paises.set(p.id, p);
            if (p.id >= this.nextPaisId) this.nextPaisId = p.id + 1;
          }
        }

        if (Array.isArray(data.cambios)) {
          this.cambios = data.cambios;
        }

        if (Array.isArray(data.usuarios)) {
          for (const u of data.usuarios) {
            this.usuarios.set(u.id, u);
            if (u.id >= this.nextUsuarioId) this.nextUsuarioId = u.id + 1;
          }
        }
      }
    } catch (err) {
      console.error('Error cargando seedData:', err);
    }

    // Asegurar que siempre existan los usuarios base
    if (!Array.from(this.usuarios.values()).some((u) => u.usuario.toLowerCase() === 'fray')) {
      const id = this.nextUsuarioId++;
      this.usuarios.set(id, {
        id,
        usuario: 'fray',
        nombre: 'Fray León Osorio Rivera',
        clave: '123',
        roles: 'Administrador',
      });
    }
    if (!Array.from(this.usuarios.values()).some((u) => u.usuario.toLowerCase() === 'frayosorio')) {
      const id = this.nextUsuarioId++;
      this.usuarios.set(id, {
        id,
        usuario: 'frayosorio',
        nombre: 'Fray León Osorio Rivera',
        clave: '123',
        roles: 'Usuario',
      });
    }
  }

  // --- Monedas ---
  public async listarMonedas(): Promise<Moneda[]> {
    if (db.isAvailable()) {
      try {
        const res = await db.query('SELECT id, sigla, moneda AS nombre, simbolo, emisor FROM Moneda ORDER BY id');
        return res.rows;
      } catch (err) {
        console.error('Error querying PostgreSQL Moneda, fallback to memory:', err);
      }
    }
    return Array.from(this.monedas.values());
  }

  public async obtenerMoneda(id: number): Promise<Moneda | null> {
    if (db.isAvailable()) {
      try {
        const res = await db.query('SELECT id, sigla, moneda AS nombre, simbolo, emisor FROM Moneda WHERE id = $1', [id]);
        return res.rows[0] || null;
      } catch (err) {
        console.error('Error querying PostgreSQL Moneda by ID:', err);
      }
    }
    return this.monedas.get(id) ?? null;
  }

  public async buscarMonedas(nombre: string): Promise<Moneda[]> {
    if (db.isAvailable()) {
      try {
        const pattern = `%${nombre.toLowerCase()}%`;
        const res = await db.query(
          'SELECT id, sigla, moneda AS nombre, simbolo, emisor FROM Moneda WHERE LOWER(moneda) LIKE $1 OR LOWER(sigla) LIKE $1 ORDER BY id',
          [pattern]
        );
        return res.rows;
      } catch (err) {
        console.error('Error searching PostgreSQL Moneda:', err);
      }
    }
    const q = nombre.toLowerCase().trim();
    return Array.from(this.monedas.values()).filter(
      (m) =>
        m.nombre.toLowerCase().includes(q) ||
        m.sigla.toLowerCase().includes(q) ||
        (m.emisor && m.emisor.toLowerCase().includes(q))
    );
  }

  public async buscarMonedaPorPais(nombrePais: string): Promise<Moneda | null> {
    if (db.isAvailable()) {
      try {
        const res = await db.query(
          `SELECT m.id, m.sigla, m.moneda AS nombre, m.simbolo, m.emisor 
           FROM Pais p 
           JOIN Moneda m ON p.IdMoneda = m.Id 
           WHERE LOWER(p.Pais) = LOWER($1) OR LOWER(p.CodigoAlfa2) = LOWER($1) OR LOWER(p.CodigoAlfa3) = LOWER($1)
           LIMIT 1`,
          [nombrePais.trim()]
        );
        return res.rows[0] || null;
      } catch (err) {
        console.error('Error querying PostgreSQL buscarMonedaPorPais:', err);
      }
    }
    const q = nombrePais.toLowerCase().trim();
    const pais = Array.from(this.paises.values()).find(
      (p) => p.nombre.toLowerCase().includes(q) || p.codigoAlfa2.toLowerCase() === q || p.codigoAlfa3.toLowerCase() === q
    );
    if (!pais) return null;
    return this.monedas.get(pais.idMoneda) ?? null;
  }

  public async agregarMoneda(datos: Partial<Moneda>): Promise<Moneda> {
    if (db.isAvailable()) {
      try {
        const res = await db.query(
          'INSERT INTO Moneda (sigla, moneda, simbolo, emisor) VALUES ($1, $2, $3, $4) RETURNING id, sigla, moneda AS nombre, simbolo, emisor',
          [datos.sigla, datos.nombre, datos.simbolo ?? null, datos.emisor ?? null]
        );
        return res.rows[0];
      } catch (err) {
        console.error('Error inserting PostgreSQL Moneda:', err);
      }
    }
    const id = this.nextMonedaId++;
    const nueva: Moneda = {
      id,
      nombre: datos.nombre || '',
      sigla: datos.sigla || '',
      simbolo: datos.simbolo ?? null,
      emisor: datos.emisor ?? null,
    };
    this.monedas.set(id, nueva);
    return nueva;
  }

  public async modificarMoneda(datos: Moneda): Promise<Moneda | null> {
    if (db.isAvailable()) {
      try {
        const res = await db.query(
          'UPDATE Moneda SET sigla = $1, moneda = $2, simbolo = $3, emisor = $4 WHERE id = $5 RETURNING id, sigla, moneda AS nombre, simbolo, emisor',
          [datos.sigla, datos.nombre, datos.simbolo ?? null, datos.emisor ?? null, datos.id]
        );
        return res.rows[0] || null;
      } catch (err) {
        console.error('Error updating PostgreSQL Moneda:', err);
      }
    }
    if (!this.monedas.has(datos.id)) return null;
    const actual = this.monedas.get(datos.id)!;
    const actualizada: Moneda = {
      ...actual,
      ...datos,
    };
    this.monedas.set(datos.id, actualizada);
    return actualizada;
  }

  public async eliminarMoneda(id: number): Promise<boolean> {
    if (db.isAvailable()) {
      try {
        const res = await db.query('DELETE FROM Moneda WHERE id = $1', [id]);
        return (res.rowCount ?? 0) > 0;
      } catch (err) {
        console.error('Error deleting PostgreSQL Moneda:', err);
        return false;
      }
    }
    return this.monedas.delete(id);
  }

  public async listarPorPeriodo(idMoneda: number, desde: string | Date, hasta: string | Date): Promise<CambioMoneda[]> {
    if (db.isAvailable()) {
      try {
        const res = await db.query(
          `SELECT cm.id, cm.idmoneda AS "idMoneda", to_char(cm.fecha, 'YYYY-MM-DD') AS fecha, cm.cambio AS valor,
                  m.id AS m_id, m.sigla AS m_sigla, m.moneda AS m_nombre
           FROM CambioMoneda cm
           JOIN Moneda m ON cm.idmoneda = m.id
           WHERE cm.idmoneda = $1 AND cm.fecha >= $2 AND cm.fecha <= $3
           ORDER BY cm.fecha ASC`,
          [idMoneda, desde, hasta]
        );
        return res.rows.map((r) => ({
          id: r.id,
          idMoneda: r.idMoneda,
          fecha: r.fecha,
          valor: r.valor,
          moneda: {
            id: r.m_id,
            sigla: r.m_sigla,
            nombre: r.m_nombre,
          },
        }));
      } catch (err) {
        console.error('Error querying PostgreSQL CambioMoneda:', err);
      }
    }

    const parseDateToTimestamp = (d: string | Date): number => {
      if (d instanceof Date) return d.getTime();
      const parts = String(d).split(/[-/]/);
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return new Date(y, m, day).getTime();
      }
      return new Date(d).getTime();
    };

    const tDesde = parseDateToTimestamp(desde);
    const tHasta = parseDateToTimestamp(hasta);
    const moneda = this.monedas.get(idMoneda);

    return this.cambios
      .filter((c) => {
        if (c.idMoneda !== idMoneda) return false;
        const t = parseDateToTimestamp(c.fecha);
        return t >= tDesde && t <= tHasta;
      })
      .map((c) => ({
        ...c,
        moneda: moneda || undefined,
      }))
      .sort((a, b) => parseDateToTimestamp(a.fecha) - parseDateToTimestamp(b.fecha));
  }

  // --- Países ---
  public async listarPaises(): Promise<Pais[]> {
    if (db.isAvailable()) {
      try {
        const res = await db.query(`
          SELECT p.id, p.pais AS nombre, p.codigoalfa2 AS "codigoAlfa2", p.codigoalfa3 AS "codigoAlfa3", p.idmoneda AS "idMoneda",
                 m.id AS m_id, m.sigla AS m_sigla, m.moneda AS m_nombre
          FROM Pais p
          LEFT JOIN Moneda m ON p.idmoneda = m.id
          ORDER BY p.id
        `);
        return res.rows.map((r) => ({
          id: r.id,
          nombre: r.nombre,
          codigoAlfa2: r.codigoAlfa2,
          codigoAlfa3: r.codigoAlfa3,
          idMoneda: r.idMoneda,
          moneda: r.m_id ? { id: r.m_id, sigla: r.m_sigla, nombre: r.m_nombre } : undefined,
        }));
      } catch (err) {
        console.error('Error querying PostgreSQL Paises:', err);
      }
    }
    return Array.from(this.paises.values()).map((p) => ({
      ...p,
      moneda: this.monedas.get(p.idMoneda) || undefined,
    }));
  }

  public async obtenerPais(id: number): Promise<Pais | null> {
    if (db.isAvailable()) {
      try {
        const res = await db.query(
          `SELECT p.id, p.pais AS nombre, p.codigoalfa2 AS "codigoAlfa2", p.codigoalfa3 AS "codigoAlfa3", p.idmoneda AS "idMoneda",
                  m.id AS m_id, m.sigla AS m_sigla, m.moneda AS m_nombre
           FROM Pais p
           LEFT JOIN Moneda m ON p.idmoneda = m.id
           WHERE p.id = $1`,
          [id]
        );
        if (!res.rows[0]) return null;
        const r = res.rows[0];
        return {
          id: r.id,
          nombre: r.nombre,
          codigoAlfa2: r.codigoAlfa2,
          codigoAlfa3: r.codigoAlfa3,
          idMoneda: r.idMoneda,
          moneda: r.m_id ? { id: r.m_id, sigla: r.m_sigla, nombre: r.m_nombre } : undefined,
        };
      } catch (err) {
        console.error('Error querying PostgreSQL Pais by ID:', err);
      }
    }
    const p = this.paises.get(id);
    if (!p) return null;
    return {
      ...p,
      moneda: this.monedas.get(p.idMoneda) || undefined,
    };
  }

  public async buscarPaises(nombre: string): Promise<Pais[]> {
    if (db.isAvailable()) {
      try {
        const pattern = `%${nombre.toLowerCase()}%`;
        const res = await db.query(
          `SELECT p.id, p.pais AS nombre, p.codigoalfa2 AS "codigoAlfa2", p.codigoalfa3 AS "codigoAlfa3", p.idmoneda AS "idMoneda",
                  m.id AS m_id, m.sigla AS m_sigla, m.moneda AS m_nombre
           FROM Pais p
           LEFT JOIN Moneda m ON p.idmoneda = m.id
           WHERE LOWER(p.pais) LIKE $1 OR LOWER(p.codigoalfa2) LIKE $1 OR LOWER(p.codigoalfa3) LIKE $1
           ORDER BY p.id`,
          [pattern]
        );
        return res.rows.map((r) => ({
          id: r.id,
          nombre: r.nombre,
          codigoAlfa2: r.codigoAlfa2,
          codigoAlfa3: r.codigoAlfa3,
          idMoneda: r.idMoneda,
          moneda: r.m_id ? { id: r.m_id, sigla: r.m_sigla, nombre: r.m_nombre } : undefined,
        }));
      } catch (err) {
        console.error('Error searching PostgreSQL Paises:', err);
      }
    }
    const q = nombre.toLowerCase().trim();
    return Array.from(this.paises.values())
      .filter((p) => p.nombre.toLowerCase().includes(q) || p.codigoAlfa2.toLowerCase().includes(q) || p.codigoAlfa3.toLowerCase().includes(q))
      .map((p) => ({
        ...p,
        moneda: this.monedas.get(p.idMoneda) || undefined,
      }));
  }

  public async agregarPais(datos: Partial<Pais>): Promise<Pais> {
    if (db.isAvailable()) {
      try {
        const idMoneda = datos.idMoneda || (datos.moneda?.id ?? 1);
        const res = await db.query(
          `INSERT INTO Pais (pais, codigoalfa2, codigoalfa3, idmoneda) 
           VALUES ($1, $2, $3, $4) 
           RETURNING id, pais AS nombre, codigoalfa2 AS "codigoAlfa2", codigoalfa3 AS "codigoAlfa3", idmoneda AS "idMoneda"`,
          [datos.nombre, datos.codigoAlfa2, datos.codigoAlfa3, idMoneda]
        );
        const nuevo = res.rows[0];
        const moneda = await this.obtenerMoneda(nuevo.idMoneda);
        nuevo.moneda = moneda || undefined;
        return nuevo;
      } catch (err) {
        console.error('Error inserting PostgreSQL Pais:', err);
      }
    }
    const id = this.nextPaisId++;
    const nuevo: Pais = {
      id,
      nombre: datos.nombre || '',
      codigoAlfa2: datos.codigoAlfa2 || '',
      codigoAlfa3: datos.codigoAlfa3 || '',
      idMoneda: datos.idMoneda || (datos.moneda?.id ?? 1),
    };
    nuevo.moneda = this.monedas.get(nuevo.idMoneda);
    this.paises.set(id, nuevo);
    return nuevo;
  }

  public async modificarPais(datos: Pais): Promise<Pais | null> {
    if (db.isAvailable()) {
      try {
        const idMoneda = datos.idMoneda || (datos.moneda?.id ?? 1);
        const res = await db.query(
          `UPDATE Pais 
           SET pais = $1, codigoalfa2 = $2, codigoalfa3 = $3, idmoneda = $4 
           WHERE id = $5 
           RETURNING id, pais AS nombre, codigoalfa2 AS "codigoAlfa2", codigoalfa3 AS "codigoAlfa3", idmoneda AS "idMoneda"`,
          [datos.nombre, datos.codigoAlfa2, datos.codigoAlfa3, idMoneda, datos.id]
        );
        if (!res.rows[0]) return null;
        const actualizado = res.rows[0];
        const moneda = await this.obtenerMoneda(actualizado.idMoneda);
        actualizado.moneda = moneda || undefined;
        return actualizado;
      } catch (err) {
        console.error('Error updating PostgreSQL Pais:', err);
      }
    }
    if (!this.paises.has(datos.id)) return null;
    const actual = this.paises.get(datos.id)!;
    const actualizado: Pais = {
      ...actual,
      ...datos,
      idMoneda: datos.idMoneda || datos.moneda?.id || actual.idMoneda,
    };
    actualizado.moneda = this.monedas.get(actualizado.idMoneda);
    this.paises.set(datos.id, actualizado);
    return actualizado;
  }

  public async eliminarPais(id: number): Promise<boolean> {
    if (db.isAvailable()) {
      try {
        const res = await db.query('DELETE FROM Pais WHERE id = $1', [id]);
        return (res.rowCount ?? 0) > 0;
      } catch (err) {
        console.error('Error deleting PostgreSQL Pais:', err);
        return false;
      }
    }
    return this.paises.delete(id);
  }

  public async obtenerCapital(nombrePais: string): Promise<CapitalDto> {
    const divisionUrl = process.env.DIVISION_POLITICA_URL || 'http://api-division-politica:3030';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${divisionUrl}/paises/capital/${encodeURIComponent(nombrePais)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data: any = await res.json();
        if (data && (data.ciudad || data.capital)) {
          return {
            ciudad: data.ciudad || data.capital,
            estado: data.estado || 'Capital',
          };
        }
      }
    } catch {
      // Fallback al diccionario local
    }

    const capitals: Record<string, { ciudad: string; estado: string }> = {
      colombia: { ciudad: 'Bogotá', estado: 'Distrito Capital' },
      argentina: { ciudad: 'Buenos Aires', estado: 'Ciudad Autónoma de Buenos Aires' },
      españa: { ciudad: 'Madrid', estado: 'Comunidad de Madrid' },
      'estados unidos': { ciudad: 'Washington, D.C.', estado: 'Distrito de Columbia' },
      mexico: { ciudad: 'Ciudad de México', estado: 'CDMX' },
      méxico: { ciudad: 'Ciudad de México', estado: 'CDMX' },
      francia: { ciudad: 'París', estado: 'Isla de Francia' },
      alemania: { ciudad: 'Berlín', estado: 'Berlín' },
      'reino unido': { ciudad: 'Londres', estado: 'Gran Londres' },
      italia: { ciudad: 'Roma', estado: 'Lacio' },
      brasil: { ciudad: 'Brasilia', estado: 'Distrito Federal' },
      chile: { ciudad: 'Santiago', estado: 'Región Metropolitana de Santiago' },
      peru: { ciudad: 'Lima', estado: 'Provincia de Lima' },
      perú: { ciudad: 'Lima', estado: 'Provincia de Lima' },
      uruguay: { ciudad: 'Montevideo', estado: 'Montevideo' },
      venezuela: { ciudad: 'Caracas', estado: 'Distrito Capital' },
      ecuador: { ciudad: 'Quito', estado: 'Pichincha' },
      bolivia: { ciudad: 'Sucre / La Paz', estado: 'Chuquisaca / La Paz' },
      paraguay: { ciudad: 'Asunción', estado: 'Distrito Capital' },
      japón: { ciudad: 'Tokio', estado: 'Kanto' },
      japon: { ciudad: 'Tokio', estado: 'Kanto' },
      china: { ciudad: 'Pekín', estado: 'Beijing' },
      canadá: { ciudad: 'Ottawa', estado: 'Ontario' },
      canada: { ciudad: 'Ottawa', estado: 'Ontario' },
      australia: { ciudad: 'Canberra', estado: 'Territorio de la Capital Australiana' },
    };

    const key = nombrePais.toLowerCase().trim();
    if (capitals[key]) {
      return capitals[key];
    }

    const paisEncontrado = Array.from(this.paises.values()).find((p) =>
      p.nombre.toLowerCase().includes(key) || key.includes(p.nombre.toLowerCase())
    );

    if (paisEncontrado) {
      const matchKey = paisEncontrado.nombre.toLowerCase();
      if (capitals[matchKey]) {
        return capitals[matchKey];
      }
      return {
        ciudad: `Capital de ${paisEncontrado.nombre}`,
        estado: 'Distrito Central',
      };
    }

    return {
      ciudad: `Capital de ${nombrePais}`,
      estado: 'Distrito Capital',
    };
  }

  // --- Usuarios ---
  public async validarUsuario(usuario: string, clave: string): Promise<Usuario | null> {
    const userClean = (usuario || '').trim();
    const passClean = (clave || '').trim();

    if (db.isAvailable()) {
      try {
        const res = await db.query(
          'SELECT id, usuario, nombre, roles FROM Usuario WHERE LOWER(usuario) = LOWER($1) AND clave = $2 AND activo = true',
          [userClean, passClean]
        );
        return res.rows[0] || null;
      } catch (err) {
        console.error('Error validating PostgreSQL Usuario:', err);
      }
    }
    for (const u of this.usuarios.values()) {
      if (u.usuario.toLowerCase() === userClean.toLowerCase() && (u.clave || '').trim() === passClean) {
        const { clave: _, ...sinClave } = u;
        return sinClave as Usuario;
      }
    }
    return null;
  }

  public async listarUsuarios(): Promise<Usuario[]> {
    if (db.isAvailable()) {
      try {
        const res = await db.query('SELECT id, usuario, nombre, roles FROM Usuario ORDER BY id');
        return res.rows;
      } catch (err) {
        console.error('Error querying PostgreSQL Usuarios:', err);
      }
    }
    return Array.from(this.usuarios.values()).map(({ clave: _, ...u }) => u);
  }

  public async obtenerUsuario(id: number): Promise<Usuario | null> {
    if (db.isAvailable()) {
      try {
        const res = await db.query('SELECT id, usuario, nombre, roles FROM Usuario WHERE id = $1', [id]);
        return res.rows[0] || null;
      } catch (err) {
        console.error('Error querying PostgreSQL Usuario by ID:', err);
      }
    }
    const u = this.usuarios.get(id);
    if (!u) return null;
    const { clave: _, ...sinClave } = u;
    return sinClave as Usuario;
  }

  public async buscarUsuarios(nombre: string): Promise<Usuario[]> {
    if (db.isAvailable()) {
      try {
        const pattern = `%${nombre.toLowerCase()}%`;
        const res = await db.query(
          'SELECT id, usuario, nombre, roles FROM Usuario WHERE LOWER(nombre) LIKE $1 OR LOWER(usuario) LIKE $1',
          [pattern]
        );
        return res.rows;
      } catch (err) {
        console.error('Error searching PostgreSQL Usuarios:', err);
      }
    }
    const q = nombre.toLowerCase().trim();
    return Array.from(this.usuarios.values())
      .filter((u) => u.nombre.toLowerCase().includes(q) || u.usuario.toLowerCase().includes(q))
      .map(({ clave: _, ...u }) => u);
  }

  public async agregarUsuario(datos: Partial<Usuario>): Promise<Usuario> {
    if (db.isAvailable()) {
      try {
        const res = await db.query(
          'INSERT INTO Usuario (usuario, nombre, clave, roles) VALUES ($1, $2, $3, $4) RETURNING id, usuario, nombre, roles',
          [datos.usuario, datos.nombre, datos.clave || '123', datos.roles || 'Usuario']
        );
        return res.rows[0];
      } catch (err) {
        console.error('Error inserting PostgreSQL Usuario:', err);
      }
    }
    const id = this.nextUsuarioId++;
    const nuevo: Usuario = {
      id,
      usuario: datos.usuario || `user_${id}`,
      nombre: datos.nombre || '',
      clave: datos.clave || '123',
      roles: datos.roles || 'Usuario',
    };
    this.usuarios.set(id, nuevo);
    const { clave: _, ...sinClave } = nuevo;
    return sinClave as Usuario;
  }

  public async modificarUsuario(datos: Usuario): Promise<Usuario | null> {
    if (db.isAvailable()) {
      try {
        const res = await db.query(
          'UPDATE Usuario SET usuario = $1, nombre = $2, roles = $3 WHERE id = $4 RETURNING id, usuario, nombre, roles',
          [datos.usuario, datos.nombre, datos.roles || 'Usuario', datos.id]
        );
        return res.rows[0] || null;
      } catch (err) {
        console.error('Error updating PostgreSQL Usuario:', err);
      }
    }
    if (!this.usuarios.has(datos.id)) return null;
    const actual = this.usuarios.get(datos.id)!;
    const actualizado: Usuario = {
      ...actual,
      ...datos,
      clave: datos.clave || actual.clave,
    };
    this.usuarios.set(datos.id, actualizado);
    const { clave: _, ...sinClave } = actualizado;
    return sinClave as Usuario;
  }

  public async eliminarUsuario(id: number): Promise<boolean> {
    if (db.isAvailable()) {
      try {
        const res = await db.query('DELETE FROM Usuario WHERE id = $1', [id]);
        return (res.rowCount ?? 0) > 0;
      } catch (err) {
        console.error('Error deleting PostgreSQL Usuario:', err);
        return false;
      }
    }
    return this.usuarios.delete(id);
  }
}

export const store = new MonedaStore();
