import { Router, Request, Response } from 'express';
import { store } from '../store';

export const monedasRouter = Router();

// GET /api/monedas/listar
monedasRouter.get('/listar', async (_req: Request, res: Response) => {
  const lista = await store.listarMonedas();
  res.json(lista);
});

// GET /api/monedas/obtener/:id
monedasRouter.get('/obtener/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  const moneda = await store.obtenerMoneda(id);
  if (!moneda) {
    return res.status(404).json(null);
  }
  res.json(moneda);
});

// GET /api/monedas/buscar/:nombre
monedasRouter.get('/buscar/:nombre', async (req: Request, res: Response) => {
  const nombre = req.params.nombre;
  const resultados = await store.buscarMonedas(nombre);
  res.json(resultados);
});

// GET /api/monedas/buscarporpais/:nombre
monedasRouter.get('/buscarporpais/:nombre', async (req: Request, res: Response) => {
  const nombre = req.params.nombre;
  const moneda = await store.buscarMonedaPorPais(nombre);
  if (!moneda) {
    return res.status(404).json(null);
  }
  res.json(moneda);
});

// POST /api/monedas/agregar
monedasRouter.post('/agregar', async (req: Request, res: Response) => {
  const nueva = await store.agregarMoneda(req.body);
  res.status(200).json(nueva);
});

// PUT /api/monedas/modificar
monedasRouter.put('/modificar', async (req: Request, res: Response) => {
  const modificado = await store.modificarMoneda(req.body);
  if (!modificado) {
    return res.status(404).json(null);
  }
  res.json(modificado);
});

// DELETE /api/monedas/eliminar/:id
monedasRouter.delete('/eliminar/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json(false);
  }
  const eliminado = await store.eliminarMoneda(id);
  res.json(eliminado);
});

// GET & POST /api/monedas/listarporperiodo
const handleListarPorPeriodo = async (req: Request, res: Response) => {
  const idMoneda = parseInt(
    (req.body?.idMoneda || req.query?.idMoneda || req.query?.id) as string,
    10
  );
  const desde = req.body?.desde || req.body?.Desde || req.query?.desde || req.query?.Desde;
  const hasta = req.body?.hasta || req.body?.Hasta || req.query?.hasta || req.query?.Hasta;

  if (isNaN(idMoneda) || !desde || !hasta) {
    return res.status(400).json({
      error: 'Parámetros requeridos: idMoneda, desde, hasta',
      ejemplo: { idMoneda: 35, desde: '2018-01-01', hasta: '2018-02-15' },
    });
  }

  const cambios = await store.listarPorPeriodo(idMoneda, desde as string, hasta as string);
  res.json(cambios);
};

monedasRouter.get('/listarporperiodo', handleListarPorPeriodo);
monedasRouter.post('/listarporperiodo', handleListarPorPeriodo);
