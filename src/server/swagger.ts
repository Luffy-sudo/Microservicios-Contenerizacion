import { Request, Response } from 'express';

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'API Cambio de Monedas',
    description: 'Documentación interactiva Swagger para el microservicio de cambio de monedas, países y usuarios (migrado de Spring Boot a Express).',
    version: '1.0.0',
    contact: {
      name: 'Soporte Técnico',
      email: 'soporte@itm.edu.co'
    }
  },
  servers: [
    {
      url: '/',
      description: 'Servidor Actual'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingrese el token JWT obtenido del endpoint /api/usuarios/login'
      }
    },
    schemas: {
      Moneda: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Dólar Estadounidense' },
          sigla: { type: 'string', example: 'USD' },
          simbolo: { type: 'string', example: '$' },
          emisor: { type: 'string', example: 'Reserva Federal' }
        },
        required: ['nombre', 'sigla']
      },
      Pais: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Colombia' },
          codigoAlfa2: { type: 'string', example: 'CO' },
          codigoAlfa3: { type: 'string', example: 'COL' },
          idMoneda: { type: 'integer', example: 1 },
          moneda: { $ref: '#/components/schemas/Moneda' }
        },
        required: ['nombre', 'codigoAlfa2', 'codigoAlfa3', 'idMoneda']
      },
      UsuarioLogin: {
        type: 'object',
        properties: {
          usuario: { type: 'string', example: 'frayosorio' },
          clave: { type: 'string', example: '123' }
        },
        required: ['usuario', 'clave']
      },
      PeriodoConsulta: {
        type: 'object',
        properties: {
          idMoneda: { type: 'integer', example: 1 },
          desde: { type: 'string', format: 'date', example: '2023-01-01' },
          hasta: { type: 'string', format: 'date', example: '2023-12-31' }
        },
        required: ['idMoneda', 'desde', 'hasta']
      }
    }
  },
  paths: {
    '/api/usuarios/login': {
      post: {
        tags: ['Usuarios y Autenticación'],
        summary: 'Iniciar sesión (Login) vía JSON',
        description: 'Autentica al usuario y devuelve el token JWT para autorizar los demás endpoints.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UsuarioLogin' }
            }
          }
        },
        responses: {
          '200': { description: 'Login exitoso y retorno de JWT' },
          '401': { description: 'Credenciales inválidas' }
        }
      }
    },
    '/api/usuarios/login/{usuario}/{clave}': {
      get: {
        tags: ['Usuarios y Autenticación'],
        summary: 'Iniciar sesión vía URL (Compatibilidad Spring Boot)',
        parameters: [
          { name: 'usuario', in: 'path', required: true, schema: { type: 'string', example: 'frayosorio' } },
          { name: 'clave', in: 'path', required: true, schema: { type: 'string', example: '123' } }
        ],
        responses: {
          '200': { description: 'Login exitoso y retorno de JWT' },
          '401': { description: 'Credenciales inválidas' }
        }
      }
    },
    '/api/usuarios/listar': {
      get: {
        tags: ['Usuarios y Autenticación'],
        summary: 'Listar todos los usuarios',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de usuarios' }
        }
      }
    },
    '/api/monedas/listar': {
      get: {
        tags: ['Monedas'],
        summary: 'Listar todas las monedas registradas',
        responses: {
          '200': { description: 'Lista de monedas' }
        }
      }
    },
    '/api/monedas/obtener/{id}': {
      get: {
        tags: ['Monedas'],
        summary: 'Obtener moneda por ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer', example: 1 } }
        ],
        responses: {
          '200': { description: 'Moneda encontrada' },
          '404': { description: 'Moneda no encontrada' }
        }
      }
    },
    '/api/monedas/buscar/{nombre}': {
      get: {
        tags: ['Monedas'],
        summary: 'Buscar monedas por nombre, sigla o emisor',
        parameters: [
          { name: 'nombre', in: 'path', required: true, schema: { type: 'string', example: 'peso' } }
        ],
        responses: {
          '200': { description: 'Monedas coincidentes' }
        }
      }
    },
    '/api/monedas/buscarporpais/{nombre}': {
      get: {
        tags: ['Monedas'],
        summary: 'Buscar moneda oficial asociada a un país',
        parameters: [
          { name: 'nombre', in: 'path', required: true, schema: { type: 'string', example: 'Colombia' } }
        ],
        responses: {
          '200': { description: 'Moneda del país' },
          '404': { description: 'País o moneda no encontrada' }
        }
      }
    },
    '/api/monedas/agregar': {
      post: {
        tags: ['Monedas'],
        summary: 'Registrar una nueva moneda',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Moneda' }
            }
          }
        },
        responses: {
          '201': { description: 'Moneda creada exitosamente' }
        }
      }
    },
    '/api/monedas/listarporperiodo': {
      get: {
        tags: ['Tasas de Cambio'],
        summary: 'Historial de cambio de una moneda por rango de fechas (GET query)',
        parameters: [
          { name: 'idMoneda', in: 'query', required: true, schema: { type: 'integer', example: 1 } },
          { name: 'desde', in: 'query', required: true, schema: { type: 'string', example: '2023-01-01' } },
          { name: 'hasta', in: 'query', required: true, schema: { type: 'string', example: '2023-12-31' } }
        ],
        responses: {
          '200': { description: 'Lista de tasas de cambio históricas' }
        }
      },
      post: {
        tags: ['Tasas de Cambio'],
        summary: 'Historial de cambio de una moneda por rango de fechas (POST body)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PeriodoConsulta' }
            }
          }
        },
        responses: {
          '200': { description: 'Lista de tasas de cambio históricas' }
        }
      }
    },
    '/api/paises/listar': {
      get: {
        tags: ['Países'],
        summary: 'Listar todos los países',
        responses: {
          '200': { description: 'Lista de países' }
        }
      }
    },
    '/api/paises/obtener/{id}': {
      get: {
        tags: ['Países'],
        summary: 'Obtener país por ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer', example: 1 } }
        ],
        responses: {
          '200': { description: 'País encontrado' },
          '404': { description: 'País no encontrado' }
        }
      }
    },
    '/api/paises/buscar/{nombre}': {
      get: {
        tags: ['Países'],
        summary: 'Buscar países por nombre o código alfa',
        parameters: [
          { name: 'nombre', in: 'path', required: true, schema: { type: 'string', example: 'Colombia' } }
        ],
        responses: {
          '200': { description: 'Países encontrados' }
        }
      }
    },
    '/api/paises/capital/{pais}': {
      get: {
        tags: ['Países'],
        summary: 'Consultar la capital de un país (Orquestación / Integración)',
        parameters: [
          { name: 'pais', in: 'path', required: true, schema: { type: 'string', example: 'Colombia' } }
        ],
        responses: {
          '200': { description: 'Capital y estado del país' }
        }
      }
    },
    '/api/db/status': {
      get: {
        tags: ['Sistema'],
        summary: 'Estado de conexión con PostgreSQL',
        responses: {
          '200': { description: 'Estado actual de la base de datos' }
        }
      }
    },
    '/api/info': {
      get: {
        tags: ['Sistema'],
        summary: 'Información general de la API y estadísticas',
        responses: {
          '200': { description: 'Metadatos del servicio' }
        }
      }
    },
    '/api/sql/ddl': {
      get: {
        tags: ['Sistema'],
        summary: 'Descargar o ver script SQL DDL',
        responses: {
          '200': { description: 'Script DDL de creación de tablas' }
        }
      }
    },
    '/api/sql/dml': {
      get: {
        tags: ['Sistema'],
        summary: 'Descargar o ver script SQL DML',
        responses: {
          '200': { description: 'Script DML de inserción de datos iniciales' }
        }
      }
    }
  }
};

export function swaggerHtmlHandler(_req: Request, res: Response) {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Swagger UI - API Cambio de Monedas</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.11.0/favicon-32x32.png" sizes="32x32" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; font-family: sans-serif; }
    .topbar { background-color: #1e293b !important; }
    .topbar-wrapper .link { color: #fff !important; font-weight: bold; font-size: 1.2rem; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" charset="UTF-8"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "/api/swagger.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        persistAuthorization: true
      });
      window.ui = ui;
    };
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}
