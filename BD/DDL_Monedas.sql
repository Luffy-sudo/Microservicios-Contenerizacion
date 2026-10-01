--Ejecutar primero
DROP DATABASE IF EXISTS Monedas;
--Ejecutar segundo
CREATE DATABASE Monedas; 

--Para las siguientes instrucciones, se debe cambiar la conexión

/* Crear tabla MONEDA */
CREATE TABLE Moneda( 
	Id SERIAL PRIMARY KEY,
	Moneda VARCHAR(100) NOT NULL,
	Sigla VARCHAR(5) NOT NULL,
	Simbolo VARCHAR(5) NULL,
	Emisor VARCHAR(100) NULL,
	Imagen BYTEA NULL
	);

/* Crear indice para MONEDA
	ordenado por MONEDA */
CREATE UNIQUE INDEX ixMoneda
	ON Moneda(Moneda);

/* Crear tabla CAMBIOMONEDA */
CREATE TABLE CambioMoneda( 
    Id SERIAL PRIMARY KEY,
	IdMoneda int NOT NULL,
	CONSTRAINT fkCambioMoneda_IdMoneda FOREIGN KEY (IdMoneda)
		REFERENCES Moneda(Id),
	Fecha DATE NOT NULL,
	Cambio FLOAT NOT NULL
);

/* Crear indice para CAMBIOMONEDA
	ordenado por MONEDA, FECHA */
CREATE UNIQUE INDEX ixCambioMoneda
	ON CambioMoneda(IdMoneda, Fecha);

/* Crear tabla PAIS */
CREATE TABLE Pais(
	Id SERIAL PRIMARY KEY,
	Pais varchar(50) not null,
	CodigoAlfa2 varchar(5) not null,
	CodigoAlfa3 varchar(5) not null, 
	IdMoneda int NOT NULL,
	CONSTRAINT fkPais_IdMoneda FOREIGN KEY (IdMoneda)
		REFERENCES Moneda(Id),
	Mapa BYTEA NULL,
	Bandera BYTEA NULL
	);

/* Crear indice para PAIS
	ordenado por PAIS */
CREATE UNIQUE INDEX ixPais
	ON Pais(Pais);
    
/* Crear tabla USUARIO */
CREATE TABLE Usuario( 
	Id SERIAL PRIMARY KEY,
	Usuario VARCHAR(100) NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
	Clave VARCHAR(100) NOT NULL,
    Activo BOOL DEFAULT(true) NOT NULL,
	Foto BYTEA NULL,
    Roles VARCHAR(100) NULL
	);
    
/* Crear indice para USUARIO
	ordenado por USUARIO */
CREATE UNIQUE INDEX ixUsuario_Usuario
	ON Usuario(Usuario);
	
-- Agregar un usuario para pruebas
INSERT INTO USUARIO
	(Usuario, Nombre, Clave, Roles)
	VALUES ('fray', 'Fray León Osorio Rivera', '123', 'Administrador');
    
--Agregar secuenciador para autonumerico de CAMBIOMONEDA
CREATE SEQUENCE CambioMoneda_Secuencia INCREMENT 1 START 1 
	OWNED BY CambioMoneda.Id;

ALTER TABLE CambioMoneda
	ALTER COLUMN Id SET DEFAULT NEXTVAL('CambioMoneda_Secuencia');
