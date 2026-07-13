/**
 * Google OAuth2 client factory.
 *
 * Token storage: AES-256-GCM encrypted in `oauth_tokens` table.
 * Refresh: automatic — client.on("tokens") persists new tokens.
 */

import { google, Auth } from "googleapis";
import { PrismaClient } from "@prisma/client";
import { decrypt, encrypt } from "./crypto";
import { logger } from "./logger";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
];

export function buildOAuth2Client(): Auth.OAuth2Client {
  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri  = process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3001/api/v1/auth/google/callback";

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set for Google Sheets sync");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(state?: string): string {
  const client = buildOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state,
  });
}

/**
 * Load an authenticated OAuth2 client for the given user.
 * Refreshes tokens automatically when expired.
 */
export async function getAuthenticatedClient(
  userId: string,
  prisma: PrismaClient,
): Promise<Auth.OAuth2Client> {
  const record = await prisma.oAuthToken.findUnique({
    where: { userId_provider: { userId, provider: "google" } },
  });

  if (!record) {
    throw new Error(`No Google OAuth token for user ${userId}. Connect Google Sheets first.`);
  }

  const client = buildOAuth2Client();

  client.setCredentials({
    access_token:  decrypt(record.accessTokenEnc),
    refresh_token: record.refreshTokenEnc ? decrypt(record.refreshTokenEnc) : undefined,
    expiry_date:   record.expiresAt?.getTime(),
  });

  // Persist refreshed tokens
  client.on("tokens", async (tokens) => {
    try {
      await prisma.oAuthToken.update({
        where: { userId_provider: { userId, provider: "google" } },
        data: {
          accessTokenEnc:  encrypt(tokens.access_token!),
          refreshTokenEnc: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
          expiresAt:       tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        },
      });
      logger.debug("google_auth: tokens refreshed", { userId });
    } catch (err) {
      logger.error("google_auth: failed to persist refreshed tokens", { userId, err });
    }
  });

  return client;
}

/**
 * Exchange an authorization code (from OAuth callback) for tokens and store them.
 */
export async function exchangeCodeAndStore(
  code: string,
  userId: string,
  prisma: PrismaClient,
): Promise<void> {
  const client = buildOAuth2Client();
  const { tokens } = await client.getToken(code);

  if (!tokens.access_token) {
    throw new Error("OAuth exchange returned no access_token");
  }

  await prisma.oAuthToken.upsert({
    where: { userId_provider: { userId, provider: "google" } },
    create: {
      userId,
      provider: "google",
      scope:    SCOPES.join(" "),
      accessTokenEnc:  encrypt(tokens.access_token),
      refreshTokenEnc: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
      expiresAt:       tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
    },
    update: {
      accessTokenEnc:  encrypt(tokens.access_token),
      refreshTokenEnc: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
      expiresAt:       tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
    },
  });

  logger.info("google_auth: tokens stored", { userId });
}

export async function revokeAndDeleteToken(userId: string, prisma: PrismaClient): Promise<void> {
  const record = await prisma.oAuthToken.findUnique({
    where: { userId_provider: { userId, provider: "google" } },
  });

  if (record) {
    try {
      const client = buildOAuth2Client();
      client.setCredentials({ access_token: decrypt(record.accessTokenEnc) });
      await client.revokeCredentials();
    } catch {
      // Best-effort revoke — still delete the local record
    }
    await prisma.oAuthToken.delete({
      where: { userId_provider: { userId, provider: "google" } },
    });
  }

  logger.info("google_auth: token revoked", { userId });
}
