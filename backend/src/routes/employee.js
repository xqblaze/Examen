import express from 'express';
import { prisma } from '../prisma.js';
import { roleRequired } from '../auth/middleware.js';
import { PlantRecordCreateSchema } from '../validators.js';
import { normalizeDateOnly } from '../utils/time.js';

export const employeeRouter = express.Router();

employeeRouter.use(roleRequired('employee'));

employeeRouter.get('/duties', async (req, res) => {
  const duties = await prisma.duty.findMany({
    where: { employeeId: req.auth.sub },
    orderBy: [{ date: 'desc' }, { interval: 'asc' }],
    include: { zone: true, plantRecords: true }
  });
  res.json({ duties });
});

employeeRouter.post('/plant-records', async (req, res) => {
  const parsed = PlantRecordCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  const { dutyId, species, type, endangered, detectionTime, gpsLat, gpsLng } = parsed.data;

  const duty = await prisma.duty.findUnique({ where: { id: dutyId } });
  if (!duty || duty.employeeId !== req.auth.sub) return res.status(404).json({ error: 'Duty not found' });

  const dt = new Date(detectionTime);
  if (Number.isNaN(dt.getTime())) return res.status(400).json({ error: 'Invalid detection time' });

  const record = await prisma.plantRecord.create({
    data: {
      dutyId,
      createdById: req.auth.sub,
      species,
      type,
      endangered,
      detectionTime: dt,
      gpsLat,
      gpsLng
    }
  });
  res.json({ record });
});

employeeRouter.get('/zones', async (req, res) => {
  const zones = await prisma.zone.findMany({ orderBy: { name: 'asc' } });
  res.json({ zones });
});

employeeRouter.get('/calendar', async (req, res) => {
  const start = req.query.start ? normalizeDateOnly(req.query.start) : null;
  const end = req.query.end ? normalizeDateOnly(req.query.end) : null;
  const where = { employeeId: req.auth.sub };
  if (start && end) {
    const endInclusive = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    where.date = { gte: start, lt: endInclusive };
  }
  const duties = await prisma.duty.findMany({ where, orderBy: [{ date: 'asc' }, { interval: 'asc' }], include: { zone: true } });
  res.json({ duties });
});

