import React, { useState, useEffect } from 'react';
import { Database, FileCode, Copy, Check, Download, Layers, Table, RefreshCw } from 'lucide-react';

export const SqlViewer: React.FC = () => {
  const [selectedScript, setSelectedScript] = useState<'ddl' | 'dml'>('ddl');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/sql/${selectedScript}`)
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
      })
      .catch((err) => {
        setContent(`-- Error cargando script: ${err.message}`);
      })
      .finally(() => setLoading(false));
  }, [selectedScript]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = selectedScript === 'ddl' ? 'DDL_Monedas.sql' : 'DML_Monedas.sql';
    const blob = new Blob([content], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Tabla Moneda</p>
            <p className="text-lg font-bold text-white">177 Registros</p>
            <p className="text-[10px] text-slate-500 font-mono">DML_Monedas.sql</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 rounded-lg bg-sky-500/10 text-sky-400">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Tabla Pais</p>
            <p className="text-lg font-bold text-white">249 Registros</p>
            <p className="text-[10px] text-slate-500 font-mono">DML_Monedas.sql</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Tabla CambioMoneda</p>
            <p className="text-lg font-bold text-white">1,869 Registros</p>
            <p className="text-[10px] text-slate-500 font-mono">Histórico cotizaciones</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Estado de Carga</p>
            <p className="text-lg font-bold text-emerald-400">100% Precargado</p>
            <p className="text-[10px] text-slate-500 font-mono">En memoria / PostgreSQL</p>
          </div>
        </div>
      </div>

      {/* Script Selector and Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Scripts SQL de la Base de Datos Monedas</h3>
              <p className="text-xs text-slate-400">Ubicación física: /BD/DDL_Monedas.sql y /BD/DML_Monedas.sql</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs for DDL vs DML */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setSelectedScript('ddl')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedScript === 'ddl'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                DDL (Estructura)
              </button>
              <button
                onClick={() => setSelectedScript('dml')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedScript === 'dml'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                DML (Datos & Inserts)
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
              title="Copiar código SQL"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
              title="Descargar archivo .sql"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar .sql</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="relative">
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
              <p className="text-xs">Cargando archivo SQL...</p>
            </div>
          ) : (
            <pre className="p-5 text-xs font-mono text-slate-300 bg-slate-950 overflow-x-auto max-h-[600px] overflow-y-auto leading-relaxed whitespace-pre">
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
