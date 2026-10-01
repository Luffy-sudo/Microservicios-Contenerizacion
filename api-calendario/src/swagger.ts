import { Request, Response } from 'express';

export const openApiCalendarioSpec = {
  openapi: '3.0.0',
  info: {
    title: 'API Calendario Laboral',
    version: '1.0.0',
    description: 'Microservicio de Calendario Laboral que consume la API de Festivos para generar, consultar y poblar días laborales y no laborales en PostgreSQL.',
  },
  servers: [
    {
      url: '/',
      description: 'Servidor Actual',
    },
  ],
  paths: {
    '/api/calendario/obtener/{anio}': {
      get: {
        summary: 'Obtener o autogenerar calendario laboral de un año',
        description: 'Consulta los festivos de API Festivos y puebla los 365/366 días en la base de datos calendario_db.',
        parameters: [
          { name: 'anio', in: 'path', required: true, schema: { type: 'integer', default: 2026 } },
        ],
        responses: {
          200: { description: 'Lista de días del calendario laboral' },
        },
      },
    },
    '/api/calendario/generar/{anio}': {
      post: {
        summary: 'Forzar generación y poblamiento de un año',
        parameters: [
          { name: 'anio', in: 'path', required: true, schema: { type: 'integer', default: 2026 } },
        ],
        responses: {
          200: { description: 'Resumen de días generados y guardados en BD' },
        },
      },
    },
    '/api/calendario/es-laboral/{fecha}': {
      get: {
        summary: 'Verificar si una fecha es laboral',
        parameters: [
          { name: 'fecha', in: 'path', required: true, schema: { type: 'string', default: '2026-05-01' } },
        ],
        responses: {
          200: { description: 'Detalle del día (laboral, festivo o fin de semana)' },
        },
      },
    },
    '/api/calendario/dias-habiles': {
      get: {
        summary: 'Calcular días hábiles en un rango de fechas',
        parameters: [
          { name: 'inicio', in: 'query', required: true, schema: { type: 'string', default: '2026-01-01' } },
          { name: 'fin', in: 'query', required: true, schema: { type: 'string', default: '2026-01-31' } },
        ],
        responses: {
          200: { description: 'Conteo de días laborales, festivos y fines de semana' },
        },
      },
    },
    '/api/calendario/status': {
      get: {
        summary: 'Estado de conexión y total de días poblados',
        responses: {
          200: { description: 'Estadísticas de la base de datos' },
        },
      },
    },
  },
};

export const swaggerCalendarioHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>API Calendario Laboral - Swagger UI</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.11.0/favicon-32x32.png" sizes="32x32" />
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
    .topbar { display: none !important; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" charset="UTF-8"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "/api/swagger.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;

export function swaggerHandler(_req: Request, res: Response) {
  res.setHeader('Content-Type', 'text/html');
  res.send(swaggerCalendarioHtml);
}
