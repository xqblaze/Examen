import express from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../prisma.js';
import { config } from '../config.js';
import { signAccessToken } from '../auth/jwt.js';
import { RegisterSchema, LoginSchema } from '../validators.js';

export const authRouter = express.Router();

function toTokenUser(user) {
  return signAccessToken({
    sub: user.id,
    login: user.login,
    role: user.role?.name || null,
    approvedAt: user.approvedAt ? user.approvedAt.toISOString() : null
  });
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id }, include: { role: true } });
    done(null, user || null);
  } catch (e) {
    done(e);
  }
});

if (config.google.clientId && config.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: '/api/auth/google/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const displayName = profile.displayName || null;
          const existing = await prisma.user.findUnique({ where: { googleId }, include: { role: true } });
          if (existing) return done(null, existing);

          const loginBase = (profile.emails?.[0]?.value || `google_${googleId}`).toLowerCase();
          const login = loginBase.slice(0, 64);

          const created = await prisma.user.create({
            data: {
              login,
              googleId,
              displayName
            },
            include: { role: true }
          });
          return done(null, created);
        } catch (e) {
          return done(e);
        }
      }
    )
  );
}

authRouter.post('/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });

  const { login, password, displayName } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { login } });
  if (existing) return res.status(409).json({ error: 'Login already exists' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { login, passwordHash, displayName: displayName || null },
    include: { role: true }
  });

  const token = toTokenUser(user);
  return res.json({ token, user: { id: user.id, login: user.login, role: user.role?.name || null, approvedAt: user.approvedAt } });
});

authRouter.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const { login, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { login }, include: { role: true } });
  if (!user?.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = toTokenUser(user);
  return res.json({ token, user: { id: user.id, login: user.login, role: user.role?.name || null, approvedAt: user.approvedAt } });
});

authRouter.get('/me', async (req, res) => {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');
  if (!token) return res.status(200).json({ user: null });
  try {
    // lazy verify by reissuing token from DB (ensures role/approval changes reflected)
    const { default: jwt } = await import('jsonwebtoken');
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, include: { role: true } });
    if (!user) return res.status(200).json({ user: null });
    const newToken = toTokenUser(user);
    return res.json({
      token: newToken,
      user: { id: user.id, login: user.login, role: user.role?.name || null, approvedAt: user.approvedAt }
    });
  } catch {
    return res.status(200).json({ user: null });
  }
});

authRouter.get('/google', (req, res, next) => {
  if (!config.google.clientId || !config.google.clientSecret) return res.status(400).json({ error: 'Google OAuth not configured' });
  return passport.authenticate('google', { scope: ['profile', 'email'], session: true })(req, res, next);
});

authRouter.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${config.frontendUrl}/login?oauth=fail`, session: true }),
  async (req, res) => {
    const user = req.user;
    const token = toTokenUser(user);
    const redirect = new URL(`${config.frontendUrl}/login`);
    redirect.searchParams.set('token', token);
    return res.redirect(redirect.toString());
  }
);

