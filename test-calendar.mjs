/**
 * Live test: creates a real event on the signed-in user's Google Calendar,
 * confirms the ID comes back, then deletes it.
 * Run after signing in at least once so the user row + tokens exist in the DB.
 *
 *   node --experimental-vm-modules test-calendar.mjs
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import { google } from "googleapis";

const ALGORITHM = "aes-256-gcm";

function keyBuffer() {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  return Buffer.from(hex, "hex");
}
function decrypt(ciphertext) {
  const [ivHex, tagHex, dataHex] = ciphertext.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const data = Buffer.from(dataHex, "hex");
  const d = createDecipheriv(ALGORITHM, keyBuffer(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString("utf8");
}
function encrypt(plaintext) {
  const iv = randomBytes(12);
  const c = createCipheriv(ALGORITHM, keyBuffer(), iv);
  const enc = Buffer.concat([c.update(plaintext, "utf8"), c.final()]);
  return [iv.toString("hex"), c.getAuthTag().toString("hex"), enc.toString("hex")].join(":");
}

const db = new PrismaClient();

async function main() {
  const user = await db.user.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!user) {
    console.error("No user found — sign in at http://localhost:3000 first.");
    process.exit(1);
  }

  console.log(`Testing with user: ${user.email} (slug: ${user.slug})`);

  if (!user.googleRefreshToken) {
    console.error("No refresh token stored. Re-sign in to grant Calendar scope.");
    process.exit(1);
  }

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  const refreshToken = decrypt(user.googleRefreshToken);
  oauth2.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await oauth2.refreshAccessToken();
  console.log("Token refreshed — expires:", new Date(credentials.expiry_date));

  // Persist refreshed tokens
  await db.user.update({
    where: { id: user.id },
    data: {
      googleAccessToken:  credentials.access_token  ? encrypt(credentials.access_token)  : undefined,
      googleRefreshToken: credentials.refresh_token  ? encrypt(credentials.refresh_token) : undefined,
      googleTokenExpiry:  credentials.expiry_date    ? new Date(credentials.expiry_date)  : undefined,
    },
  });
  oauth2.setCredentials(credentials);

  const calendar = google.calendar({ version: "v3", auth: oauth2 });

  // Create a test birthday event (recurring yearly)
  console.log("\nCreating test event on Google Calendar…");
  const { data: created } = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: "Dottd Test Birthday 🎂",
      description: "Auto-created by test-calendar.mjs — safe to delete.",
      start: { date: `${new Date().getFullYear()}-06-24` },
      end:   { date: `${new Date().getFullYear()}-06-25` },
      recurrence: ["RRULE:FREQ=YEARLY"],
    },
  });

  console.log("Created event ID:", created.id);
  console.log("Event link:      ", created.htmlLink);

  // Delete it
  console.log("\nDeleting test event…");
  await calendar.events.delete({ calendarId: "primary", eventId: created.id });
  console.log("Deleted. Test PASSED ✓");
}

main()
  .catch((e) => { console.error("FAILED:", e.message); process.exit(1); })
  .finally(() => db.$disconnect());
