import { google } from 'googleapis';
import { config } from '../config.js';
import { getGoogleAuth } from './client.js';

const SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive.file'
];

function buildRequests(reportTitle, rows) {
  const header = [
    'Date',
    'Interval',
    'Grass (total/endangered)',
    'Shrub (total/endangered)',
    'Tree (total/endangered)',
    'Total',
    'Endangered'
  ];

  const tableRows = [header, ...rows.map((r) => [
    r.date,
    r.intervalLabel,
    `${r.grass.total}/${r.grass.endangered}`,
    `${r.shrub.total}/${r.shrub.endangered}`,
    `${r.tree.total}/${r.tree.endangered}`,
    String(r.total),
    String(r.endangered)
  ])];

  return [
    {
      insertText: {
        location: { index: 1 },
        text: `${reportTitle}\n\n`
      }
    },
    {
      insertTable: {
        rows: tableRows.length,
        columns: header.length,
        location: { index: 1 }
      }
    },
    ...tableRows.flatMap((row, rowIndex) =>
      row.map((cell, colIndex) => ({
        insertText: {
          text: `${cell}`,
          location: { index: 1 } // Docs API appends into first available cell sequentially for insertTable content.
        }
      }))
    )
  ];
}

export async function generateGoogleDocReport({ title, rows }) {
  const auth = await getGoogleAuth(SCOPES);
  if (!auth) return { skipped: true, reason: 'Google auth not configured' };

  const drive = google.drive({ version: 'v3', auth });
  const docs = google.docs({ version: 'v1', auth });

  let docId = null;

  if (config.google.docsTemplateId) {
    const copy = await drive.files.copy({
      fileId: config.google.docsTemplateId,
      requestBody: {
        name: title,
        parents: config.google.driveFolderId ? [config.google.driveFolderId] : undefined
      }
    });
    docId = copy.data.id;
  } else {
    const created = await docs.documents.create({ requestBody: { title } });
    docId = created.data.documentId;
  }

  if (!docId) return { skipped: true, reason: 'Failed to create document' };

  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: { requests: buildRequests(title, rows) }
  });

  const file = await drive.files.get({ fileId: docId, fields: 'webViewLink' });
  return { skipped: false, docId, link: file.data.webViewLink || null };
}

