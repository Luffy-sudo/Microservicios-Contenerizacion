# Microservicios: API Festivos y API Calendario Laboral (ITM)

Proyecto de arquitectura de microservicios contenerizados con **Docker Compose**, compuesto por dos APIs independientes con sus respectivas bases de datos relacionales en **PostgreSQL**, donde **las peticiones de la API pueblan automáticamente la base de datos**. Incluye **pgAdmin** preconfigurado para visualizar las bases de datos y documentaciones interactivas con **Swagger UI**.

---

## 🏗️ Arquitectura de la Solución

| Servicio | Contenedor | Imagen / Base | Puerto Host | Base de Datos | Descripción |
|---|---|---|---|---|---|
| **BD Festivos** | `bd_festivos` | `postgres:16-alpine` | `5433` | `festivos_db` | Almacena tipos de festivos, festivos por año y registro de consultas |
| **API Festivos** | `api_festivos` | Node.js 20 / TypeScript | `8081` | Conectado a `festivos_db` | Calcula festivos de Colombia (Ley Emiliani y Pascua) y puebla la BD |
| **BD Calendario** | `bd_calendario` | `postgres:16-alpine` | `5434` | `calendario_db` | Almacena días del año (laborales, fines de semana, festivos) y auditoría |
| **API Calendario** | `api_calendario_laboral` | Node.js 20 / TypeScript | `8082` | Conectado a `calendario_db` | Consume API Festivos, genera el calendario laboral y puebla la BD |
| **pgAdmin 4** | `pgadmin_monitoreo` | `dpage/pgadmin4` | `5050` | Gestor Web | Administrador de BD con ambos servidores preconfigurados |

---

## 🚀 Despliegue Rápido (1 solo comando)

Clona el repositorio e inicia todos los servicios con Docker Compose:

```bash
docker compose up -d --build
```

Para verificar que todos los contenedores están arriba y saludables:

```bash
docker compose ps
```

---

## 📡 Endpoints y Evidencia de Población de Bases de Datos

### 1. API Festivos (Puerto `8081`)
- **Swagger UI:** [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)
- **Poblar y obtener festivos de un año:**
  ```bash
  curl http://localhost:8081/api/festivos/obtener/2026
  ```
  *(Al ejecutar esta petición, la API calcula los 18 festivos de Colombia según la Ley Emiliani y Pascua y los **inserta en la tabla `Festivo`** de `festivos_db`).*
- **Verificar si una fecha es festiva:**
  ```bash
  curl http://localhost:8081/api/festivos/verificar/2026/01/01
  ```
  *(Registra la petición en la tabla `ConsultaFestivo`).*
- **Ver estado y total de registros en BD:**
  ```bash
  curl http://localhost:8081/api/festivos/status
  ```

---

### 2. API Calendario Laboral (Puerto `8082`)
- **Swagger UI:** [http://localhost:8082/swagger-ui.html](http://localhost:8082/swagger-ui.html)
- **Generar y poblar calendario laboral de un año:**
  ```bash
  curl -X POST http://localhost:8082/api/calendario/generar/2026
  ```
  *(La API consulta a `api-festivos`, calcula los 365 días diferenciando días hábiles, festivos y fines de semana, e **inserta los 365 registros en la tabla `DiaLaboral`** de `calendario_db`).*
- **Verificar si una fecha es laboral:**
  ```bash
  curl http://localhost:8082/api/calendario/es-laboral/2026-05-01
  ```
- **Calcular días hábiles en un rango:**
  ```bash
  curl "http://localhost:8082/api/calendario/dias-habiles?inicio=2026-01-01&fin=2026-01-31"
  ```
- **Ver estado y total de días poblados:**
  ```bash
  curl http://localhost:8082/api/calendario/status
  ```

---

## 🗄️ Acceso a las Bases de Datos desde pgAdmin

1. Ingresa en tu navegador a: **[http://localhost:5050](http://localhost:5050)**
2. Inicia sesión con:
   - **Correo:** `admin@admin.com`
   - **Contraseña:** `admin`
3. En el panel izquierdo verás el grupo **Microservicios ITM** con los dos servidores ya registrados:
   - **`BD Festivos (festivos_db)`** (Contraseña: `admin123`)
   - **`BD Calendario Laboral (calendario_db)`** (Contraseña: `admin123`)

### Consultas para evidenciar los datos poblados:

**En `festivos_db` (Query Tool):**
```sql
-- Ver los festivos calculados y guardados por las peticiones
SELECT * FROM Festivo ORDER BY FechaCelebracion ASC;

-- Ver el registro de peticiones de verificación
SELECT * FROM ConsultaFestivo ORDER BY FechaRegistro DESC;
```

**En `calendario_db` (Query Tool):**
```sql
-- Ver los días laborales y no laborales poblados
SELECT * FROM DiaLaboral ORDER BY Fecha ASC LIMIT 50;

-- Resumen estadístico del año
SELECT Anio, 
       COUNT(*) as TotalDias,
       COUNT(*) FILTER (WHERE EsLaboral = true) as DiasLaborales,
       COUNT(*) FILTER (WHERE EsFestivo = true) as Festivos,
       COUNT(*) FILTER (WHERE EsFinDeSemana = true) as FinesDeSemana
FROM DiaLaboral
GROUP BY Anio;
```
