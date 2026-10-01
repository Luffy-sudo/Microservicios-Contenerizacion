import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, DollarSign, Calculator } from 'lucide-react';

interface Moneda {
  id: number;
  nombre: string;
  sigla: string;
  simbolo?: string | null;
}

export const CurrencyConverter: React.FC = () => {
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [amount, setAmount] = useState<number>(100);
  const [fromId, setFromId] = useState<number>(149); // USD is 149
  const [toId, setToId] = useState<number>(35); // COP is 35
  const [result, setResult] = useState<number | null>(null);
  const [rate, setRate] = useState<number>(2000.56); // default COP approx

  useEffect(() => {
    fetch('/api/monedas/listar')
      .then((res) => res.json())
      .then((data) => {
        setMonedas(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
        setMonedas([]);
      });
  }, []);

  // Fetch rates for from and to
  useEffect(() => {
    // If either is COP (35) or ARS (7) or USD (149)
    const calculate = async () => {
      let r = 1;
      if (fromId === toId) {
        setRate(1);
        setResult(amount);
        return;
      }

      // Check if fromId or toId has historical data
      try {
        const resFrom = await fetch(`/api/monedas/listarporperiodo?idMoneda=${fromId}&desde=2018-01-01&hasta=2018-02-15`);
        const dataFrom = await resFrom.json().catch(() => []);
        const valFrom = Array.isArray(dataFrom) && dataFrom.length ? dataFrom[dataFrom.length - 1].valor : 1;

        const resTo = await fetch(`/api/monedas/listarporperiodo?idMoneda=${toId}&desde=2018-01-01&hasta=2018-02-15`);
        const dataTo = await resTo.json().catch(() => []);
        const valTo = Array.isArray(dataTo) && dataTo.length ? dataTo[dataTo.length - 1].valor : 1;

        if (fromId === 149) {
          // from USD to target
          r = valTo;
        } else if (toId === 149) {
          // to USD
          r = valFrom > 0 ? 1 / valFrom : 1;
        } else {
          r = valTo / (valFrom || 1);
        }

        setRate(r);
        setResult(amount * r);
      } catch {
        setRate(1);
        setResult(amount);
      }
    };

    calculate();
  }, [fromId, toId, amount]);

  const handleSwap = () => {
    setFromId(toId);
    setToId(fromId);
  };

  const fromCurrency = monedas.find((m) => m.id === fromId);
  const toCurrency = monedas.find((m) => m.id === toId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Conversor de Divisas</h2>
            <p className="text-xs text-slate-400">
              Cálculo en base a las tasas de cambio de la API
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Amount input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Monto a Convertir
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                type="number"
                min={0}
                step="any"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          {/* Currencies grid */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                De (Moneda Origen)
              </label>
              <select
                value={fromId}
                onChange={(e) => setFromId(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                {monedas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.sigla} - {m.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1 flex justify-center pt-5">
              <button
                type="button"
                onClick={handleSwap}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors border border-slate-700"
                title="Invertir divisas"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                A (Moneda Destino)
              </label>
              <select
                value={toId}
                onChange={(e) => setToId(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                {monedas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.sigla} - {m.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Result Card */}
          <div className="mt-6 bg-slate-950 border border-slate-800/90 rounded-2xl p-5 text-center">
            <p className="text-xs text-slate-400 mb-1">Resultado de la Conversión</p>
            <div className="text-3xl font-extrabold text-amber-400 font-mono tracking-tight">
              {result !== null ? result.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '...'} {toCurrency?.sigla}
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              1 {fromCurrency?.sigla} ≈ {rate.toFixed(4)} {toCurrency?.sigla}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
