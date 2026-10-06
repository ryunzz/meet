/**
 * Get a Google refresh token. Run once for the main account (bookings are created
 * there), and once more for each extra account whose calendar should block times.
 *
 *   1. In Google Cloud Console, enable the Google Calendar API.
 *   2. Create an OAuth client ID (type "Web application") with the redirect URI
 *      http://localhost:3333/callback
 *   3. Put GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local
 *   4. bun run auth:google
 *
 * Bun loads .env.local automatically.
 */

const PORT = 3333;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPE = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local first.");
  process.exit(1);
}

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    access_type: "offline",
    prompt: "consent select_account", // always issue a refresh token; let you pick the account
    scope: SCOPE,
  });

const page = (title: string, body: string) =>
  new Response(
    `<!doctype html><title>${title}</title><body style="font:16px system-ui;max-width:560px;margin:64px auto"><h1>${title}</h1><p>${body}</p>`,
    { headers: { "Content-Type": "text/html" } }
  );

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname !== "/callback") return new Response("Not found", { status: 404 });

    const code = url.searchParams.get("code");
    if (!code) {
      setTimeout(() => process.exit(1), 100);
      return page("Authorization failed", url.searchParams.get("error") ?? "No code received.");
    }

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await res.json();

    setTimeout(() => server.stop().then(() => process.exit(tokens.refresh_token ? 0 : 1)), 100);

    if (!tokens.refresh_token) {
      console.error("No refresh token returned:", tokens);
      console.error("Revoke the app at https://myaccount.google.com/permissions and run this again.");
      return page("No refresh token", "See the terminal for details.");
    }

    const extra = Boolean(process.env.GOOGLE_REFRESH_TOKEN);
    console.log(
      extra
        ? "\nGOOGLE_REFRESH_TOKEN is already set, so this is probably an extra account. Append this to\nGOOGLE_EXTRA_REFRESH_TOKENS (comma-separated) in .env.local and on Vercel:\n"
        : "\nAdd this to .env.local and to your Vercel project's environment variables:\n"
    );
    console.log(`${extra ? "GOOGLE_EXTRA_REFRESH_TOKENS" : "GOOGLE_REFRESH_TOKEN"}=${tokens.refresh_token}\n`);
    return page("Done", "Your refresh token is in the terminal. You can close this tab.");
  },
});

console.log(`Open this URL to authorize:\n\n${authUrl}\n`);
if (process.platform === "darwin") Bun.spawn(["open", authUrl]);
