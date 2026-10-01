# Informe de Entrega: Microservicios de Festivos y Calendario Laboral

**Integrantes:**
- Mateo Vallejo
- Carlos Steven Ríos

---

## 1. Arquitectura y Despliegue de Contenedores (Persistencia Políglota)

Se implementó una arquitectura orientada a microservicios contenerizados utilizando **Docker** y orquestados mediante **Docker Compose**. La solución sigue el patrón de **Persistencia Políglota (Polyglot Persistence)**, donde cada servicio utiliza el motor de base de datos óptimo para su modelo de dominio:
1. **API Festivos:** Almacenamiento no relacional basado en documentos con **MongoDB**.
2. **API Calendario Laboral:** Almacenamiento relacional transaccional estructurado con **PostgreSQL**.
3. **Gestores Visuales:** **Mongo Express** para inspección NoSQL y **pgAdmin** para administración SQL.

### Evidencia de Contenedores en Ejecución

![[Pasted image 20260929214916.png]]

> *Figura 1: Contenedores activos y en estado saludable dentro de Docker (`api-festivos`, `api-calendario`, `bd_festivos_mongo`, `bd_calendario`, `pgadmin_monitoreo`, `mongo_express_ui`).*

---

<div style="page-break-after: always;"></div>

## 2. Microservicio 1: API de Días Festivos (Colombia) con MongoDB

Microservicio encargado del cálculo y provisión de los días festivos en Colombia para cualquier año solicitado, implementando estrictamente las reglas de la **Ley 51 de 1983 (Ley Emiliani)**:
- **Tipo 1:** Festivos con fecha fija inamovible.
- **Tipo 2:** Festivos con traslado al siguiente lunes (Ley Emiliani).
- **Tipo 3:** Festivos calculados en función del Domingo de Pascua (Semana Santa).
- **Tipo 4:** Festivos basados en Pascua y trasladables al lunes (Ascensión del Señor, Corpus Christi, Sagrado Corazón de Jesús).

### Consumo y Respuesta de la API de Festivos

![[Pasted image 20260929215327.png]]

> *Figura 2: Petición HTTP al endpoint de consulta de festivos con respuesta en formato JSON estructurado.*

### Persistencia en Base de Datos NoSQL (`festivos_db` en MongoDB)

Al realizarse la consulta, los festivos procesados se guardan automáticamente en la colección `festivos` de **MongoDB** para garantizar trazabilidad y optimizar las consultas sucesivas.

![[Pasted image 20260929220935.png]]

> *Figura 3: Consulta y verificación de los documentos de festivos y fechas de celebración calculadas.*

---

<div style="page-break-after: always;"></div>

## 3. Microservicio 2: API de Calendario Laboral con PostgreSQL

Este microservicio se comunica vía HTTP REST con la API de Festivos para construir la matriz anual completa de días, clasificando cada fecha entre día hábil (`eslaboral = true`) o día no hábil (`eslaboral = false`), discriminando fines de semana y festivos oficiales.

### Generación del Calendario Laboral

![[Pasted image 20260929214648.png]]

> *Figura 4: Ejecución del endpoint de generación y cálculo del calendario laboral anual.*

### Verificación y Registro en PostgreSQL (`calendario_db`)

Evidencia de los registros almacenados en la tabla `dialaboral` (ejemplo con el año bisiesto 2028, totalizando 366 registros clasificados):

![[Pasted image 20260929214814.png]]

> *Figura 5: Consulta SQL en pgAdmin mostrando la clasificación de días laborales, fines de semana, días festivos trasladados por Ley Emiliani y marcas de auditoría.*

---

## 4. Conclusiones Técnicas

1. **Persistencia Políglota y Desacoplamiento:** Se implementó con éxito una arquitectura híbrida donde **API Festivos** opera con **MongoDB** (NoSQL orientado a documentos) y **API Calendario Laboral** opera con **PostgreSQL** (SQL relacional), demostrando independencia total de almacenamiento entre microservicios.
2. **Cálculo Preciso de Reglas de Negocio:** Se validó satisfactoriamente el algoritmo de cálculo de Pascua y la traslación de fechas según la Ley Emiliani, así como el soporte para años bisiestos.
3. **Poblado Dinámico por HTTP:** Se demostró que las peticiones a los endpoints disparan de manera efectiva la persistencia en las colecciones de MongoDB y tablas de PostgreSQL.
