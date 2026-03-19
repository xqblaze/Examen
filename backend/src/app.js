import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import passport from 'passport';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { authRequired, attachUser } from './auth/middleware.js';
import { managerRouter } from './routes/manager.js';
import { employeeRouter } from './routes/employee.js';
import { integrationsRouter } from './routes/integrations.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: [config.frontendUrl],
      credentials: true
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan('dev'));

  app.use(
    session({
      secret: config.jwtSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { sameSite: 'lax' }
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  app.use('/api/auth', authRouter);

  app.use('/api', authRequired, attachUser);
  app.use('/api/manager', managerRouter);
  app.use('/api/employee', employeeRouter);
  app.use('/api/integrations', integrationsRouter);

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}

