import React, { useState } from 'react';
import { Server, Database, Calendar, Sparkles, CheckCircle2, Copy, ExternalLink, Terminal, Play, Layers } from 'lucide-react';

export const MicroservicesDelivery: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2028);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleTestFestivos = async () => {
    setLoadingAction('festivos');
    setTestResult(null);
    try {
      const res = await fetch(`http://localhost:8081/api/festivos/obtener/${selectedYear}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setTestResult({
          servicio: 'API Festivos (MongoDB)',
          accion: `Festivos calculados y poblados en la colección 'festivos' de MongoDB para el año ${selectedYear}`,
          total: data.length,
          muestra: data.slice(0, 5),
        });
      } else {
        setTestResult({
          servicio: 'API Festivos (MongoDB)',
          accion: `Comando listo para ejecutar en tu terminal:`,
          comando: `curl http://localhost:8081/api/festivos/obtener/${selectedYear}`,
          nota: 'Petición que calcula los festivos con Ley Emiliani/Pascua y los guarda como documentos en la colección festivos de MongoDB.',
        });
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTestCalendario = async () => {
    setLoadingAction('calendario');
    setTestResult(null);
    try {
      const res = await fetch(`http://localhost:8082/api/calendario/generar/${selectedYear}`, { method: 'POST' }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setTestResult({
          servicio: 'API Calendario Laboral (PostgreSQL)',
          accion: `Calendario laboral generado y poblado en PostgreSQL para el año ${selectedYear}`,
          detalle: data,
        });
      } else {
        setTestResult({
          servicio: 'API Calendario Laboral (PostgreSQL)',
          accion: `Comando listo para ejecutar en tu terminal:`,
          comando: `curl -X POST http://localhost:8082/api/calendario/generar/${selectedYear}`,
          nota: 'Petición que consulta la API de Festivos (MongoDB), clasifica los 366/365 días y los inserta en la tabla dialaboral de PostgreSQL.',
        });
      }
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Banner Principal */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/70 border border-emerald-800/60 p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Arquitectura Políglota: NoSQL + SQL
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Docker Compose
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-2 flex items-center gap-2">
              <Layers className="w-6 h-6 text-emerald-400" />
              Microservicios Contenerizados: Festivos & Calendario Laboral
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Solución desacoplada con <strong>Persistencia Políglota</strong>: API Festivos almacena documentos en <strong>MongoDB</strong> (NoSQL) y API Calendario Laboral persiste registros en <strong>PostgreSQL</strong> (SQL Relacional).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              docker-compose.yml listo
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Contenedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contenedor 1 y BD 1 (MongoDB) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">API Festivos</h3>
                  <p className="text-xs text-slate-400 font-mono">Contenedor: api_festivos | Puerto: 8081</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Port 8081
              </span>
            </div>

            <p className="text-sm text-slate-300 mb-4">
              Calcula días festivos de Colombia bajo la <strong>Ley 51 de 1983 (Ley Emiliani)</strong> y algoritmos de Pascua. Al recibir una petición, calcula y puebla la colección <code className="text-emerald-300 font-mono">festivos</code> en <strong>MongoDB</strong>.
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5 mb-4">
              <div className="flex justify-between text-slate-400">
                <span>Base de Datos:</span>
                <span className="text-emerald-400 font-semibold">festivos_db (MongoDB 7 - NoSQL)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Contenedor BD:</span>
                <span className="text-white">bd_festivos_mongo (Puerto 27017)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Colecciones:</span>
                <span className="text-emerald-400">tipos, festivos, consultas_festivos</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800">
            <a
              href="http://localhost:8081/swagger-ui.html"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Swagger Festivos
            </a>
            <a
              href="http://localhost:8085"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-emerald-800/30 hover:bg-emerald-800/50 text-emerald-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              Mongo Express UI
            </a>
            <button
              onClick={handleTestFestivos}
              disabled={loadingAction === 'festivos'}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ml-auto"
            >
              <Play className="w-3.5 h-3.5" />
              Probar ({selectedYear})
            </button>
          </div>
        </div>

        {/* Contenedor 2 y BD 2 (PostgreSQL) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">API Calendario Laboral</h3>
                  <p className="text-xs text-slate-400 font-mono">Contenedor: api_calendario_laboral | Puerto: 8082</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                Port 8082
              </span>
            </div>

            <p className="text-sm text-slate-300 mb-4">
              Consume el microservicio de festivos y genera los 365 o 366 días del año. Determina días laborales, fines de semana y festivos, insertando cada día en la tabla <code className="text-indigo-300 font-mono">DiaLaboral</code> de <strong>PostgreSQL</strong>.
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5 mb-4">
              <div className="flex justify-between text-slate-400">
                <span>Base de Datos:</span>
                <span className="text-indigo-400 font-semibold">calendario_db (PostgreSQL 16 - SQL)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Contenedor BD:</span>
                <span className="text-white">bd_calendario (Puerto 5434)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tablas principales:</span>
                <span className="text-indigo-400">dialaboral, peticioncalendario</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800">
            <a
              href="http://localhost:8082/swagger-ui.html"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Swagger Calendario
            </a>
            <a
              href="http://localhost:5050"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-indigo-800/30 hover:bg-indigo-800/50 text-indigo-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              pgAdmin UI
            </a>
            <button
              onClick={handleTestCalendario}
              disabled={loadingAction === 'calendario'}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ml-auto"
            >
              <Play className="w-3.5 h-3.5" />
              Generar ({selectedYear})
            </button>
          </div>
        </div>
      </div>

      {/* Selector de año para pruebas */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-white">Año para pruebas de poblamiento</h4>
          <p className="text-xs text-slate-400">Elige qué año enviar a las APIs para registrar en MongoDB y PostgreSQL</p>
        </div>
        <div className="flex items-center gap-2">
          {[2024, 2025, 2026, 2027, 2028].map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedYear === yr
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      {/* Resultados de prueba */}
      {testResult && (
        <div className="p-5 bg-slate-950 border border-indigo-900/60 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              {testResult.servicio} — {testResult.accion}
            </span>
            <button onClick={() => setTestResult(null)} className="text-xs text-slate-500 hover:text-white">Cerrar</button>
          </div>
          {testResult.comando && (
            <div className="p-3 bg-slate-900 rounded-xl font-mono text-xs text-emerald-400 flex items-center justify-between">
              <code>{testResult.comando}</code>
              <button
                onClick={() => copyToClipboard(testResult.comando, 'cmd-test')}
                className="text-slate-400 hover:text-white text-xs flex items-center gap-1 ml-2"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedText === 'cmd-test' ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          )}
          {testResult.nota && <p className="text-xs text-slate-300">{testResult.nota}</p>}
          {testResult.muestra && (
            <div className="bg-slate-900/90 rounded-xl p-3 text-xs font-mono text-slate-300 overflow-x-auto">
              <pre>{JSON.stringify(testResult.muestra, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Instrucciones y Evidencias para la Entrega */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          Guía de Verificación en Terminal y Gestores Visuales
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Paso 1: Iniciar Contenedores */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 text-xs flex items-center justify-center font-mono">1</span>
                Levantar contenedores con Docker
              </span>
              <button
                onClick={() => copyToClipboard('docker compose up -d --build', 'cmd1')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                {copiedText === 'cmd1' ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <pre className="text-xs font-mono text-emerald-400 bg-slate-900 p-2.5 rounded-lg overflow-x-auto">
              docker compose up -d --build
            </pre>
            <p className="text-xs text-slate-400">
              Levanta MongoDB, PostgreSQL, ambas APIs, pgAdmin y Mongo Express.
            </p>
          </div>

          {/* Paso 2: Consultar MongoDB por terminal */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 text-xs flex items-center justify-center font-mono">2</span>
                Consultar festivos en MongoDB
              </span>
              <button
                onClick={() => copyToClipboard('docker exec -it bd_festivos_mongo mongosh -u admin -p admin123 --authenticationDatabase admin --eval "use festivos_db; db.festivos.find({ anio: 2028 }).pretty()"', 'cmd2')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                {copiedText === 'cmd2' ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <pre className="text-xs font-mono text-emerald-400 bg-slate-900 p-2.5 rounded-lg overflow-x-auto">
              docker exec -it bd_festivos_mongo mongosh -u admin -p admin123 --eval "db.getSiblingDB('festivos_db').festivos.find()"
            </pre>
            <p className="text-xs text-slate-400">
              O entra visualmente a <strong>http://localhost:8085</strong> (Mongo Express).
            </p>
          </div>
        </div>

        {/* Gestores Visuales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
            <div>
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Mongo Express (MongoDB UI)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                <strong>http://localhost:8085</strong> — Explora colecciones y documentos NoSQL
              </p>
            </div>
            <a
              href="http://localhost:8085"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium"
            >
              Abrir
            </a>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
            <div>
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                pgAdmin (PostgreSQL UI)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                <strong>http://localhost:5050</strong> — Consulta la tabla <code>dialaboral</code>
              </p>
            </div>
            <a
              href="http://localhost:5050"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium"
            >
              Abrir
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
