import express from 'express';
import { prisma } from '../prisma.js';
import { roleRequired } from '../auth/middleware.js';
import { ApproveUserSchema, DutyCreateSchema, ZoneCreateSchema, ReportSchema } from '../validators.js';
import { normalizeDateOnly, intervalToDateTimesUtc, DUTY_INTERVALS } from '../utils/time.js';
import { createDutyEvent } from '../google/calendar.js';
import { generateGoogleDocReport } from '../google/docs.js';

export const managerRouter = express.Router();

managerRouter.use(roleRequired('manager'));

managerRouter.get('/users/pending', async (req, res) => {
  const users = await prisma.user.findMany({
    where: { roleId: null, approvedAt: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true, login: true, displayName: true, createdAt: true, googleId: true }
  });
  res.json({ users });
});

managerRouter.post('/users/approve', async (req, res) => {
  const parsed = ApproveUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const { userId, role } = parsed.data;

  const roleRow = await prisma.role.findUnique({ where: { name: role } });
  if (!roleRow) return res.status(500).json({ error: 'Role missing in DB' });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { roleId: roleRow.id, approvedAt: new Date() },
    select: { id: true, login: true, displayName: true, approvedAt: true }
  });
  res.json({ user });
});

managerRouter.get('/employees', async (req, res) => {
  const employeeRole = await prisma.role.findUnique({ where: { name: 'employee' } });
  const users = await prisma.user.findMany({
    where: { roleId: employeeRole?.id || '__none__' },
    orderBy: { login: 'asc' },
    select: { id: true, login: true, displayName: true, approvedAt: true }
  });
  res.json({ users });
});

managerRouter.get('/zones', async (req, res) => {
  const zones = await prisma.zone.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ zones });
});

managerRouter.post('/zones', async (req, res) => {
  const parsed = ZoneCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const { name, polygon } = parsed.data;
  const zone = await prisma.zone.create({ data: { name, polygon } });
  res.json({ zone });
});

managerRouter.delete('/zones/:id', async (req, res) => {
  await prisma.zone.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

managerRouter.get('/duties', async (req, res) => {
  const duties = await prisma.duty.findMany({
    orderBy: [{ date: 'desc' }, { interval: 'asc' }],
    include: { employee: { include: { role: true } }, zone: true }
  });
  res.json({ duties });
});

managerRouter.post('/duties', async (req, res) => {
  const parsed = DutyCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  const { employeeId, zoneId, date, interval } = parsed.data;
  const dateOnly = normalizeDateOnly(date);
  if (!dateOnly) return res.status(400).json({ error: 'Invalid date' });

  const duty = await prisma.duty.create({
    data: {
      employeeId,
      zoneId,
      date: dateOnly,
      interval
    },
    include: { employee: true, zone: true }
  });

  const dt = intervalToDateTimesUtc(dateOnly, interval);
  const cal = dt
    ? await createDutyEvent({
        summary: `Duty: ${dt.label}`,
        description: `Zone: ${duty.zone.name}\nEmployee: ${duty.employee.login}`,
        start: dt.start,
        end: dt.end
      })
    : { skipped: true, reason: 'Invalid interval' };

  const updated = cal.skipped
    ? duty
    : await prisma.duty.update({ where: { id: duty.id }, data: { googleEventId: cal.eventId || null }, include: { employee: true, zone: true } });

  res.json({ duty: updated, calendar: cal });
});

managerRouter.delete('/duties/:id', async (req, res) => {
  await prisma.duty.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

function emptyCounts() {
  return {
    grass: { total: 0, endangered: 0 },
    shrub: { total: 0, endangered: 0 },
    tree: { total: 0, endangered: 0 },
    total: 0,
    endangered: 0
  };
}

function addCounts(acc, record) {
  const t = record.type;
  const endangered = record.endangered ? 1 : 0;
  if (t === 'GRASS') {
    acc.grass.total += 1;
    acc.grass.endangered += endangered;
  } else if (t === 'SHRUB') {
    acc.shrub.total += 1;
    acc.shrub.endangered += endangered;
  } else if (t === 'TREE') {
    acc.tree.total += 1;
    acc.tree.endangered += endangered;
  }
  acc.total += 1;
  acc.endangered += endangered;
}

function formatDateUtc(d) {
  return d.toISOString().slice(0, 10);
}

managerRouter.post('/reports', async (req, res) => {
  const parsed = ReportSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  const { startDate, endDate, exportToGoogleDoc } = parsed.data;
  const start = normalizeDateOnly(startDate);
  const end = normalizeDateOnly(endDate);
  if (!start || !end) return res.status(400).json({ error: 'Invalid date range' });

  const endInclusive = new Date(end.getTime() + 24 * 60 * 60 * 1000);

  const duties = await prisma.duty.findMany({
    where: { date: { gte: start, lt: endInclusive } },
    select: { id: true, date: true, interval: true }
  });

  const dutyIds = duties.map((d) => d.id);
  const plantRecords = dutyIds.length
    ? await prisma.plantRecord.findMany({
        where: { dutyId: { in: dutyIds } },
        select: { dutyId: true, type: true, endangered: true }
      })
    : [];

  const dutyKey = new Map(duties.map((d) => [d.id, `${formatDateUtc(d.date)}|${d.interval}`]));
  const agg = new Map();

  for (const d of duties) {
    const key = `${formatDateUtc(d.date)}|${d.interval}`;
    if (!agg.has(key)) agg.set(key, emptyCounts());
  }

  for (const r of plantRecords) {
    const key = dutyKey.get(r.dutyId);
    if (!key) continue;
    if (!agg.has(key)) agg.set(key, emptyCounts());
    addCounts(agg.get(key), r);
  }

  const rows = [];
  const intervals = Object.keys(DUTY_INTERVALS);
  for (let t = start.getTime(); t < endInclusive.getTime(); t += 24 * 60 * 60 * 1000) {
    const dateUtc = new Date(t);
    const dateStr = formatDateUtc(dateUtc);
    for (const interval of intervals) {
      const key = `${dateStr}|${interval}`;
      const c = agg.get(key) || emptyCounts();
      rows.push({
        date: dateStr,
        interval,
        intervalLabel: DUTY_INTERVALS[interval].label,
        ...c
      });
    }
  }

  let doc = null;
  if (exportToGoogleDoc) {
    doc = await generateGoogleDocReport({
      title: `Duty report ${formatDateUtc(start)}..${formatDateUtc(end)}`,
      rows
    });
  }

  res.json({ rows, googleDoc: doc });
});

