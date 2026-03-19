import { google } from 'googleapis';
import { config } from '../config.js';
import { getGoogleAuth } from './client.js';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

export async function createDutyEvent({ summary, description, start, end }) {
  const auth = await getGoogleAuth(SCOPES);
  if (!auth) return { skipped: true, reason: 'Google auth not configured' };

  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.events.insert({
    calendarId: config.google.calendarId,
    requestBody: {
      summary,
      description,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 * 24 },
          { method: 'popup', minutes: 60 }
        ]
      }
    }
  });
  return { skipped: false, eventId: res.data.id || null, htmlLink: res.data.htmlLink || null };
}

