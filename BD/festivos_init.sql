-- Script de inicialización para BD Festivos
CREATE TABLE IF NOT EXISTS Tipo (
    Id INT PRIMARY KEY,
    Tipo VARCHAR(100) NOT NULL
);

INSERT INTO Tipo (Id, Tipo) VALUES
(1, 'Fijo'),
(2, 'Ley Emiliani (Trasladable a lunes)'),
(3, 'Basado en Pascua (Fijo)'),
(4, 'Basado en Pascua y Ley Emiliani')
ON CONFLICT (Id) DO NOTHING;

CREATE TABLE IF NOT EXISTS Festivo (
    Id SERIAL PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Dia INT NOT NULL,
    Mes INT NOT NULL,
    DiasPascua INT DEFAULT 0,
    IdTipo INT NOT NULL REFERENCES Tipo(Id),
    Anio INT NOT NULL,
    FechaCelebracion DATE NOT NULL,
    CONSTRAINT uq_festivo_anio UNIQUE (Nombre, Anio, FechaCelebracion)
);

CREATE TABLE IF NOT EXISTS ConsultaFestivo (
    Id SERIAL PRIMARY KEY,
    FechaConsultada DATE NOT NULL,
    EsFestivo BOOLEAN NOT NULL,
    Descripcion VARCHAR(150),
    FechaRegistro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
