import { Request, Response } from 'express';

export const openApiFestivosSpec = {
  openapi: '3.0.0',
  info: {
    title: 'API Festivos de Colombia',
    version: '1.0.0',
    description: 'Microservicio para la determinación, cálculo (Ley Emiliani y Pascua) y consulta de días festivos en Colombia. Las peticiones pueblan la base de datos NoSQL MongoDB.',
  },
  servers: [
    {
      url: '/',
      description: 'Servidor Actual',
    },
  ],
  paths: {
    '/api/festivos/obtener/{anio}': {
      get: {
        summary: 'Obtener y poblar festivos de un año',
        description: 'Calcula y registra en MongoDB (colección festivos) todos los festivos del año indicado si aún no existen.',
        parameters: [
          {
            name: 'anio',
            in: 'path',
            required: true,
            schema: { type: 'integer', default: 2026 },
            description: 'Año a consultar (ej: 2026)',
          },
        ],
        responses: {
          200: {
            description: 'Lista de festivos para el año',
          },
        },
      },
    },
    '/api/festivos/verificar/{anio}/{mes}/{dia}': {
      get: {
        summary: 'Verificar si una fecha es festiva',
        description: 'Verifica si la fecha es festiva y registra la petición en la colección consultas_festivos de MongoDB.',
        parameters: [
          { name: 'anio', in: 'path', required: true, schema: { type: 'integer', default: 2026 } },
          { name: 'mes', in: 'path', required: true, schema: { type: 'integer', default: 1 } },
          { name: 'dia', in: 'path', required: true, schema: { type: 'integer', default: 1 } },
        ],
        responses: {
          200: {
            description: 'Resultado de la verificación',
          },
        },
      },
    },
    '/api/festivos/poblar/{anio}': {
      post: {
        summary: 'Forzar poblamiento de festivos para un año',
        parameters: [
          { name: 'anio', in: 'path', required: true, schema: { type: 'integer', default: 2026 } },
        ],
        responses: {
          200: {
            description: 'Confirmación de poblamiento exitoso',
          },
        },
      },
    },
    '/api/festivos/tipos': {
      get: {
        summary: 'Listar tipos de festivos colombianos',
        responses: {
          200: {
            description: 'Catálogo de tipos de festivos',
          },
        },
      },
    },
    '/api/festivos/status': {
      get: {
        summary: 'Estado de la conexión a la base de datos',
        responses: {
          200: {
            description: 'Estado de conexión',
          },
        },
      },
    },
  },
};

export const swaggerFestivosHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>API Festivos - Swagger UI</title>
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
  res.send(swaggerFestivosHtml);
}
