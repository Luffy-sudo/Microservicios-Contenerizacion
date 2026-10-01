import React, { useState } from 'react';
import { Terminal, Send, CheckCircle2, XCircle, Copy, Check } from 'lucide-react';

interface Endpoint {
  group: 'Monedas' | 'Países' | 'Usuarios' | 'Información';
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  desc: string;
  defaultBody?: any;
  defaultParams?: Record<string, string>;
  requiresAuth?: boolean;
}

const ENDPOINTS: Endpoint[] = [
  // Monedas
  {
    group: 'Monedas',
    method: 'GET',
    path: '/api/monedas/listar',
    desc: 'Obtiene el listado completo de todas las monedas registradas.',
  },
  {
    group: 'Monedas',
    method: 'GET',
    path: '/api/monedas/obtener/{id}',
    desc: 'Obtiene una moneda específica mediante su identificador numérico.',
    defaultParams: { id: '35' },
  },
  {
    group: 'Monedas',
    method: 'GET',
    path: '/api/monedas/buscar/{nombre}',
    desc: 'Busca monedas cuyo nombre o sigla contenga el texto buscado.',
    defaultParams: { nombre: 'Peso' },
  },
  {
    group: 'Monedas',
    method: 'GET',
    path: '/api/monedas/buscarporpais/{nombre}',
    desc: 'Busca la moneda oficial asignada a un país por su nombre.',
    defaultParams: { nombre: 'Colombia' },
  },
  {
    group: 'Monedas',
    method: 'GET',
    path: '/api/monedas/listarporperiodo',
    desc: 'Obtiene el histórico de cambio para una moneda entre dos fechas.',
    defaultParams: { idMoneda: '35', desde: '2018-01-01', hasta: '2018-02-15' },
  },
  {
    group: 'Monedas',
    method: 'POST',
    path: '/api/monedas/agregar',
    desc: 'Registra una nueva moneda en el sistema.',
    requiresAuth: true,
    defaultBody: {
      nombre: 'Moneda de Prueba',
      sigla: 'TST',
      simbolo: 'T$',
      emisor: 'Banco Central de Prueba',
    },
  },
  {
    group: 'Monedas',
    method: 'PUT',
    path: '/api/monedas/modificar',
    desc: 'Modifica los datos de una moneda existente.',
    requiresAuth: true,
    defaultBody: {
      id: 35,
      nombre: 'Peso Colombiano Actualizado',
      sigla: 'COP',
      simbolo: '$',
      emisor: 'Banco de la República',
    },
  },
  {
    group: 'Monedas',
    method: 'DELETE',
    path: '/api/monedas/eliminar/{id}',
    desc: 'Elimina una moneda por su ID.',
    requiresAuth: true,
    defaultParams: { id: '999' },
  },

  // Países
  {
    group: 'Países',
    method: 'GET',
    path: '/api/paises/listar',
    desc: 'Lista todos los países con sus códigos Alfa-2, Alfa-3 y su divisa asociada.',
  },
  {
    group: 'Países',
    method: 'GET',
    path: '/api/paises/obtener/{id}',
    desc: 'Obtiene información de un país por su identificador numérico.',
    defaultParams: { id: '170' },
  },
  {
    group: 'Países',
    method: 'GET',
    path: '/api/paises/buscar/{nombre}',
    desc: 'Busca países por nombre o código internacional.',
    defaultParams: { nombre: 'Argentina' },
  },
  {
    group: 'Países',
    method: 'GET',
    path: '/api/paises/capital/{pais}',
    desc: 'Obtiene la capital de un país mediante el servicio de integración.',
    defaultParams: { pais: 'Colombia' },
  },
  {
    group: 'Países',
    method: 'POST',
    path: '/api/paises/agregar',
    desc: 'Registra un nuevo país con su moneda vinculada.',
    requiresAuth: true,
    defaultBody: {
      nombre: 'Utopía',
      codigoAlfa2: 'UT',
      codigoAlfa3: 'UTO',
      idMoneda: 149,
    },
  },
  {
    group: 'Países',
    method: 'PUT',
    path: '/api/paises/modificar',
    desc: 'Modifica un país existente.',
    requiresAuth: true,
    defaultBody: {
      id: 170,
      nombre: 'Colombia',
      codigoAlfa2: 'CO',
      codigoAlfa3: 'COL',
      idMoneda: 35,
    },
  },
  {
    group: 'Países',
    method: 'DELETE',
    path: '/api/paises/eliminar/{id}',
    desc: 'Elimina un país por su identificador.',
    requiresAuth: true,
    defaultParams: { id: '999' },
  },

  // Usuarios y Auth
  {
    group: 'Usuarios',
    method: 'GET',
    path: '/api/usuarios/login/{nombreUsuario}/{clave}',
    desc: 'Autentica a un usuario y genera un JWT Bearer Token válido por 30 minutos.',
    defaultParams: { nombreUsuario: 'fray', clave: '123' },
  },
  {
    group: 'Usuarios',
    method: 'GET',
    path: '/api/usuarios/listar',
    desc: 'Lista todos los usuarios del sistema.',
  },
  {
    group: 'Usuarios',
    method: 'GET',
    path: '/api/usuarios/obtener/{id}',
    desc: 'Obtiene los datos de un usuario por su ID.',
    defaultParams: { id: '1' },
  },
  {
    group: 'Usuarios',
    method: 'GET',
    path: '/api/usuarios/buscar/{nombre}',
    desc: 'Busca usuarios por nombre.',
    defaultParams: { nombre: 'Fray' },
  },
  {
    group: 'Usuarios',
    method: 'POST',
    path: '/api/usuarios/agregar',
    desc: 'Registra un nuevo usuario.',
    requiresAuth: true,
    defaultBody: {
      usuario: 'nuevo_analista',
      nombre: 'Analista de Divisas',
      clave: 'clave456',
      roles: 'Analista',
    },
  },

  // Info
  {
    group: 'Información',
    method: 'GET',
    path: '/api/info',
    desc: 'Estado del servicio, rutas disponibles y estadísticas de la API.',
  },
];

