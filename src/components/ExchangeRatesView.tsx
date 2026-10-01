import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, TrendingUp, DollarSign, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface CambioMoneda {
  id: number;
  idMoneda: number;
  fecha: string;
  valor: number;
  moneda?: {
    id: number;
    nombre: string;
    sigla: string;
  };
}

interface Moneda {
  id: number;
  nombre: string;
  sigla: string;
}

interface Props {
  selectedCurrencyId?: number | null;
}

export const ExchangeRatesView: React.FC<Props> = ({ selectedCurrencyId }) => {
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [idMoneda, setIdMoneda] = useState<number>(selectedCurrencyId || 35); // 35 is COP in seed
  const [desde, setDesde] = useState<string>('2018-01-01');
  const [hasta, setHasta] = useState<string>('2018-02-15');
  const [cambios, setCambios] = useState<CambioMoneda[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load currencies list
  useEffect(() => {
    fetch('/api/monedas/listar')
      .then((res) => res.json())
      .then((data) => setMonedas(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setMonedas([]);
      });
  }, []);

  // Update selected currency if prop changes
  useEffect(() => {
    if (selectedCurrencyId) {
      setIdMoneda(selectedCurrencyId);
    }
  }, [selectedCurrencyId]);

  const consultarPeriodo = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use query parameters to call /api/monedas/listarporperiodo
      const url = `/api/monedas/listarporperiodo?idMoneda=${idMoneda}&desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setCambios(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setCambios([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    consultarPeriodo();
  }, [idMoneda]);

  const stats = useMemo(() => {
    if (!cambios.length) return null;
    const values = cambios.map((c) => c.valor);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((acc, curr) => acc + curr, 0) / values.length;
    const first = values[0];
    const last = values[values.length - 1];
    const diff = last - first;
    const pctChange = (diff / first) * 100;

    return { min, max, avg, first, last, diff, pctChange };
  }, [cambios]);

  const activeCurrency = monedas.find((m) => m.id === idMoneda);

  return (
    <div className="space-y-6">
      {/* Header filter controls */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          Tasas de Cambio Históricas por Periodo
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          {/* Currency select */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Seleccionar Divisa
            </label>
            <select
              value={idMoneda}
              onChange={(e) => setIdMoneda(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              {monedas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.sigla} - {m.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha Desde */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Fecha Desde
            </label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Fecha Hasta
            </label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Consult button */}
          <div>
            <button
              onClick={consultarPeriodo}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/40"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Consultar Periodo
            </button>
          </div>
        </div>

        {/* Quick hint for sample seed data */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="text-slate-500">Divisas con histórico precargado:</span>
          <button
            onClick={() => {
              setIdMoneda(35);
              setDesde('2018-01-01');
              setHasta('2018-02-15');
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono text-[11px]"
          >
            COP (Peso colombiano: 35)
          </button>
          <button
            onClick={() => {
              setIdMoneda(7);
              setDesde('2018-01-01');
              setHasta('2018-02-05');
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono text-[11px]"
          >
            ARS (Peso argentino: 7)
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Stats summary cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400">Último Valor Registrado</p>
            <p className="text-xl font-bold text-white mt-1">
              ${stats.last.toFixed(2)}
            </p>
            <p className={`text-xs mt-1 flex items-center gap-0.5 ${stats.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {stats.diff >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {stats.diff >= 0 ? '+' : ''}{stats.pctChange.toFixed(2)}% ({stats.diff.toFixed(2)})
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400">Valor Mínimo</p>
            <p className="text-xl font-bold text-white mt-1">
              ${stats.min.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500 mt-1">En el rango seleccionado</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400">Valor Máximo</p>
            <p className="text-xl font-bold text-white mt-1">
              ${stats.max.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500 mt-1">En el rango seleccionado</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-400">Promedio</p>
            <p className="text-xl font-bold text-white mt-1">
              ${stats.avg.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500 mt-1">{cambios.length} cotizaciones</p>
          </div>
        </div>
      )}

      {/* SVG Chart visualization */}
      {cambios.length > 0 && stats && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-semibold text-white">
                Comportamiento de Tasa de Cambio — {activeCurrency?.nombre} ({activeCurrency?.sigla})
              </h3>
              <p className="text-xs text-slate-400">
                Periodo: {desde} a {hasta}
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg font-mono">
              {cambios.length} Registros
            </span>
          </div>

          {/* Interactive Responsive SVG Graph */}
          <div className="w-full h-56 relative overflow-hidden">
            {(() => {
              const padding = { top: 20, right: 30, bottom: 30, left: 55 };
              const width = 800;
              const height = 220;
              const innerWidth = width - padding.left - padding.right;
              const innerHeight = height - padding.top - padding.bottom;

              const minVal = stats.min * 0.995;
              const maxVal = stats.max * 1.005;
              const valRange = maxVal - minVal || 1;

              const points = cambios.map((c, i) => {
                const x = padding.left + (i / (cambios.length - 1 || 1)) * innerWidth;
                const y = padding.top + innerHeight - ((c.valor - minVal) / valRange) * innerHeight;
                return { x, y, c };
              });

              const pathD = points.reduce(
                (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
                ''
              );

              const areaD = `${pathD} L ${points[points.length - 1].x},${padding.top + innerHeight} L ${points[0].x},${padding.top + innerHeight} Z`;

              return (
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  className="w-full h-full text-slate-500 overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                    const y = padding.top + innerHeight * (1 - pct);
                    const val = minVal + valRange * pct;
                    return (
                      <g key={idx}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={width - padding.right}
                          y2={y}
                          stroke="#1e293b"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={padding.left - 8}
                          y={y + 4}
                          textAnchor="end"
                          className="text-[10px] fill-slate-500 font-mono"
                        >
                          {val.toFixed(val > 100 ? 0 : 2)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Gradient fill under curve */}
                  <path d={areaD} fill="url(#areaGradient)" />

                  {/* The curve line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data points */}
                  {points.map((pt, i) => (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r={points.length > 50 ? 2 : 3.5}
                      className="fill-indigo-400 stroke-slate-900 stroke-2 hover:r-5 transition-all"
                    >
                      <title>{`${pt.c.fecha}: $${pt.c.valor}`}</title>
                    </circle>
                  ))}
                </svg>
              );
            })()}
          </div>
        </div>
      )}

      {/* Historical Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-white">
            Registros Detallados ({cambios.length})
          </h3>
          <span className="text-xs text-slate-500">
            Endpoint: <code className="text-slate-400 font-mono">/api/monedas/listarporperiodo</code>
          </span>
        </div>

        {cambios.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            {loading ? 'Cargando tasas de cambio...' : 'No se encontraron registros de cambio para este periodo y divisa.'}
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[11px] sticky top-0">
                <tr>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Moneda</th>
                  <th className="px-5 py-3 text-right">Valor de Cambio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {cambios.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-2.5 text-slate-200">{c.fecha}</td>
                    <td className="px-5 py-2.5 text-indigo-400">{activeCurrency?.sigla || c.idMoneda}</td>
                    <td className="px-5 py-2.5 text-right font-semibold text-emerald-400">
                      ${c.valor.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
