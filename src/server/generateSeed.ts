import fs from 'fs';
import path from 'path';

function parseDML() {
  const dmlPath = path.resolve(process.cwd(), 'BD/DML_Monedas.sql');
  if (!fs.existsSync(dmlPath)) {
    console.error('No se encontró BD/DML_Monedas.sql');
    return;
  }

  const content = fs.readFileSync(dmlPath, 'utf8');
  const lines = content.split('\n');

  const monedas: any[] = [];
  const paises: any[] = [];
  const cambios: any[] = [];
  const usuarios: any[] = [];

  let nextCambioId = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('INSERT INTO')) continue;

    // 1. Moneda: INSERT INTO Moneda (Id, Sigla, Moneda) VALUES(1, 'AED', 'Dírham de los Emiratos Árabes Unidos');
    if (trimmed.startsWith('INSERT INTO Moneda')) {
      const match = trimmed.match(/VALUES\s*\(\s*(\d+)\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/i);
      if (match) {
        monedas.push({
          id: parseInt(match[1], 10),
          sigla: match[2],
          nombre: match[3],
          simbolo: null,
          emisor: null,
        });
      }
    }
    // 2. Pais: INSERT INTO Pais (Id, Pais, CodigoAlfa2, CodigoAlfa3, IdMoneda) VALUES(1, 'Afganistán', 'AF', 'AFG', 2);
    else if (trimmed.startsWith('INSERT INTO Pais')) {
      const match = trimmed.match(/VALUES\s*\(\s*(\d+)\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(\d+)\s*\)/i);
      if (match) {
        paises.push({
          id: parseInt(match[1], 10),
          nombre: match[2],
          codigoAlfa2: match[3],
          codigoAlfa3: match[4],
          idMoneda: parseInt(match[5], 10),
        });
      }
    }
    // 3. CambioMoneda: INSERT INTO CambioMoneda (IdMoneda, Fecha, Cambio) VALUES(7, '2018-1-13', 6.694);
    else if (trimmed.startsWith('INSERT INTO CambioMoneda')) {
      const match = trimmed.match(/VALUES\s*\(\s*(\d+)\s*,\s*'([^']+)'\s*,\s*([0-9.]+)\s*\)/i);
      if (match) {
        // Format fecha YYYY-MM-DD
        const dateParts = match[2].split('-');
        const y = dateParts[0];
        const m = dateParts[1].padStart(2, '0');
        const d = dateParts[2].padStart(2, '0');
        cambios.push({
          id: nextCambioId++,
          idMoneda: parseInt(match[1], 10),
          fecha: `${y}-${m}-${d}`,
          valor: parseFloat(match[3]),
        });
      }
    }
    // 4. Usuario:
    // INSERT INTO Usuario (Usuario, Nombre, Clave, Roles) VALUES ('fray', 'Fray León Osorio Rivera', '123', 'Administrador');
    // INSERT INTO Usuario (Usuario, Nombre, Clave) VALUES ('frayosorio', 'Fray León Osorio Rivera', '123');
    else if (trimmed.startsWith('INSERT INTO Usuario')) {
      if (trimmed.includes('Roles')) {
        const match = trimmed.match(/VALUES\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/i);
        if (match) {
          usuarios.push({
            id: usuarios.length + 1,
            usuario: match[1],
            nombre: match[2],
            clave: match[3],
            roles: match[4],
          });
        }
      } else {
        const match = trimmed.match(/VALUES\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/i);
        if (match) {
          usuarios.push({
            id: usuarios.length + 1,
            usuario: match[1],
            nombre: match[2],
            clave: match[3],
            roles: 'Usuario',
          });
        }
      }
    }
  }

  // Ensure default usuarios always exist
  if (!usuarios.some((u) => u.usuario === 'fray')) {
    usuarios.push({
      id: usuarios.length + 1,
      usuario: 'fray',
      nombre: 'Fray León Osorio Rivera',
      clave: '123',
      roles: 'Administrador',
    });
  }
  if (!usuarios.some((u) => u.usuario === 'frayosorio')) {
    usuarios.push({
      id: usuarios.length + 1,
      usuario: 'frayosorio',
      nombre: 'Fray León Osorio Rivera',
      clave: '123',
      roles: 'Usuario',
    });
  }

  const outData = {
    monedas,
    paises,
    cambios,
    usuarios,
  };

  const outPath = path.resolve(process.cwd(), 'src/server/seedData.json');
  fs.writeFileSync(outPath, JSON.stringify(outData, null, 2), 'utf8');
  console.log(`✅ seedData.json generado exitosamente:
    - ${monedas.length} monedas
    - ${paises.length} países
    - ${cambios.length} cambios
    - ${usuarios.length} usuarios`);
}

parseDML();
