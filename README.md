# Microservicios: API Festivos y API Calendario Laboral (ITM)

Proyecto de arquitectura de microservicios contenerizados con **Docker Compose**, compuesto por dos APIs independientes desacopladas bajo el patrón de **Persistencia Políglota (Polyglot Persistence)**:
- **API Festivos:** Almacenamiento NoSQL basado en documentos en **MongoDB**.
- **API Calendario Laboral:** Almacenamiento SQL relacional estructurado en **PostgreSQL**.

Las peticiones a las APIs calculan las reglas de negocio y **pueblan automáticamente las bases de datos**. Incluye **Mongo Express** (puerto `8085`) y **pgAdmin 4** (puerto `5050`) preconfigurados como gestores web gráficos, además de documentación interactiva en vivo con **Swagger UI**.

---

## 🏗️ Arquitectura de la Solución (Persistencia Políglota)

| Servicio | Contenedor | Imagen / Base | Puerto Host | Base de Datos / Rol | Descripción |
|---|---|---|---|---|---|
| **bd-festivos** | `bd_festivos_mongo` | `mongo:7-jammy` | `27017` | `festivos_db` (NoSQL) | Almacena colecciones `festivos`, `tipos` y auditoría `consultas_festivos` |
| **api-festivos** | `api_festivos` | Node.js 20 / TypeScript | `8081` | Conectado a MongoDB | Calcula festivos de Colombia (Ley Emiliani y Pascua) y puebla MongoDB |
| **bd-calendario** | `bd_calendario` | `postgres:16-alpine` | `5434` | `calendario_db` (SQL) | Almacena días del año (laborales, fines de semana, festivos) en `DiaLaboral` |
| **api-calendario** | `api_calendario_laboral` | Node.js 20 / TypeScript | `8082` | Conectado a PostgreSQL | Consume API Festivos, genera el calendario laboral y puebla la tabla |
| **mongo-express** | `mongo_express_ui` | `mongo-express:1.0.2` | `8085` | Gestor Web NoSQL | Administrador web gráfico interactivo para MongoDB |
| **pgadmin** | `pgadmin_monitoreo` | `dpage/pgadmin4:latest` | `5050` | Gestor Web SQL | Administrador web para PostgreSQL con servidor preconfigurado |

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

### 1. API Festivos (Puerto `8081` - MongoDB)
- **Swagger UI:** [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)
- **Poblar y obtener festivos de un año:**
  ```bash
  curl http://localhost:8081/api/festivos/obtener/2028
  ```
  *(Al ejecutar esta petición, la API calcula los 18-19 festivos de Colombia según la Ley Emiliani y Pascua y los **inserta como documentos en la colección `festivos`** de `festivos_db`).*
- **Verificar si una fecha es festiva:**
  ```bash
  curl http://localhost:8081/api/festivos/verificar/2028/01/10
  ```
  *(Registra la petición en la colección de auditoría `consultas_festivos`).*
- **Ver tipos de festivos (Ley Emiliani):**
  ```bash
  curl http://localhost:8081/api/festivos/tipos
  ```
- **Ver estado y total de documentos en MongoDB:**
  ```bash
  curl http://localhost:8081/api/festivos/status
  ```

---

### 2. API Calendario Laboral (Puerto `8082` - PostgreSQL)
- **Swagger UI:** [http://localhost:8082/swagger-ui.html](http://localhost:8082/swagger-ui.html)
- **Generar y poblar calendario laboral de un año:**
  ```bash
  curl -X POST http://localhost:8082/api/calendario/generar/2028
  ```
  *(La API consulta internamente a `api-festivos`, clasifica los 365 o 366 días diferenciando días hábiles, festivos y fines de semana, e **inserta los 366 registros en la tabla `DiaLaboral`** de `calendario_db`).*
- **Verificar si una fecha es laboral:**
  ```bash
  curl http://localhost:8082/api/calendario/es-laboral/2028-05-01
  ```
- **Calcular días hábiles en un rango:**
  ```bash
  curl "http://localhost:8082/api/calendario/dias-habiles?inicio=2028-01-01&fin=2028-01-31"
  ```
- **Ver estado y total de días poblados:**
  ```bash
  curl http://localhost:8082/api/calendario/status
  ```

---

## 🗄️ Acceso y Visualización de Bases de Datos

### 1. MongoDB a través de Mongo Express
1. Ingresa en tu navegador a: **[http://localhost:8085](http://localhost:8085)**
2. No requiere contraseña (configurado en modo directo).
3. Selecciona la base de datos **`festivos_db`** para visualizar:
   - Colección **`festivos`**: Documentos con los festivos calculados para cada año.
   - Colección **`tipos`**: Los 4 tipos según la Ley Emiliani y Pascua.
   - Colección **`consultas_festivos`**: Registro de auditoría de cada fecha consultada.

**Comprobación por Terminal (mongosh):**
```bash
docker exec -it bd_festivos_mongo mongosh -u admin -p admin123 --authenticationDatabase admin --eval "db.getSiblingDB('festivos_db').festivos.find({ anio: 2028 }).pretty()"
```

---

### 2. PostgreSQL a través de pgAdmin 4
1. Ingresa en tu navegador a: **[http://localhost:5050](http://localhost:5050)**
2. Inicia sesión con:
   - **Correo:** `admin@admin.com`
   - **Contraseña:** `admin`
3. En el panel izquierdo verás el servidor registrado:
   - **`BD Calendario Laboral (calendario_db)`** (Contraseña: `admin123`)

**Consultas en `calendario_db` (Query Tool de pgAdmin o psql):**
```sql
-- Ver los días laborales y no laborales poblados
SELECT * FROM DiaLaboral ORDER BY Fecha ASC LIMIT 50;

-- Resumen estadístico del año (ejemplo 2028 bisiesto: 366 días)
SELECT Anio, 
       COUNT(*) as TotalDias,
       COUNT(*) FILTER (WHERE EsLaboral = true) as DiasLaborales,
       COUNT(*) FILTER (WHERE EsFestivo = true) as Festivos,
       COUNT(*) FILTER (WHERE EsFinDeSemana = true) as FinesDeSemana
FROM DiaLaboral
GROUP BY Anio;
```

**Comprobación por Terminal (psql):**
```bash
docker exec -it bd_calendario psql -U admin -d calendario_db -c "SELECT COUNT(*), EsLaboral FROM DiaLaboral WHERE Anio = 2028 GROUP BY EsLaboral;"
```
