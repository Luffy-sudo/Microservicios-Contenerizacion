import { Router, Request, Response } from 'express';
import { store } from '../store';
import { generarToken } from '../auth';

export const usuariosRouter = Router();

// GET /api/usuarios/login/:nombreUsuario/:clave
usuariosRouter.get('/login/:nombreUsuario/:clave', async (req: Request, res: Response) => {
  const { nombreUsuario, clave } = req.params;
  const usuario = await store.validarUsuario(nombreUsuario, clave);

  if (!usuario) {
    return res.status(401).json({
      usuario: null,
      token: '',
      error: 'Credenciales inválidas',
    });
  }

  const token = generarToken(usuario.usuario);
  res.json({
    usuario,
    token,
  });
});

// POST /api/usuarios/login
usuariosRouter.post('/login', async (req: Request, res: Response) => {
  const { usuario: nombreUsuario, clave } = req.body;
  const usuario = await store.validarUsuario(nombreUsuario, clave);

  if (!usuario) {
    return res.status(401).json({
      usuario: null,
      token: '',
      error: 'Credenciales inválidas',
    });
  }

  const token = generarToken(usuario.usuario);
  res.json({
    usuario,
    token,
  });
});

// GET /api/usuarios/listar
usuariosRouter.get('/listar', async (_req: Request, res: Response) => {
  const lista = await store.listarUsuarios();
  res.json(lista);
});

// GET /api/usuarios/obtener/:id
usuariosRouter.get('/obtener/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  const usuario = await store.obtenerUsuario(id);
  if (!usuario) {
    return res.status(404).json(null);
  }
  res.json(usuario);
});

// GET /api/usuarios/buscar/:nombre
usuariosRouter.get('/buscar/:nombre', async (req: Request, res: Response) => {
  const nombre = req.params.nombre;
  const lista = await store.buscarUsuarios(nombre);
  res.json(lista);
});

// POST /api/usuarios/agregar
usuariosRouter.post('/agregar', async (req: Request, res: Response) => {
  const nuevo = await store.agregarUsuario(req.body);
  res.status(200).json(nuevo);
});

// PUT /api/usuarios/modificar
usuariosRouter.put('/modificar', async (req: Request, res: Response) => {
  const modificado = await store.modificarUsuario(req.body);
  if (!modificado) {
    return res.status(404).json(null);
  }
  res.json(modificado);
});

// DELETE /api/usuarios/eliminar/:id
usuariosRouter.delete('/eliminar/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json(false);
  }
  const eliminado = await store.eliminarUsuario(id);
  res.json(eliminado);
});
