-- Script de inicialización para BD Calendario Laboral
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
