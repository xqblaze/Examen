import 'dotenv/config';

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.BACKEND_PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/auth/google/callback',
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    sheetsId: process.env.GOOGLE_SHEETS_ID || '',
    sheetsRange: process.env.GOOGLE_SHEETS_RANGE || 'Sheet1!A:Z',
    docsTemplateId: process.env.GOOGLE_DOCS_TEMPLATE_ID || '',
    driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
    serviceAccountKeyPath: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || ''
  }
};

