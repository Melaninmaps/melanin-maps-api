import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = "Mapping With Melanin™ <hello@melaninmaps.com>";

function log(msg: string) {
  if (!resend) console.warn("[email] RESEND_API_KEY not set — skipping:", msg);
}

export async function sendWaitlistConfirmation(to: string, position: number, referralCode: string) {
  if (!resend) { log("waitlist confirmation"); return; }
  await resend.emails.send({
    from: FROM,
    to,
    subject: `You're #${position} on the Mapping With Melanin™ waitlist 🎉`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://www.melaninmaps.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:32px" />
        <h1 style="font-size:28px;color:#2B1507;margin:0 0 12px">You're on the list!</h1>
        <p style="color:#3A1F0E;opacity:0.7;font-size:16px;line-height:1.6;margin:0 0 24px">
          Welcome to the Mapping With Melanin™ community. You're <strong style="color:#CA922B">#${position}</strong> in line — we'll send you early access as soon as your city launches.
        </p>
        <div style="background:#2B1507;border-radius:12px;padding:20px 24px;margin-bottom:24px">
          <p style="color:#F5EBD8;font-size:13px;margin:0 0 6px;opacity:0.7">YOUR REFERRAL CODE</p>
          <p style="color:#CA922B;font-size:24px;font-weight:700;margin:0;letter-spacing:4px">${referralCode}</p>
          <p style="color:#F5EBD8;font-size:13px;margin:8px 0 0;opacity:0.6">Share it to move up the list</p>
        </div>
        <p style="color:#3A1F0E;opacity:0.5;font-size:13px;margin:0">
          Questions? Reply to this email or reach us at <a href="mailto:hello@melaninmaps.com" style="color:#CA922B">hello@melaninmaps.com</a>
        </p>
      </div>
    `,
  });
}

export async function sendApprovalNotification(to: string, firstName: string | null) {
  if (!resend) { log("approval notification"); return; }
  const name = firstName ?? "there";
  await resend.emails.send({
    from: FROM,
    to,
    subject: "You're approved — Welcome to Mapping With Melanin™ 🗺️",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://www.melaninmaps.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:32px" />
        <h1 style="font-size:28px;color:#2B1507;margin:0 0 12px">You're in, ${name}! 🎉</h1>
        <p style="color:#3A1F0E;opacity:0.7;font-size:16px;line-height:1.6;margin:0 0 28px">
          Your early access to <strong>Mapping With Melanin™</strong> has been approved. Sign in now to start discovering Black-owned businesses, community events, and safety intel in your area.
        </p>
        <a href="https://www.melaninmaps.com/login" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:14px 32px;border-radius:50px;text-decoration:none;margin-bottom:28px">
          Sign In Now →
        </a>
        <p style="color:#3A1F0E;opacity:0.5;font-size:13px;margin:0">
          Questions? Reach us at <a href="mailto:hello@melaninmaps.com" style="color:#CA922B">hello@melaninmaps.com</a>
        </p>
      </div>
    `,
  });
}

export async function sendWaitlistRejection(to: string) {
  if (!resend) { log("rejection notice"); return; }
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Update on your Mapping With Melanin™ application",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://www.melaninmaps.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:32px" />
        <h1 style="font-size:28px;color:#2B1507;margin:0 0 12px">Thank you for your interest</h1>
        <p style="color:#3A1F0E;opacity:0.7;font-size:16px;line-height:1.6;margin:0 0 24px">
          We appreciate you signing up for Mapping With Melanin™. We're currently in a limited early access phase and aren't able to offer you a spot at this time. We'll keep your information and reach out if that changes.
        </p>
        <p style="color:#3A1F0E;opacity:0.5;font-size:13px;margin:0">
          Questions? Reach us at <a href="mailto:hello@melaninmaps.com" style="color:#CA922B">hello@melaninmaps.com</a>
        </p>
      </div>
    `,
  });
}
