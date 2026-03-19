import { z } from 'zod';

export const RegisterSchema = z.object({
  login: z.string().min(3).max(64),
  password: z.string().min(4).max(128),
  displayName: z.string().min(1).max(128).optional()
});

export const LoginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1)
});

export const ApproveUserSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['employee'])
});

export const ZoneCreateSchema = z.object({
  name: z.string().min(1).max(128),
  polygon: z.any()
});

export const DutyCreateSchema = z.object({
  employeeId: z.string().min(1),
  zoneId: z.string().min(1),
  date: z.string().min(1),
  interval: z.enum(['I0800_1200', 'I1200_1600', 'I1600_2000'])
});

export const PlantRecordCreateSchema = z.object({
  dutyId: z.string().min(1),
  species: z.string().min(1).max(256),
  type: z.enum(['GRASS', 'SHRUB', 'TREE']),
  endangered: z.boolean(),
  detectionTime: z.string().min(1),
  gpsLat: z.number().min(-90).max(90),
  gpsLng: z.number().min(-180).max(180)
});

export const ReportSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  exportToGoogleDoc: z.boolean().optional()
});

