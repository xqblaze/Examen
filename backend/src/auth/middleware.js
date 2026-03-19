import { verifyAccessToken } from './jwt.js';
import { prisma } from '../prisma.js';

export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = verifyAccessToken(token);
    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export function approvedRequired(req, res, next) {
  if (!req.auth?.approvedAt) return res.status(403).json({ error: 'Not approved' });
  return next();
}

export function roleRequired(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.auth?.role)) return res.status(403).json({ error: 'Forbidden' });
    return next();
  };
}

export async function attachUser(req, res, next) {
  if (!req.auth?.sub) return next();
  const user = await prisma.user.findUnique({ where: { id: req.auth.sub }, include: { role: true } });
  req.user = user || null;
  return next();
}

