/**
 * One-time OAuth setup script to obtain a Google refresh token.
 *
 * Prerequisites:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project (or select existing)
 * 3. Enable the Google Calendar API:
 *    - APIs & Services > Library > Search "Calendar" > Enable
 * 4. Create OAuth 2.0 credentials:
 *    - APIs & Services > Credentials > Create Credentials > OAuth client ID
 *    - Application type: Web application
 *    - Add authorized redirect URI: http://localhost:3333/callback
 *    - Download or copy the Client ID and Client Secret
 * 5. Configure OAuth consent screen:
 *    - APIs & Services > OAuth consent screen
 *    - Add your email as a test user if in "Testing" mode
 * 6. Create a .env.local file with:
 *    GOOGLE_CLIENT_ID=your-client-id
 *    GOOGLE_CLIENT_SECRET=your-client-secret
 *
 * Run this script:
 *   bun run scripts/get-refresh-token.ts
 *
 * It will open a browser for you to authorize, then print the refresh token.
 * Copy the GOOGLE_REFRESH_TOKEN line to your .env.local file.
 */

import { google } from "googleapis";
import http from "http";
import open from "open";
import { config as dotenvConfig } from "dotenv";

// Load environment variables
dotenvConfig({ path: ".env.local" });

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const REDIRECT_PORT = 3333;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("\n❌ Error: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    console.error("\nPlease create a .env.local file with:");
    console.error("  GOOGLE_CLIENT_ID=your-client-id");
    console.error("  GOOGLE_CLIENT_SECRET=your-client-secret");
    console.error("\nSee the instructions at the top of this file.");
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // Force consent to always get a refresh token
  });

  console.log("\n🔐 Google Calendar OAuth Setup\n");
  console.log("Opening browser for authorization...\n");

  // Create a temporary HTTP server to receive the OAuth callback
  const server = http.createServer(async (req, res) => {
    if (!req.url?.startsWith("/callback")) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      res.writeHead(400, { "Content-Type": "text/html" });
      res.end(`
        <h1>Authorization Failed</h1>
        <p>Error: ${error}</p>
        <p>Please try again.</p>
      `);
      server.close();
      process.exit(1);
    }

    if (!code) {
      res.writeHead(400, { "Content-Type": "text/html" });
      res.end(`
        <h1>Authorization Failed</h1>
        <p>No authorization code received.</p>
      `);
      return;
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);

      if (!tokens.refresh_token) {
        console.error("\n❌ No refresh token received!");
        console.error("This usually means you've already authorized this app.");
        console.error("\nTo get a new refresh token:");
        console.error("1. Go to https://myaccount.google.com/permissions");
        console.error("2. Remove access for this app");
        console.error("3. Run this script again\n");
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(`
          <h1>No Refresh Token</h1>
          <p>Please revoke access and try again. See console for instructions.</p>
        `);
        server.close();
        process.exit(1);
      }

      console.log("\n✅ Success! Add this to your .env.local file:\n");
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authorization Successful</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            h1 { color: #10b981; }
            code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
            pre { background: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <h1>Authorization Successful!</h1>
          <p>Your refresh token has been printed to the console.</p>
          <p>Copy the <code>GOOGLE_REFRESH_TOKEN</code> line to your <code>.env.local</code> file.</p>
          <p>You can close this window.</p>
        </body>
        </html>
      `);
    } catch (err) {
      console.error("\n❌ Failed to exchange code for tokens:", err);
      res.writeHead(500, { "Content-Type": "text/html" });
      res.end(`
        <h1>Error</h1>
        <p>Failed to exchange authorization code for tokens.</p>
        <p>Check the console for details.</p>
      `);
    }

    server.close();
  });

  server.listen(REDIRECT_PORT, () => {
    console.log(`Listening on port ${REDIRECT_PORT}...`);
    open(authUrl);
  });

  // Handle server errors
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌ Port ${REDIRECT_PORT} is already in use.`);
      console.error("Please close any other process using this port and try again.\n");
    } else {
      console.error("\n❌ Server error:", err);
    }
    process.exit(1);
  });
}

main();
