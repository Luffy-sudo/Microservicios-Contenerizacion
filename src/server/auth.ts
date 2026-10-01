import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const JWT_SECRET = process.env.JWT_SECRET || '5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437';

export function generarToken(nombreUsuario: string): string {
  return jwt.sign({ sub: nombreUsuario }, JWT_SECRET, {
    expiresIn: '30m',
    algorithm: 'HS256',
  });
}

export function validarToken(token: string): { sub: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    return decoded;
  } catch {
    return null;
  }
}

export function filtroSeguridad(req: Request, res: Response, next: NextFunction) {
  // Public or non-api routes
  if (
    !req.path.startsWith('/api/') ||
    req.path.startsWith('/api/usuarios/login') ||
    req.path.startsWith('/api/swagger.json') ||
    req.path.startsWith('/swagger') ||
    req.path.startsWith('/docs') ||
    req.path.startsWith('/api-docs') ||
    req.path.startsWith('/v3/api-docs')
  ) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = validarToken(token);
    if (decoded) {
      (req as any).user = decoded;
      return next();
    } else {
      return res.status(403).json({ error: 'Token JWT inválido o expirado' });
    }
  }

  // Allow bypass header or query param for exploration
  if (req.headers['x-bypass-auth'] === 'true' || req.query['auth'] === 'bypass') {
    (req as any).user = { sub: 'fray' };
    return next();
  }

  // Allow read operations (GET) by default for dashboard visualization
  if (req.method === 'GET') {
    return next();
  }

  // Require authentication for state-modifying requests (POST, PUT, DELETE)
  return res.status(403).json({
    error: 'Acceso Denegado: Se requiere autenticación Bearer JWT para modificar datos.',
    ayuda: 'Inicie sesión en /api/usuarios/login/fray/123 para obtener su token.',
  });
}
