import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit3, Globe, DollarSign, RefreshCw, AlertCircle } from 'lucide-react';

interface Moneda {
  id: number;
  nombre: string;
  sigla: string;
  simbolo?: string | null;
  emisor?: string | null;
}

interface Props {
  token: string | null;
  onSelectCurrencyForHistory?: (id: number) => void;
}

export const CurrencyList: React.FC<Props> = ({ token, onSelectCurrencyForHistory }) => {
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [countrySearch, setCountrySearch] = useState<string>('');
  const [countryResult, setCountryResult] = useState<Moneda | null>(null);
  const [countrySearchError, setCountrySearchError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingMoneda, setEditingMoneda] = useState<Moneda | null>(null);
  const [formData, setFormData] = useState({ nombre: '', sigla: '', simbolo: '', emisor: '' });
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchMonedas = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await fetch('/api/monedas/listar');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setMonedas(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setMonedas([]);
      setActionError('Error cargando monedas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonedas();
  }, []);

  const handleSearchByCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countrySearch.trim()) return;
    setCountrySearchError(null);
    setCountryResult(null);
    try {
      const res = await fetch(`/api/monedas/buscarporpais/${encodeURIComponent(countrySearch.trim())}`);
      if (res.status === 404) {
        setCountrySearchError(`No se encontró moneda para el país "${countrySearch}"`);
        return;
      }
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      if (!data) {
        setCountrySearchError(`No se encontró moneda para el país "${countrySearch}"`);
      } else {
        setCountryResult(data);
      }
    } catch (err: any) {
      setCountrySearchError('Error al consultar: ' + err.message);
    }
  };

  const handleSaveMoneda = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      if (editingMoneda) {
        const payload = {
          id: editingMoneda.id,
          nombre: formData.nombre,
          sigla: formData.sigla,
          simbolo: formData.simbolo || null,
          emisor: formData.emisor || null,
        };
        const res = await fetch('/api/monedas/modificar', {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Error ${res.status}`);
        }
      } else {
        const payload = {
          nombre: formData.nombre,
          sigla: formData.sigla,
          simbolo: formData.simbolo || null,
          emisor: formData.emisor || null,
        };
        const res = await fetch('/api/monedas/agregar', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Error ${res.status}`);
        }
      }

      setShowAddModal(false);
      setEditingMoneda(null);
      setFormData({ nombre: '', sigla: '', simbolo: '', emisor: '' });
      await fetchMonedas();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Desea eliminar esta moneda?')) return;
    setActionError(null);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`/api/monedas/eliminar/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${res.status}`);
      }
      await fetchMonedas();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const safeMonedas = Array.isArray(monedas) ? monedas : [];
  const filteredMonedas = safeMonedas.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      (m.nombre && m.nombre.toLowerCase().includes(q)) ||
      (m.sigla && m.sigla.toLowerCase().includes(q)) ||
      (m.emisor && m.emisor.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Catálogo de Divisas y Monedas
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Total registrado: <span className="font-semibold text-emerald-400">{monedas.length}</span> monedas oficiales ISO 4217
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMonedas}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-sm"
            title="Recargar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
          <button
            onClick={() => {
              setEditingMoneda(null);
              setFormData({ nombre: '', sigla: '', simbolo: '', emisor: '' });
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors flex items-center gap-2 text-sm shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            Nueva Moneda
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div>{actionError}</div>
        </div>
      )}

      {/* Search and lookup by country */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Filter input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, código ISO (ej: USD, EUR, COP) o emisor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        {/* Search currency by country */}
        <form onSubmit={handleSearchByCountry} className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar moneda por país (ej: Colombia, Japón)..."
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-colors"
          >
            Consultar
          </button>
        </form>
      </div>

      {/* Country search result banner */}
      {countryResult && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center">
              {countryResult.sigla}
            </div>
            <div>
              <p className="text-xs text-emerald-400 font-medium">Moneda encontrada para "{countrySearch}":</p>
              <h4 className="text-base font-semibold text-white">
                {countryResult.nombre} ({countryResult.sigla}) {countryResult.simbolo ? `— ${countryResult.simbolo}` : ''}
              </h4>
            </div>
          </div>
          <button
            onClick={() => setCountryResult(null)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1"
          >
            Cerrar
          </button>
        </div>
      )}

      {countrySearchError && (
        <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl text-amber-300 text-xs flex items-center justify-between">
          <span>{countrySearchError}</span>
          <button onClick={() => setCountrySearchError(null)} className="text-slate-400 hover:text-white ml-2">×</button>
        </div>
      )}

      {/* Monedas Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-500" />
          <p>Cargando divisas...</p>
        </div>
      ) : filteredMonedas.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400">
          <p className="text-base">No se encontraron monedas que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredMonedas.map((moneda) => (
            <div
              key={moneda.id}
              className="bg-slate-900 border border-slate-800/90 hover:border-slate-700 transition-all rounded-xl p-4 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {moneda.sigla}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">ID: {moneda.id}</span>
                </div>
                <h3 className="text-sm font-semibold text-white line-clamp-2 min-h-[2.5rem]">
                  {moneda.nombre}
                </h3>
                {moneda.emisor && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                    <span className="text-slate-500">Emisor:</span> {moneda.emisor}
                  </p>
                )}
                {moneda.simbolo && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    <span className="text-slate-500">Símbolo:</span> <span className="font-mono">{moneda.simbolo}</span>
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                {onSelectCurrencyForHistory && (
                  <button
                    onClick={() => onSelectCurrencyForHistory(moneda.id)}
                    className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  >
                    Ver Histórico
                  </button>
                )}
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={() => {
                      setEditingMoneda(moneda);
                      setFormData({
                        nombre: moneda.nombre,
                        sigla: moneda.sigla,
                        simbolo: moneda.simbolo || '',
                        emisor: moneda.emisor || '',
                      });
                      setShowAddModal(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                    title="Modificar"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(moneda.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingMoneda ? `Modificar Moneda #${editingMoneda.id}` : 'Agregar Nueva Moneda'}
            </h3>

            <form onSubmit={handleSaveMoneda} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Nombre de la Moneda *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Peso Colombiano"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Sigla ISO (3-5 letras) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  placeholder="Ej: COP"
                  value={formData.sigla}
                  onChange={(e) => setFormData({ ...formData, sigla: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Símbolo (opcional)
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="Ej: $"
                    value={formData.simbolo}
                    onChange={(e) => setFormData({ ...formData, simbolo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Emisor / Banco
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Banco de la República"
                    value={formData.emisor}
                    onChange={(e) => setFormData({ ...formData, emisor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {!token && (
                <p className="text-xs text-amber-400 bg-amber-950/30 p-2.5 rounded-lg border border-amber-800/40">
                  Nota: Para modificar la base de datos se recomienda iniciar sesión como Administrador (fray / 123).
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
