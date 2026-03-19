import express from 'express';
import { fetchSheetValues } from '../google/sheets.js';
import { roleRequired } from '../auth/middleware.js';

export const integrationsRouter = express.Router();

integrationsRouter.use(roleRequired('manager'));

integrationsRouter.get('/sheets', async (req, res) => {
  const data = await fetchSheetValues();
  res.json(data);
});

