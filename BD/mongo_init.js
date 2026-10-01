// MongoDB Initialization Script for festivos_db
db = db.getSiblingDB('festivos_db');

// 1. Colección de tipos de festivos (Ley Emiliani)
db.createCollection('tipos');
db.tipos.deleteMany({});
db.tipos.insertMany([
  {
    id: 1,
    tipo: 'Fijo',
    descripcion: 'Festivo con fecha fija inamovible (ej. Año Nuevo, Día del Trabajo, Navidad)'
  },
  {
    id: 2,
    tipo: 'Ley Emiliani',
    descripcion: 'Fecha fija pero se traslada al lunes siguiente (Ley 51 de 1983)'
  },
  {
    id: 3,
    tipo: 'Basado en Pascua (Fijo)',
    descripcion: 'Semana Santa, calculado relativo al Domingo de Resurrección sin traslado'
  },
  {
    id: 4,
    tipo: 'Basado en Pascua y Ley Emiliani',
    descripcion: 'Calculado sobre Pascua y trasladado al siguiente lunes (Ascensión, Corpus Christi)'
  }
]);

// 2. Colección de festivos calculados y poblados
db.createCollection('festivos');
db.festivos.createIndex({ nombre: 1, anio: 1, fechaCelebracion: 1 }, { unique: true });
db.festivos.createIndex({ anio: 1 });
db.festivos.createIndex({ fechaCelebracion: 1 });

// 3. Colección de auditoría y consultas
db.createCollection('consultas_festivos');
db.consultas_festivos.createIndex({ fechaConsultada: 1 });
db.consultas_festivos.createIndex({ fechaRegistro: -1 });

print('✅ MongoDB festivos_db inicializado correctamente con colecciones e índices.');
