import React, { useState, useEffect } from 'react';
import { Globe, Search, Plus, Trash2, Edit3, Building2, RefreshCw, AlertCircle } from 'lucide-react';

interface Pais {
  id: number;
  nombre: string;
  codigoAlfa2: string;
  codigoAlfa3: string;
  idMoneda: number;
  moneda?: {
    id: number;
    nombre: string;
    sigla: string;
  };
}

interface CapitalData {
  pais: string;
  ciudad: string;
  estado: string;
}

interface Props {
  token: string | null;
}

export const CountryList: React.FC<Props> = ({ token }) => {
  const [paises, setPaises] = useState<Pais[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [capitalData, setCapitalData] = useState<CapitalData | null>(null);
  const [capitalLoading, setCapitalLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingPais, setEditingPais] = useState<Pais | null>(null);
  const [formData, setFormData] = useState({ nombre: '', codigoAlfa2: '', codigoAlfa3: '', idMoneda: 1 });
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchPaises = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await fetch('/api/paises/listar');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPaises(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setPaises([]);
      setActionError('Error cargando países: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaises();
  }, []);

  const handleConsultCapital = async (paisNombre: string) => {
    setCapitalLoading(true);
    try {
      const res = await fetch(`/api/paises/capital/${encodeURIComponent(paisNombre)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCapitalData({
        pais: paisNombre,
        ciudad: data.ciudad || 'No disponible',
        estado: data.estado || 'Capital',
      });
    } catch (err: any) {
      console.error(err);
    } finally {
      setCapitalLoading(false);
    }
  };

  const handleSavePais = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      if (editingPais) {
        const payload = {
          id: editingPais.id,
          nombre: formData.nombre,
          codigoAlfa2: formData.codigoAlfa2,
          codigoAlfa3: formData.codigoAlfa3,
          idMoneda: Number(formData.idMoneda),
        };
        const res = await fetch('/api/paises/modificar', {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
      } else {
        const payload = {
          nombre: formData.nombre,
          codigoAlfa2: formData.codigoAlfa2,
          codigoAlfa3: formData.codigoAlfa3,
          idMoneda: Number(formData.idMoneda),
        };
        const res = await fetch('/api/paises/agregar', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
      }

      setShowAddModal(false);
      setEditingPais(null);
      setFormData({ nombre: '', codigoAlfa2: '', codigoAlfa3: '', idMoneda: 1 });
      await fetchPaises();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Desea eliminar este país?')) return;
    setActionError(null);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/paises/eliminar/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      await fetchPaises();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const safePaises = Array.isArray(paises) ? paises : [];
  const filteredPaises = safePaises.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.nombre && p.nombre.toLowerCase().includes(q)) ||
      (p.codigoAlfa2 && p.codigoAlfa2.toLowerCase().includes(q)) ||
      (p.codigoAlfa3 && p.codigoAlfa3.toLowerCase().includes(q)) ||
      (p.moneda && ((p.moneda.nombre && p.moneda.nombre.toLowerCase().includes(q)) || (p.moneda.sigla && p.moneda.sigla.toLowerCase().includes(q))))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-sky-400" />
            Catálogo de Países y Divisas
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Total registrado: <span className="font-semibold text-sky-400">{paises.length}</span> países con codificación ISO 3166
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPaises}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
          <button
            onClick={() => {
              setEditingPais(null);
              setFormData({ nombre: '', codigoAlfa2: '', codigoAlfa3: '', idMoneda: 1 });
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium transition-colors flex items-center gap-2 text-sm shadow-lg shadow-sky-950/40"
          >
            <Plus className="w-4 h-4" />
            Nuevo País
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div>{actionError}</div>
        </div>
      )}

      {/* Capital preview banner */}
      {capitalData && (
        <div className="p-4 bg-sky-950/40 border border-sky-800/80 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-sky-600/20 text-sky-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-sky-400 font-medium">Capital consultada para {capitalData.pais}:</p>
              <h4 className="text-base font-semibold text-white">
                {capitalData.ciudad} <span className="text-xs font-normal text-slate-400 font-mono">({capitalData.estado})</span>
              </h4>
            </div>
          </div>
          <button
            onClick={() => setCapitalData(null)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar país por nombre, código Alfa-2/Alfa-3 (ej: CO, COL, ES, USA) o moneda..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        />
      </div>

      {/* Countries Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-sky-500" />
          <p>Cargando países...</p>
        </div>
      ) : filteredPaises.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400">
          <p>No se encontraron países con ese criterio de búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredPaises.map((pais) => (
            <div
              key={pais.id}
              className="bg-slate-900 border border-slate-800/90 hover:border-slate-700 transition-all rounded-xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                      {pais.codigoAlfa2}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {pais.codigoAlfa3}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">ID: {pais.id}</span>
                </div>

                <h3 className="text-sm font-semibold text-white mt-1">
                  {pais.nombre}
                </h3>

                <div className="mt-2 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <p className="text-[11px] text-slate-500 uppercase font-mono">Moneda Asociada</p>
                  <p className="font-medium text-emerald-400 mt-0.5">
                    {pais.moneda ? `${pais.moneda.nombre} (${pais.moneda.sigla})` : `ID Moneda: ${pais.idMoneda}`}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleConsultCapital(pais.nombre)}
                  className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors"
                  title="Consultar capital"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Ver Capital
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingPais(pais);
                      setFormData({
                        nombre: pais.nombre,
                        codigoAlfa2: pais.codigoAlfa2,
                        codigoAlfa3: pais.codigoAlfa3,
                        idMoneda: pais.idMoneda,
                      });
                      setShowAddModal(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                    title="Modificar"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(pais.id)}
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

      {/* Add / Edit Country Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingPais ? `Modificar País #${editingPais.id}` : 'Agregar Nuevo País'}
            </h3>

            <form onSubmit={handleSavePais} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Nombre del País *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Colombia"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Código Alfa-2 *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    placeholder="Ej: CO"
                    value={formData.codigoAlfa2}
                    onChange={(e) => setFormData({ ...formData, codigoAlfa2: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white uppercase font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Código Alfa-3 *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    placeholder="Ej: COL"
                    value={formData.codigoAlfa3}
                    onChange={(e) => setFormData({ ...formData, codigoAlfa3: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white uppercase font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  ID Moneda *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="ID de la Moneda asociada (ej: 35 para COP)"
                  value={formData.idMoneda}
                  onChange={(e) => setFormData({ ...formData, idMoneda: parseInt(e.target.value, 10) || 1 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>

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
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-colors"
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
