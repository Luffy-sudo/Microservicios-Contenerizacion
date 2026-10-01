/* Crear tabla MONEDA */
CREATE TABLE IF NOT EXISTS Moneda( 
	Id SERIAL PRIMARY KEY,
	Moneda VARCHAR(100) NOT NULL,
	Sigla VARCHAR(5) NOT NULL,
	Simbolo VARCHAR(5) NULL,
	Emisor VARCHAR(100) NULL,
	Imagen BYTEA NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ixMoneda ON Moneda(Moneda);

/* Crear tabla CAMBIOMONEDA */
CREATE TABLE IF NOT EXISTS CambioMoneda( 
    Id SERIAL PRIMARY KEY,
	IdMoneda int NOT NULL REFERENCES Moneda(Id) ON DELETE CASCADE,
	Fecha DATE NOT NULL,
	Cambio FLOAT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ixCambioMoneda ON CambioMoneda(IdMoneda, Fecha);

/* Crear tabla PAIS */
CREATE TABLE IF NOT EXISTS Pais(
	Id SERIAL PRIMARY KEY,
	Pais varchar(100) not null,
	CodigoAlfa2 varchar(5) not null,
	CodigoAlfa3 varchar(5) not null, 
	IdMoneda int NOT NULL REFERENCES Moneda(Id) ON DELETE CASCADE,
	Mapa BYTEA NULL,
	Bandera BYTEA NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ixPais ON Pais(Pais);
    
/* Crear tabla USUARIO */
CREATE TABLE IF NOT EXISTS Usuario( 
	Id SERIAL PRIMARY KEY,
	Usuario VARCHAR(100) NOT NULL UNIQUE,
    Nombre VARCHAR(100) NOT NULL,
	Clave VARCHAR(100) NOT NULL,
    Activo BOOL DEFAULT(true) NOT NULL,
	Foto BYTEA NULL,
    Roles VARCHAR(100) NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ixUsuario_Usuario ON Usuario(Usuario);
	
-- Usuarios iniciales
INSERT INTO Usuario (Usuario, Nombre, Clave, Roles)
VALUES 
  ('fray', 'Fray León Osorio Rivera', '123', 'Administrador'),
  ('frayosorio', 'Fray León Osorio Rivera', '123', 'Usuario')
ON CONFLICT (Usuario) DO NOTHING;