interface Props {
  token: string | null;
  onSetToken?: (t: string) => void;
}

export const ApiExplorer: React.FC<Props> = ({ token, onSetToken }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(ENDPOINTS[0]);
  const [urlParams, setUrlParams] = useState<Record<string, string>>({});
  const [bodyText, setBodyText] = useState<string>('');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseBody, setResponseBody] = useState<string>('');
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const selectEndpoint = (ep: Endpoint) => {
    setSelectedEndpoint(ep);
    setUrlParams(ep.defaultParams || {});
    setBodyText(ep.defaultBody ? JSON.stringify(ep.defaultBody, null, 2) : '');
    setResponseStatus(null);
    setResponseBody('');
  };

  const executeRequest = async () => {
    setLoading(true);
    setResponseStatus(null);
    setResponseBody('');
    const startTime = performance.now();

    try {
      // Build URL replacing path variables e.g. {id}
      let finalPath = selectedEndpoint.path;
      const queryParams: string[] = [];

      for (const [key, val] of Object.entries(urlParams)) {
        const placeholder = `{${key}}`;
        if (finalPath.includes(placeholder)) {
          finalPath = finalPath.replace(placeholder, encodeURIComponent(val));
        } else if (selectedEndpoint.method === 'GET') {
          queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
        }
      }

      if (queryParams.length > 0) {
        finalPath += (finalPath.includes('?') ? '&' : '?') + queryParams.join('&');
      }

      const headers: Record<string, string> = {};
      if (selectedEndpoint.method !== 'GET') {
        headers['Content-Type'] = 'application/json';
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers,
      };

      if (['POST', 'PUT'].includes(selectedEndpoint.method) && bodyText.trim()) {
        options.body = bodyText;
      }

      const res = await fetch(finalPath, options);
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      setResponseStatus(res.status);

      const headerObj: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        headerObj[k] = v;
      });
      setResponseHeaders(headerObj);

      const text = await res.text();
      try {
        const parsed = JSON.parse(text);
        setResponseBody(JSON.stringify(parsed, null, 2));

        // If this was login and returned a token, update user token automatically
        if (selectedEndpoint.path.includes('/login') && parsed.token && onSetToken) {
          onSetToken(parsed.token);
        }
      } catch {
        setResponseBody(text);
      }
    } catch (err: any) {
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      setResponseStatus(500);
      setResponseBody(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const copyCurl = () => {
    let finalPath = selectedEndpoint.path;
    for (const [key, val] of Object.entries(urlParams)) {
      finalPath = finalPath.replace(`{${key}}`, val);
    }
    let cmd = `curl -X ${selectedEndpoint.method} "${window.location.origin}${finalPath}"`;
    if (token) cmd += ` \\\n  -H "Authorization: Bearer ${token}"`;
    if (['POST', 'PUT'].includes(selectedEndpoint.method) && bodyText.trim()) {
      cmd += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${bodyText.replace(/\n/g, '')}'`;
    }
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            Explorador Interactivo de Endpoints (Swagger REST Console)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ejecuta y prueba en vivo todas las rutas migradas desde los controladores Spring Boot.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {token ? (
            <span className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              JWT Bearer Activo
            </span>
          ) : (
            <span className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              Sin Token (Solo lectura)
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Endpoint List Navigation */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-3 max-h-[750px] overflow-y-auto space-y-4">
          {(['Monedas', 'Países', 'Usuarios', 'Información'] as const).map((group) => {
            const groupEndpoints = ENDPOINTS.filter((e) => e.group === group);
            return (
              <div key={group} className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-2">
                  {group}
                </div>
                {groupEndpoints.map((ep, idx) => {
                  const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
                  return (
                    <button
                      key={idx}
                      onClick={() => selectEndpoint(ep)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-indigo-600/20 border border-indigo-500/40 text-white font-medium shadow-sm'
                          : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                      }`}
                    >
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          ep.method === 'GET'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : ep.method === 'POST'
                            ? 'bg-sky-500/20 text-sky-400'
                            : ep.method === 'PUT'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {ep.method}
                      </span>
                      <span className="font-mono truncate">{ep.path}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Right: Request and Response Panel */}
        <div className="lg:col-span-8 space-y-5">
          {/* Selected endpoint header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-mono text-sm">
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-md ${
                    selectedEndpoint.method === 'GET'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : selectedEndpoint.method === 'POST'
                      ? 'bg-sky-500/20 text-sky-400'
                      : selectedEndpoint.method === 'PUT'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {selectedEndpoint.method}
                </span>
                <span className="text-white font-semibold">{selectedEndpoint.path}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyCurl}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
                  title="Copiar comando cURL"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'cURL'}
                </button>
                <button
                  onClick={executeRequest}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-950/40"
                >
                  <Send className={`w-3.5 h-3.5 ${loading ? 'animate-pulse' : ''}`} />
                  {loading ? 'Ejecutando...' : 'Enviar Request'}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400">{selectedEndpoint.desc}</p>

            {/* URL Parameters if any */}
            {selectedEndpoint.defaultParams && Object.keys(selectedEndpoint.defaultParams).length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <p className="text-xs font-semibold text-slate-300">Parámetros</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.keys(selectedEndpoint.defaultParams).map((pKey) => (
                    <div key={pKey}>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">{pKey}</label>
                      <input
                        type="text"
                        value={urlParams[pKey] || ''}
                        onChange={(e) => setUrlParams({ ...urlParams, [pKey]: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request Body if POST/PUT */}
            {['POST', 'PUT'].includes(selectedEndpoint.method) && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300">Request Body (JSON)</label>
                <textarea
                  rows={6}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Response Inspector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Respuesta del Servidor
              </h3>
              {responseStatus !== null && (
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span
                    className={`flex items-center gap-1 font-bold ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'text-emerald-400'
                        : responseStatus === 401 || responseStatus === 403
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {responseStatus >= 200 && responseStatus < 300 ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    HTTP {responseStatus}
                  </span>
                  {responseTime !== null && (
                    <span className="text-slate-500">{responseTime}ms</span>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-500 font-mono">
                Esperando respuesta del servidor...
              </div>
            ) : responseBody ? (
              <div className="relative">
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-400 max-h-96 overflow-y-auto whitespace-pre-wrap">
                  {responseBody}
                </pre>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 font-mono">
                Haz clic en "Enviar Request" para probar este endpoint.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
