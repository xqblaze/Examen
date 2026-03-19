import fs from 'node:fs';
import { google } from 'googleapis';
import { config } from '../config.js';

function makeOAuthClient() {
  return new google.auth.OAuth2(config.google.clientId, config.google.clientSecret, config.google.redirectUri);
}

function getServiceAccountAuthIfConfigured(scopes) {
  if (!config.google.serviceAccountKeyPath) return null;
  if (!fs.existsSync(config.google.serviceAccountKeyPath)) return null;
  const key = JSON.parse(fs.readFileSync(config.google.serviceAccountKeyPath, 'utf-8'));
  return new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes
  });
}

export async function getGoogleAuth(scopes) {
  const sa = getServiceAccountAuthIfConfigured(scopes);
  if (sa) {
    await sa.authorize();
    return sa;
  }

  const oauth = makeOAuthClient();
  if (!config.google.refreshToken) return null;
  oauth.setCredentials({ refresh_token: config.google.refreshToken });
  return oauth;
}

export function getOAuthClient() {
  return makeOAuthClient();
}

