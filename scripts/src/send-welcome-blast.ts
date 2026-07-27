import { db, pool, waitlistTable } from "@workspace/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Mapping With Melanin™ <hello@mappingwithmelanin.com>";

async function markSent(id: string) {
  await pool.query("UPDATE waitlist_signups SET welcome_email_sent = true WHERE id = $1", [id]);
}

async function sendWelcome(to: string, firstName: string, position: number, referralCode: string) {
  const referralLink = `https://mappingwithmelanin.com/?ref=${referralCode}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to the Mapping with Melanin™ Waitlist 🗺️✊🏾",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping with Melanin" style="height:40px;margin-bottom:32px" />
        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 16px">Hello ${firstName},</p>
        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 16px">Welcome to the Mapping with Melanin™ waitlist!</p>
        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          We're excited to have you join a growing community of travelers, explorers, professionals, entrepreneurs, and changemakers who believe that finding connection, opportunity, and belonging should be easier wherever life takes you.
        </p>
        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          Mapping with Melanin™ is more than an app. We're building a community-powered platform designed to help people discover businesses, neighborhoods, employers, events, and communities through real experiences and shared insights.
        </p>
        <p style="color:#2B1507;font-size:16px;font-weight:700;margin:0 0 8px">As a waitlist member, you'll be among the first to:</p>
        <ul style="color:#3A1F0E;font-size:16px;line-height:1.8;margin:0 0 16px;padding-left:20px">
          <li>Receive early access to the platform</li>
          <li>Help shape future features and functionality</li>
          <li>Participate in testing opportunities</li>
          <li>Share feedback that directly influences development</li>
          <li>Join a community committed to connection, discovery, and empowerment</li>
        </ul>
        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          What makes Mapping with Melanin™ different is that the platform is powered by its community. Every review, recommendation, safety insight, business listing, event submission, and neighborhood experience helps create a richer, more valuable resource for everyone.
        </p>
        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          Your voice matters, and we're grateful you've chosen to be part of this journey from the beginning.
        </p>
        <p style="color:#2B1507;font-size:16px;font-weight:700;margin:0 0 24px">Waitlist Position: <span style="color:#CA922B">#${position}</span></p>
        <div style="background:#2B1507;border-radius:12px;padding:24px;margin-bottom:24px">
          <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 12px;text-align:center;letter-spacing:1px">── Move Up the Waitlist ──</p>
          <p style="color:#F5EBD8;font-size:15px;line-height:1.6;margin:0 0 16px;text-align:center">
            Invite friends and move up the waitlist. Every person who joins using your link moves you closer to early access.
          </p>
          <p style="color:#F5EBD8;font-size:14px;margin:0 0 6px">Your personal link:</p>
          <a href="${referralLink}" style="color:#CA922B;font-size:14px;word-break:break-all;display:block;margin-bottom:12px">${referralLink}</a>
          <p style="color:#F5EBD8;font-size:14px;margin:0 0 6px">Your referral code:</p>
          <p style="color:#CA922B;font-size:20px;font-weight:700;margin:0;letter-spacing:4px">${referralCode}</p>
        </div>
        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          We'll keep you updated as we move closer to launch and will reach out with opportunities for early access, testing, and exclusive announcements.
        </p>
        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">Thank you for joining us as we build something special.</p>
        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping with Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:14px;opacity:0.6;margin:0">Melanin Maps LLC</p>
      </div>
    `,
  });
}

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY is not set — aborting");
    process.exit(1);
  }

  const all = await db.select().from(waitlistTable);
  const unsent = all.filter(e => !e.welcomeEmailSent);

  console.log(`📋 Total waitlist: ${all.length}`);
  console.log(`📬 Unsent welcome emails: ${unsent.length}`);
  console.log(`✅ Already sent: ${all.length - unsent.length}`);

  if (unsent.length === 0) {
    console.log("🎉 Everyone has already received their welcome email!");
    return;
  }

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < unsent.length; i++) {
    const entry = unsent[i];
    if (!entry.email || !entry.referralCode) {
      console.log(`  ⚠️  Skipping ${entry.email ?? "(no email)"} — missing referral code`);
      failed++;
      continue;
    }

    try {
      await sendWelcome(entry.email, entry.firstName ?? "there", i + 1, entry.referralCode);
      await markSent(entry.id);
      sent++;
      console.log(`  ✉️  [${sent}/${unsent.length}] Sent → ${entry.email}`);
      // Stay under Resend's 2 req/sec limit
      if (i % 2 === 1) await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      failed++;
      console.error(`  ❌ Failed for ${entry.email}:`, (err as Error).message);
    }
  }

  console.log(`\n🏁 Done. Sent: ${sent}  Failed: ${failed}`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
