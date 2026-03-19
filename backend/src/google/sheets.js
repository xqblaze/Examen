import { google } from 'googleapis';
import { config } from '../config.js';
import { getGoogleAuth } from './client.js';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

export async function fetchSheetValues() {
  const auth = await getGoogleAuth(SCOPES);
  if (!auth) return { skipped: true, reason: 'Google auth not configured', values: [] };
  if (!config.google.sheetsId) return { skipped: true, reason: 'GOOGLE_SHEETS_ID not set', values: [] };

  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.google.sheetsId,
    range: config.google.sheetsRange
  });
  return { skipped: false, values: res.data.values || [] };
}

