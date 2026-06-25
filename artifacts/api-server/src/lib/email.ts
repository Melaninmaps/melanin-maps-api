import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = "Mapping With Melanin™ <hello@send.mappingwithmelanin.com>";

function log(_msg: string) {
  // RESEND_API_KEY not configured — email silently skipped in this environment
}

export async function sendWelcomeEmail(to: string, firstName: string | null) {
  if (!resend) { log("welcome email"); return; }
  const name = firstName ?? "there";
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to Mapping With Melanin™ 🗺️✊🏾",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:32px" />

        <h1 style="font-size:28px;color:#2B1507;font-weight:700;margin:0 0 12px;line-height:1.3">
          Welcome, ${name}. You're in. 🎉
        </h1>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          Your account has been created. You're now part of a growing community of travelers, entrepreneurs, and explorers who believe finding connection, safety, and belonging should be easier — wherever life takes you.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          Here's what you can start doing right now:
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:28px;margin-bottom:28px">
          <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 16px;letter-spacing:1px;text-transform:uppercase">Your platform at a glance</p>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(245,235,216,0.1);vertical-align:top;width:32px">
                <span style="font-size:20px">🏪</span>
              </td>
              <td style="padding:10px 0 10px 12px;border-bottom:1px solid rgba(245,235,216,0.1)">
                <p style="color:#F5EBD8;font-size:15px;font-weight:700;margin:0 0 2px">Discover Black-Owned Businesses</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">Browse hundreds of verified businesses across every category and city.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(245,235,216,0.1);vertical-align:top;width:32px">
                <span style="font-size:20px">🛡️</span>
              </td>
              <td style="padding:10px 0 10px 12px;border-bottom:1px solid rgba(245,235,216,0.1)">
                <p style="color:#F5EBD8;font-size:15px;font-weight:700;margin:0 0 2px">Community Safety Intel</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">Read and submit neighborhood safety reports from real community members.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(245,235,216,0.1);vertical-align:top;width:32px">
                <span style="font-size:20px">🗺️</span>
              </td>
              <td style="padding:10px 0 10px 12px;border-bottom:1px solid rgba(245,235,216,0.1)">
                <p style="color:#F5EBD8;font-size:15px;font-weight:700;margin:0 0 2px">Map View</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">See businesses pinned on a full map with safety overlays for any area.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;vertical-align:top;width:32px">
                <span style="font-size:20px">✨</span>
              </td>
              <td style="padding:10px 0 10px 12px">
                <p style="color:#F5EBD8;font-size:15px;font-weight:700;margin:0 0 2px">KinfolkAI Travel Planning</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">Plan journeys that center culture, community, and comfort with AI assistance.</p>
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align:center;margin-bottom:32px">
          <a href="https://mappingwithmelanin.com/discover" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:16px 40px;border-radius:50px;text-decoration:none">
            Start Exploring →
          </a>
        </div>

        <p style="color:#3A1F0E;font-size:15px;line-height:1.6;margin:0 0 8px">
          Have a question or want to submit a business? Reply to this email — a real person will read it.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:24px 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping With Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.6;margin:0">Melanin Maps LLC · <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a></p>
      </div>
    `,
  });
}

export async function sendWaitlistConfirmation(to: string, position: number, referralCode: string, firstName: string, lastName?: string) {
  if (!resend) { log("waitlist confirmation"); return; }
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;
  const referralLink = `https://mappingwithmelanin.com/?ref=${referralCode}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: "You're in — Welcome to the Mapping with Melanin™ Waitlist",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping with Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 8px">Hello ${fullName},</p>

        <h1 style="font-size:28px;color:#2B1507;font-weight:700;margin:0 0 24px;line-height:1.3">You're in!</h1>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          Thank you for joining the Mapping with Melanin™ waitlist and becoming one of the founding members of our growing community.
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:20px 24px;margin:0 0 20px">
          <p style="color:#CA922B;font-size:15px;font-weight:700;margin:0 0 6px">📱 Where to access the platform</p>
          <p style="color:#F5EBD8;font-size:14px;line-height:1.6;margin:0">
            Once you're approved, you'll access Mapping with Melanin™ directly at
            <a href="https://mappingwithmelanin.com" style="color:#CA922B;font-weight:700"> mappingwithmelanin.com</a> —
            no app download needed. The mobile app is on the way, but the full platform is live on the web right now.
          </p>
        </div>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          We're building more than an app. We're creating a community-powered platform designed to help people discover businesses, neighborhoods, employers, events, and meaningful connections through trusted experiences and shared insights.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;margin:0 0 8px">Our mission is simple:</p>
        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px;font-style:italic">
          To help people navigate the world with greater confidence, connection, opportunity, and belonging.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;margin:0 0 12px">As a waitlist member, you'll receive:</p>
        <ul style="color:#3A1F0E;font-size:16px;line-height:2;margin:0 0 24px;padding-left:20px">
          <li>Early access to the platform before public launch</li>
          <li>Opportunities to participate in beta testing</li>
          <li>Exclusive product updates and behind-the-scenes previews</li>
          <li>The ability to shape future features through your feedback</li>
          <li>Priority access to special launch promotions and rewards</li>
        </ul>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          What makes Mapping with Melanin™ different is that the platform is powered by the community it serves.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          Every recommendation, review, business listing, neighborhood insight, event submission, and safety observation helps create a resource that becomes more valuable for everyone.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;margin:0 0 24px">
          Your waitlist position: <span style="color:#CA922B">#${position}</span>
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:28px;margin-bottom:28px">
          <p style="color:#F5EBD8;font-size:16px;font-weight:700;margin:0 0 12px">Want to move up the list?</p>
          <p style="color:#F5EBD8;font-size:15px;line-height:1.6;margin:0 0 20px">
            Share Mapping with Melanin™ with your friends, family, and community. The more people you refer, the closer you move toward early access.
          </p>
          <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 8px">Your referral link:</p>
          <a href="${referralLink}" style="color:#CA922B;font-size:15px;font-weight:700;word-break:break-all;display:block;margin-bottom:20px">${referralLink}</a>
          <a href="${referralLink}" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:15px;padding:12px 28px;border-radius:50px;text-decoration:none">
            Share Your Link →
          </a>
        </div>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          We're honored to have you with us from the beginning and can't wait to show you what we're building.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          Together, we're creating a new way to discover, connect, and belong.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping with Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:14px;opacity:0.6;margin:0 0 4px">Melanin Maps LLC</p>
        <a href="https://mappingwithmelanin.com" style="color:#CA922B;font-size:14px;">www.mappingwithmelanin.com</a>
      </div>
    `,
  });
}

export async function sendReferralNudge(
  to: string,
  firstName: string,
  position: number,
  referralCode: string,
  newSignupsThisWeek: number,
) {
  if (!resend) { log("referral nudge"); return; }
  const referralLink = `https://mappingwithmelanin.com/?ref=${referralCode}`;
  const name = firstName || "there";
  await resend.emails.send({
    from: FROM,
    to,
    subject: `You're #${position} on the Mapping with Melanin™ waitlist 📍`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping with Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 16px">Hello ${name},</p>

        <p style="color:#2B1507;font-size:18px;font-weight:700;line-height:1.4;margin:0 0 16px">
          You're still <span style="color:#CA922B">#${position}</span> on the Mapping with Melanin™ waitlist.
        </p>

        ${newSignupsThisWeek > 0 ? `
        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          <strong>${newSignupsThisWeek.toLocaleString()} people</strong> joined the waitlist this week.
          Share your referral link to move ahead of them and get closer to early access.
        </p>
        ` : `
        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          Share your referral link with friends to move up the waitlist and get early access sooner.
        </p>
        `}

        <div style="background:#2B1507;border-radius:12px;padding:28px;margin:24px 0">
          <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 12px;text-align:center;letter-spacing:1px">── Your Referral Link ──</p>
          <p style="color:#F5EBD8;font-size:15px;line-height:1.6;margin:0 0 16px;text-align:center">
            Every friend who joins using your link moves you up the list.
          </p>
          <a href="${referralLink}" style="color:#CA922B;font-size:15px;word-break:break-all;display:block;margin-bottom:12px;font-weight:700">${referralLink}</a>
          <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">Referral code: <span style="color:#CA922B;font-weight:700;letter-spacing:3px">${referralCode}</span></p>
        </div>

        <a href="${referralLink}" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:14px 32px;border-radius:50px;text-decoration:none;margin-bottom:24px">
          Share Your Link →
        </a>

        <p style="color:#3A1F0E;font-size:14px;line-height:1.6;margin:0 0 8px;opacity:0.7">
          We're building something special and we're grateful you're part of the journey from the beginning.
        </p>

        <p style="color:#2B1507;font-size:15px;font-weight:700;font-style:italic;margin:16px 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:14px;margin:0 0 4px">The Mapping with Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.5;margin:0">Melanin Maps LLC</p>
      </div>
    `,
  });
}

export async function sendBusinessOutreach(to: string, businessName: string, claimLink: string) {
  if (!resend) { log("business outreach"); return; }
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your business was recommended on Mapping with Melanin™ — Claim Your Profile`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping with Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 16px">Hello ${businessName},</p>

        <p style="color:#CA922B;font-size:18px;font-weight:700;line-height:1.4;margin:0 0 20px">Great news!</p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          Your business was recently recommended by a member of the Mapping with Melanin™ community and has been identified as a place that others may want to discover, support, and learn more about.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          Mapping with Melanin™ is a community-powered platform that helps people discover businesses, events, neighborhoods, employers, and opportunities through shared experiences and trusted recommendations.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          We've created a listing for your business so community members can find you, but we'd love for you to claim your profile and become an active part of the platform.
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:28px;margin:0 0 28px">
          <p style="color:#F5EBD8;font-size:15px;font-weight:700;margin:0 0 16px">By joining, you'll be able to:</p>
          <ul style="color:#F5EBD8;font-size:15px;line-height:2;margin:0;padding-left:20px">
            <li>Verify and manage your business information</li>
            <li>Add photos, products, services, and events</li>
            <li>Respond to reviews and community feedback</li>
            <li>Connect directly with potential customers</li>
            <li>Access business insights and engagement metrics</li>
            <li>Participate in future promotional opportunities</li>
          </ul>
        </div>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 28px">
          Most importantly, you'll help us build a stronger network of businesses and community resources for people seeking meaningful connections and trusted recommendations.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;margin:0 0 16px">Claim your profile today:</p>

        <a href="${claimLink}" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:16px 36px;border-radius:50px;text-decoration:none;margin-bottom:32px">
          Claim Business Profile →
        </a>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          Thank you for everything you do for your community. We look forward to welcoming you to Mapping with Melanin™.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping with Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:14px;opacity:0.6;margin:0">Melanin Maps LLC</p>
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
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:32px" />
        <h1 style="font-size:28px;color:#2B1507;margin:0 0 12px">You're in, ${name}! 🎉</h1>
        <p style="color:#3A1F0E;opacity:0.7;font-size:16px;line-height:1.6;margin:0 0 28px">
          Your early access to <strong>Mapping With Melanin™</strong> has been approved. Sign in now to start discovering Minority-owned businesses, community events, and safety intel in your area.
        </p>
        <a href="https://mappingwithmelanin.com/login" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:14px 32px;border-radius:50px;text-decoration:none;margin-bottom:28px">
          Sign In Now →
        </a>
        <p style="color:#3A1F0E;opacity:0.5;font-size:13px;margin:0">
          Questions? Reach us at <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a>
        </p>
      </div>
    `,
  });
}

const PLAN_LABELS: Record<string, string> = {
  individual: "Explorer",
  business: "Business Starter",
  founding: "Founding Member",
  beta: "Beta Tester",
  business_referral: "Business Referral Partner",
};

const PLAN_PRICES: Record<string, string> = {
  individual: "$9.99/month or $79/year",
  business: "$29.99/month or $249/year",
  founding: "locked founding rate (Community 9% · Growth 7% · Premium 5%) for 3 years",
  beta: "standard monthly rate",
  business_referral: "$29.99/month",
};

export async function sendTrialStarted(
  to: string,
  firstName: string | null,
  planType: string,
  trialDays: number,
  trialEndsAt: Date,
) {
  if (!resend) { log("trial started"); return; }
  const name = firstName ?? "there";
  const planLabel = PLAN_LABELS[planType] ?? "Premium";
  const endDate = trialEndsAt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const renewalPrice = PLAN_PRICES[planType] ?? "$9.99/month";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your ${trialDays}-day free trial has started — welcome to Mapping with Melanin™ 🎉`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping with Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 8px">Hello ${name},</p>

        <h1 style="font-size:28px;color:#2B1507;font-weight:700;margin:0 0 16px;line-height:1.3">
          Your free trial is officially underway. 🗺️
        </h1>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          Your <strong>${planLabel}</strong> free trial has started. You have full Premium access for the next <strong>${trialDays} days</strong> — explore everything without restriction.
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:24px;margin-bottom:28px">
          <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 12px;letter-spacing:1px;text-transform:uppercase">Your trial details</p>
          <p style="color:#F5EBD8;font-size:15px;margin:0 0 8px">
            <strong>Plan:</strong> <span style="color:#CA922B">${planLabel}</span>
          </p>
          <p style="color:#F5EBD8;font-size:15px;margin:0 0 8px">
            <strong>Trial length:</strong> <span style="color:#CA922B">${trialDays} days free</span>
          </p>
          <p style="color:#F5EBD8;font-size:15px;margin:0">
            <strong>Trial ends:</strong> <span style="color:#CA922B">${endDate}</span>
          </p>
        </div>

        <p style="color:#2B1507;font-size:16px;font-weight:700;margin:0 0 12px">Here's what you can do right now:</p>
        <ul style="color:#3A1F0E;font-size:15px;line-height:2;margin:0 0 24px;padding-left:20px">
          <li>Explore Minority-owned businesses and cultural gems in your city</li>
          <li>Check community safety scores for neighborhoods</li>
          <li>Save your favorite businesses and build collections</li>
          <li>Submit reviews and safety reports to help the community</li>
          <li>Plan your next trip with KinfolkAI</li>
        </ul>

        <a href="https://mappingwithmelanin.com/discover" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:16px 36px;border-radius:50px;text-decoration:none;margin-bottom:32px">
          Start Exploring →
        </a>

        <div style="background:#fff;border:1px solid rgba(58,31,14,0.1);border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="color:#2B1507;font-size:14px;font-weight:700;margin:0 0 8px">💡 What happens when my trial ends?</p>
          <p style="color:#3A1F0E;font-size:14px;line-height:1.6;margin:0">
            We'll send you a reminder email <strong>3 days before your trial ends</strong> on ${endDate}. If you choose to continue, your membership renews at <strong>${renewalPrice}</strong>. If you cancel before then, you owe nothing and your account reverts to our free Community plan — you'll never lose directory access entirely.
          </p>
        </div>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping with Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.5;margin:0">Melanin Maps LLC</p>
      </div>
    `,
  });
}

export async function sendTrialEndingSoon(
  to: string,
  firstName: string | null,
  planType: string,
  trialEndsAt: Date,
  daysLeft: number,
) {
  if (!resend) { log("trial ending soon"); return; }
  const name = firstName ?? "there";
  const planLabel = PLAN_LABELS[planType] ?? "Premium";
  const renewalPrice = PLAN_PRICES[planType] ?? "$9.99/month";
  const endDate = trialEndsAt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your free trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} — keep your access to Mapping with Melanin™`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping with Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 8px">Hello ${name},</p>

        <h1 style="font-size:26px;color:#2B1507;font-weight:700;margin:0 0 16px;line-height:1.3">
          Your free trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. ⏳
        </h1>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          Your <strong>${planLabel}</strong> trial expires on <strong>${endDate}</strong>. To keep full access to everything you've been enjoying, continue your membership now.
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:28px;margin-bottom:28px;text-align:center">
          <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 8px;letter-spacing:1px;text-transform:uppercase">Continue Your Membership</p>
          <p style="color:#CA922B;font-size:32px;font-weight:700;margin:0 0 4px">${renewalPrice}</p>
          <p style="color:#F5EBD8;opacity:0.5;font-size:13px;margin:0 0 20px">Cancel anytime — no long-term commitment</p>
          <a href="https://mappingwithmelanin.com/membership" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:14px 36px;border-radius:50px;text-decoration:none">
            Keep My Access →
          </a>
        </div>

        <p style="color:#2B1507;font-size:15px;font-weight:700;margin:0 0 12px">What you'll keep with a paid membership:</p>
        <ul style="color:#3A1F0E;font-size:15px;line-height:2;margin:0 0 24px;padding-left:20px">
          <li>Unlimited business listings & full profiles</li>
          <li>Complete neighborhood safety scores</li>
          <li>Submit reviews, reports & community content</li>
          <li>KinfolkAI travel planning</li>
          <li>Save businesses & build personal collections</li>
          <li>Priority customer support</li>
        </ul>

        <p style="color:#3A1F0E;font-size:14px;line-height:1.6;margin:0 0 24px;opacity:0.7">
          If you choose not to renew, your account will automatically move to our free Community plan on ${endDate}. You'll still have access to the directory — just without the Premium features.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping with Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.5;margin:0">Melanin Maps LLC · <a href="https://mappingwithmelanin.com/membership" style="color:#CA922B">Manage membership</a></p>
      </div>
    `,
  });
}

export async function sendTrialExpired(
  to: string,
  firstName: string | null,
  planType: string,
) {
  if (!resend) { log("trial expired"); return; }
  const name = firstName ?? "there";
  const planLabel = PLAN_LABELS[planType] ?? "Premium";
  const renewalPrice = PLAN_PRICES[planType] ?? "$9.99/month";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your Mapping with Melanin™ trial has ended — here's how to continue`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping with Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 8px">Hello ${name},</p>

        <h1 style="font-size:26px;color:#2B1507;font-weight:700;margin:0 0 16px;line-height:1.3">
          Your free trial has ended.
        </h1>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          Your <strong>${planLabel}</strong> trial period has come to a close. Your account has moved to our free Community plan — you still have access to the directory, but Premium features are no longer available.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 28px">
          We hope you experienced the value of being connected to a community built around trust, culture, and shared discovery. We'd love to have you stay.
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:28px;margin-bottom:28px;text-align:center">
          <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 8px;letter-spacing:1px;text-transform:uppercase">Reactivate Your ${planLabel} Membership</p>
          <p style="color:#CA922B;font-size:32px;font-weight:700;margin:0 0 4px">${renewalPrice}</p>
          <p style="color:#F5EBD8;opacity:0.6;font-size:14px;margin:0 0 20px">Cancel anytime. No long-term commitment.</p>
          <a href="https://mappingwithmelanin.com/membership" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:16px 40px;border-radius:50px;text-decoration:none">
            Reactivate My Membership →
          </a>
        </div>

        <p style="color:#2B1507;font-size:15px;font-weight:700;margin:0 0 12px">What you'll get back:</p>
        <ul style="color:#3A1F0E;font-size:15px;line-height:2;margin:0 0 28px;padding-left:20px">
          <li>Unlimited business listings & full profiles</li>
          <li>Complete neighborhood safety scores</li>
          <li>Submit reviews, reports & community content</li>
          <li>KinfolkAI travel planning assistance</li>
          <li>Save businesses & build personal collections</li>
          <li>Priority customer support</li>
        </ul>

        <p style="color:#3A1F0E;font-size:14px;line-height:1.6;margin:0 0 24px;opacity:0.7">
          Questions or feedback about your experience? We genuinely want to hear from you. Reply to this email or reach us at <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a>.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping with Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.5;margin:0">Melanin Maps LLC · <a href="https://mappingwithmelanin.com/membership" style="color:#CA922B">View plans</a></p>
      </div>
    `,
  });
}

export async function sendMembershipCancelled(
  to: string,
  firstName: string | null,
  planType: string,
) {
  if (!resend) { log("membership cancelled"); return; }
  const name = firstName ?? "there";
  const planLabel = PLAN_LABELS[planType] ?? "Premium";
  const renewalPrice = PLAN_PRICES[planType] ?? "$9.99/month";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your Mapping with Melanin™ membership has been cancelled`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping with Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 8px">Hello ${name},</p>

        <h1 style="font-size:24px;color:#2B1507;font-weight:700;margin:0 0 16px;line-height:1.3">
          Your ${planLabel} membership has been cancelled.
        </h1>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          We've processed your cancellation request. Your account has moved to our free Community plan — you'll keep access to the business directory, but Premium features are no longer available.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 28px">
          We're sorry to see you go. If there's anything we could have done better, we genuinely want to hear it — reply to this email and a real person will read it.
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:28px;margin-bottom:28px;text-align:center">
          <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 8px;letter-spacing:1px;text-transform:uppercase">Changed your mind? Come back anytime.</p>
          <p style="color:#CA922B;font-size:28px;font-weight:700;margin:0 0 4px">${renewalPrice}</p>
          <p style="color:#F5EBD8;opacity:0.6;font-size:14px;margin:0 0 20px">No long-term commitment. Cancel anytime.</p>
          <a href="https://mappingwithmelanin.com/membership" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:14px 36px;border-radius:50px;text-decoration:none">
            Reactivate Membership →
          </a>
        </div>

        <p style="color:#3A1F0E;font-size:14px;line-height:1.6;margin:0 0 24px;opacity:0.7">
          Your data is safe and your account remains active on the free plan. If you ever come back, everything will be right where you left it.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping with Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.5;margin:0">Melanin Maps LLC · <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a></p>
      </div>
    `,
  });
}

export async function sendCheckinOverdueEmail(
  to: string,
  trustedContactName: string,
  memberName: string,
  scheduledAt: Date,
  location: string | null,
  city: string | null,
) {
  if (!resend) { log("checkin overdue"); return; }
  const timeStr = scheduledAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateStr = scheduledAt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const where = [location, city].filter(Boolean).join(", ") || "their destination";
  await resend.emails.send({
    from: "Mapping With Melanin Safety <safety@send.mappingwithmelanin.com>",
    to,
    subject: `⚠️ Safety Alert: ${memberName} hasn't checked in`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;background:#FEFCF8;padding:0;border-radius:16px;overflow:hidden;border:1px solid rgba(43,21,7,0.1)">
        <div style="background:linear-gradient(135deg,#7B2020 0%,#991B1B 100%);padding:32px 40px;text-align:center">
          <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0 0 8px;letter-spacing:1px;text-transform:uppercase">Mapping With Melanin™ Safety</p>
          <h1 style="color:#FFFFFF;font-size:26px;font-weight:700;margin:0">Safety Check-In Alert</h1>
        </div>
        <div style="padding:40px">
          <p style="color:#2B1507;font-size:16px;margin:0 0 20px">Hi ${trustedContactName},</p>
          <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:20px;margin:0 0 24px">
            <p style="color:#991B1B;font-size:16px;font-weight:700;margin:0 0 8px">⚠️ Missed Check-In</p>
            <p style="color:#7F1D1D;font-size:15px;margin:0"><strong>${memberName}</strong> was expected to check in by <strong>${timeStr} on ${dateStr}</strong> from <strong>${where}</strong> — and hasn't confirmed their safety yet.</p>
          </div>
          <p style="color:#3A1F0E;font-size:15px;line-height:1.6;margin:0 0 16px">Please try reaching out to them directly. If you believe they may be in danger, contact local emergency services.</p>
          <p style="color:#3A1F0E;font-size:13px;margin:0 0 32px;opacity:0.7">This is an automated alert from the Mapping With Melanin safety check-in system, set up by ${memberName}.</p>
          <p style="color:#2B1507;font-size:15px;font-weight:700;font-style:italic;margin:0">Map Your Life. Connect Deeper.™</p>
          <p style="color:#3A1F0E;font-size:13px;margin:4px 0 0;opacity:0.5">Mapping With Melanin™ · <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a></p>
        </div>
      </div>
    `,
  });
}

export async function sendWeeklyDigest(
  to: string,
  firstName: string | null,
  businesses: Array<{ name: string; category: string; city: string; state: string; id: string }>,
  weekLabel: string,
) {
  if (!resend) { log("weekly digest"); return; }
  const name = firstName ?? "there";

  const bizCards = businesses.slice(0, 6).map(b => `
    <a href="https://mappingwithmelanin.com/business/${b.id}" style="display:block;text-decoration:none;margin-bottom:16px">
      <div style="background:#fff;border-radius:12px;padding:16px 20px;border:1px solid rgba(43,21,7,0.08)">
        <p style="color:#2B1507;font-size:15px;font-weight:700;margin:0 0 4px">${b.name}</p>
        <p style="color:#CA922B;font-size:12px;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px">${b.category}</p>
        <p style="color:#3A1F0E;font-size:13px;margin:0;opacity:0.6">${b.city}, ${b.state}</p>
      </div>
    </a>
  `).join("");

  const noBizMessage = `
    <p style="color:#3A1F0E;font-size:15px;line-height:1.6;margin:0 0 24px">
      No new businesses were added this week, but our community is growing. Explore the full directory and you might discover something you haven't seen yet.
    </p>
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your weekly minority-owned business digest — ${weekLabel}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping with Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 8px">Hey ${name} 👋🏾</p>

        <h1 style="font-size:26px;color:#2B1507;font-weight:700;margin:0 0 8px;line-height:1.3;font-style:italic">
          This Week in Black Excellence
        </h1>
        <p style="color:#3A1F0E;font-size:14px;margin:0 0 28px;opacity:0.6">${weekLabel}</p>

        <p style="color:#3A1F0E;font-size:15px;line-height:1.6;margin:0 0 20px">
          Here are the newest minority-owned businesses added to the Mapping with Melanin™ directory this week. Every discovery, share, and check-in helps our community grow stronger.
        </p>

        ${businesses.length > 0 ? bizCards : noBizMessage}

        <div style="text-align:center;margin:28px 0">
          <a href="https://mappingwithmelanin.com/discover" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:14px 36px;border-radius:50px;text-decoration:none">
            Explore the Full Directory →
          </a>
        </div>

        <div style="background:#2B1507;border-radius:12px;padding:24px;margin-bottom:28px;text-align:center">
          <p style="color:#F5EBD8;font-size:13px;font-weight:700;margin:0 0 6px;letter-spacing:1px;text-transform:uppercase">Know a minority-owned business?</p>
          <p style="color:#F5EBD8;font-size:14px;margin:0 0 16px;opacity:0.7">Help us grow the most comprehensive directory of minority-owned businesses in the country.</p>
          <a href="https://mappingwithmelanin.com/submit-business" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:14px;padding:10px 24px;border-radius:50px;text-decoration:none">
            Submit a Business
          </a>
        </div>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping with Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.5;margin:0">Melanin Maps LLC · <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a> · <a href="https://mappingwithmelanin.com/unsubscribe" style="color:#CA922B">Unsubscribe</a></p>
      </div>
    `,
  });
}

// ── Founding Business Welcome Email ──────────────────────────────────────────
export async function sendFoundingWelcomeEmail(
  to: string,
  firstName: string | null,
  businessName: string,
  foundingNumber: number,
) {
  if (!resend) { log("founding welcome email"); return; }
  const name = firstName ?? "there";
  const badge = String(foundingNumber).padStart(3, "0");
  await resend.emails.send({
    from: FROM,
    to,
    subject: "🎉 Welcome! You're Officially a Founding Business with Mapping with Melanin™",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:0;border-radius:16px;overflow:hidden">

        <!-- Hero Banner -->
        <div style="background:linear-gradient(135deg,#2B1507 0%,#442A19 60%,#CA922B 100%);padding:48px 32px 40px;text-align:center">
          <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:24px;display:block;margin-left:auto;margin-right:auto" />
          <div style="display:inline-block;background:rgba(202,146,43,0.25);border:1px solid #CA922B;border-radius:50px;padding:6px 20px;margin-bottom:16px">
            <p style="color:#CA922B;font-size:12px;font-weight:700;margin:0;letter-spacing:2px;text-transform:uppercase">Founding Business #${badge}</p>
          </div>
          <h1 style="font-size:30px;color:#F5EBD8;font-weight:700;margin:0 0 12px;line-height:1.3">
            Congratulations, ${name}! 🎉
          </h1>
          <p style="color:#F5EBD8;font-size:17px;margin:0;opacity:0.85;line-height:1.5">
            <strong>${businessName}</strong> is officially a<br/>Founding Business on Mapping with Melanin™
          </p>
        </div>

        <!-- Intro -->
        <div style="padding:36px 32px 0">
          <p style="color:#3A1F0E;font-size:16px;line-height:1.7;margin:0 0 16px">
            We're excited to officially welcome <strong>${businessName}</strong> as one of our Founding Businesses on Mapping with Melanin™.
          </p>
          <p style="color:#3A1F0E;font-size:16px;line-height:1.7;margin:0 0 16px">
            This is more than a membership — it's an opportunity to help shape a platform built to connect communities, support minority-owned businesses, and make discovering trusted businesses easier than ever.
          </p>
          <p style="color:#3A1F0E;font-size:16px;line-height:1.7;margin:0 0 28px">
            As one of our Founding Businesses, you're joining an exclusive group of early partners whose feedback and participation will help influence the future of the platform.
          </p>
        </div>

        <!-- Benefits Block -->
        <div style="margin:0 32px 28px;background:#2B1507;border-radius:16px;overflow:hidden">
          <div style="padding:22px 24px 16px;border-bottom:1px solid rgba(245,235,216,0.1)">
            <p style="color:#CA922B;font-size:12px;font-weight:700;margin:0;letter-spacing:2px;text-transform:uppercase">Your Founding Business Benefits</p>
          </div>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:16px 24px;border-bottom:1px solid rgba(245,235,216,0.08);vertical-align:top;width:36px">
                <span style="font-size:22px">🏆</span>
              </td>
              <td style="padding:16px 24px 16px 0;border-bottom:1px solid rgba(245,235,216,0.08)">
                <p style="color:#F5EBD8;font-size:15px;font-weight:700;margin:0 0 4px">Founding Business Badge</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.65;line-height:1.5">Show customers that you helped build our community from the very beginning.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-bottom:1px solid rgba(245,235,216,0.08);vertical-align:top">
                <span style="font-size:22px">💰</span>
              </td>
              <td style="padding:16px 24px 16px 0;border-bottom:1px solid rgba(245,235,216,0.08)">
                <p style="color:#F5EBD8;font-size:15px;font-weight:700;margin:0 0 4px">Locked Marketplace Fees</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.65;line-height:1.5">Your exclusive Founding marketplace fee has been locked for three years, giving your business long-term savings as we continue to grow.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-bottom:1px solid rgba(245,235,216,0.08);vertical-align:top">
                <span style="font-size:22px">👑</span>
              </td>
              <td style="padding:16px 24px 16px 0;border-bottom:1px solid rgba(245,235,216,0.08)">
                <p style="color:#F5EBD8;font-size:15px;font-weight:700;margin:0 0 4px">Six Months of Premium Business Membership</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.65;line-height:1.5">Enjoy premium tools and features at no additional cost during your introductory period.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-bottom:1px solid rgba(245,235,216,0.08);vertical-align:top">
                <span style="font-size:22px">🚀</span>
              </td>
              <td style="padding:16px 24px 16px 0;border-bottom:1px solid rgba(245,235,216,0.08)">
                <p style="color:#F5EBD8;font-size:15px;font-weight:700;margin:0 0 4px">Priority Onboarding</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.65;line-height:1.5">Our team will prioritize your onboarding experience to help you get the most out of the platform.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-bottom:1px solid rgba(245,235,216,0.08);vertical-align:top">
                <span style="font-size:22px">🧠</span>
              </td>
              <td style="padding:16px 24px 16px 0;border-bottom:1px solid rgba(245,235,216,0.08)">
                <p style="color:#F5EBD8;font-size:15px;font-weight:700;margin:0 0 4px">Early Access</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.65;line-height:1.5">Be among the first to experience new features, tools, and improvements before they're released to the public.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;vertical-align:top">
                <span style="font-size:22px">🌍</span>
              </td>
              <td style="padding:16px 24px 16px 0">
                <p style="color:#F5EBD8;font-size:15px;font-weight:700;margin:0 0 4px">Founding Business Recognition</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.65;line-height:1.5">Your business will be recognized throughout the platform as one of the companies that believed in Mapping with Melanin™ from the very beginning.</p>
              </td>
            </tr>
          </table>
        </div>

        <!-- What's Next -->
        <div style="padding:0 32px 28px">
          <p style="color:#2B1507;font-size:19px;font-weight:700;margin:0 0 16px">What's Next?</p>
          <p style="color:#3A1F0E;font-size:15px;line-height:1.7;margin:0 0 16px">
            Over the coming weeks you'll receive onboarding guidance, platform updates, and tips to help you maximize your visibility and connect with customers across the Mapping with Melanin™ community.
          </p>
          <p style="color:#2B1507;font-size:15px;font-weight:700;margin:0 0 12px">We also encourage you to:</p>
          <table style="width:100%;border-collapse:collapse">
            ${[
              "Complete your business profile.",
              "Upload your logo, photos, and videos.",
              "Share your story and what makes your business unique.",
              "Invite your customers to follow your business and leave reviews.",
              "Explore upcoming features designed to help your business grow.",
            ].map(item => `
            <tr>
              <td style="padding:6px 0;vertical-align:top;width:24px">
                <span style="color:#2D7A4F;font-weight:700;font-size:15px">✔</span>
              </td>
              <td style="padding:6px 0 6px 8px">
                <p style="color:#3A1F0E;font-size:15px;margin:0;line-height:1.5">${item}</p>
              </td>
            </tr>`).join("")}
          </table>
        </div>

        <!-- CTA -->
        <div style="text-align:center;padding:0 32px 32px">
          <a href="https://mappingwithmelanin.com/business-dashboard" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:16px 44px;border-radius:50px;text-decoration:none;letter-spacing:0.3px">
            Go to Your Business Dashboard →
          </a>
        </div>

        <!-- Thank You -->
        <div style="background:#2B1507;border-radius:0 0 16px 16px;padding:32px">
          <p style="color:#CA922B;font-size:12px;font-weight:700;margin:0 0 16px;letter-spacing:2px;text-transform:uppercase">Thank You</p>
          <p style="color:#F5EBD8;font-size:15px;line-height:1.7;margin:0 0 16px;opacity:0.85">
            Thank you for believing in our mission. We're building more than a marketplace — we're building a trusted community where businesses can thrive, customers can discover with confidence, and meaningful connections can flourish.
          </p>
          <p style="color:#F5EBD8;font-size:15px;line-height:1.7;margin:0 0 24px;opacity:0.85">
            We're honored to have your business as one of our Founding Businesses and look forward to growing together. Welcome to the Mapping with Melanin™ family.
          </p>
          <p style="color:#CA922B;font-size:16px;font-weight:700;font-style:italic;margin:0 0 6px">Map Your Life. Connect Deeper.™</p>
          <p style="color:#F5EBD8;font-size:14px;margin:0 0 4px;opacity:0.8">The Mapping With Melanin™ Team</p>
          <p style="color:#F5EBD8;font-size:12px;opacity:0.45;margin:0">Melanin Maps LLC · <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a></p>
        </div>
      </div>
    `,
  });
}

// ── Founding Business Anniversary Email ───────────────────────────────────────
export interface FoundingAnniversaryMetrics {
  profileViews: number;
  saves: number;
  reviews: number;
  rating: number;
  foundingFeePercent: number;   // e.g. 5 (meaning 5%)
  standardFeePercent: number;   // e.g. 10
  feeSavedEst: number;          // estimated $ saved (float, 2dp)
}

export async function sendFoundingAnniversaryEmail(
  to: string,
  firstName: string | null,
  businessName: string,
  foundingNumber: number,
  yearsActive: number,
  metrics: FoundingAnniversaryMetrics,
  aiMessage: string,
) {
  if (!resend) { log("founding anniversary email"); return; }
  const name = firstName ?? "there";
  const badge = String(foundingNumber).padStart(3, "0");

  const ordinalSuffix = (n: number) => {
    const s = ["th","st","nd","rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
  };

  const fmtNum = (n: number) => n.toLocaleString("en-US");
  const fmtUSD = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  await resend.emails.send({
    from: FROM,
    to,
    subject: `🎂 Happy ${ordinalSuffix(yearsActive)} Founding Anniversary, ${businessName}!`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:0;border-radius:16px;overflow:hidden">

        <!-- Anniversary Hero -->
        <div style="background:linear-gradient(135deg,#2B1507 0%,#442A19 55%,#CA922B 100%);padding:48px 32px 40px;text-align:center">
          <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto" />
          <div style="font-size:48px;margin-bottom:12px">🎂</div>
          <div style="display:inline-block;background:rgba(202,146,43,0.25);border:1px solid #CA922B;border-radius:50px;padding:6px 20px;margin-bottom:16px">
            <p style="color:#CA922B;font-size:12px;font-weight:700;margin:0;letter-spacing:2px;text-transform:uppercase">Founding Business #${badge} · Year ${yearsActive}</p>
          </div>
          <h1 style="font-size:28px;color:#F5EBD8;font-weight:700;margin:0 0 10px;line-height:1.3">
            Happy ${ordinalSuffix(yearsActive)} Anniversary, ${name}!
          </h1>
          <p style="color:#F5EBD8;font-size:16px;margin:0;opacity:0.85;line-height:1.5">
            ${yearsActive} year${yearsActive !== 1 ? "s" : ""} of building something meaningful together.
          </p>
        </div>

        <!-- Milestone Stats -->
        <div style="padding:32px 32px 0">
          <p style="color:#2B1507;font-size:19px;font-weight:700;margin:0 0 16px;text-align:center">Your Impact at a Glance</p>
          <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px">
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="width:48%;padding:0 6px 12px 0;vertical-align:top">
                  <div style="background:#2B1507;border-radius:14px;padding:20px;text-align:center">
                    <p style="color:#CA922B;font-size:28px;font-weight:700;margin:0 0 4px">${fmtNum(metrics.profileViews)}</p>
                    <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.75">Profile Views</p>
                  </div>
                </td>
                <td style="width:48%;padding:0 0 12px 6px;vertical-align:top">
                  <div style="background:#2B1507;border-radius:14px;padding:20px;text-align:center">
                    <p style="color:#CA922B;font-size:28px;font-weight:700;margin:0 0 4px">${fmtNum(metrics.saves)}</p>
                    <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.75">Community Saves</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="width:48%;padding:0 6px 0 0;vertical-align:top">
                  <div style="background:#2B1507;border-radius:14px;padding:20px;text-align:center">
                    <p style="color:#CA922B;font-size:28px;font-weight:700;margin:0 0 4px">${fmtNum(metrics.reviews)}</p>
                    <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.75">Reviews Received</p>
                  </div>
                </td>
                <td style="width:48%;padding:0 0 0 6px;vertical-align:top">
                  <div style="background:#2B1507;border-radius:14px;padding:20px;text-align:center">
                    <p style="color:#CA922B;font-size:28px;font-weight:700;margin:0 0 4px">${metrics.rating > 0 ? metrics.rating.toFixed(1) + "★" : "—"}</p>
                    <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.75">Avg Rating</p>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- AI Fee Savings Card -->
        <div style="margin:0 32px 28px;background:linear-gradient(135deg,#2D7A4F,#1A5C38);border-radius:16px;padding:28px">
          <p style="color:#A8F0C6;font-size:12px;font-weight:700;margin:0 0 8px;letter-spacing:2px;text-transform:uppercase">💰 Your Founding Rate Reinvestment</p>
          <p style="color:#F5EBD8;font-size:15px;line-height:1.7;margin:0 0 20px">${aiMessage}</p>
          <div style="background:rgba(0,0,0,0.2);border-radius:10px;padding:16px 20px;display:flex;justify-content:space-between">
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="text-align:center;padding:0 12px 0 0;border-right:1px solid rgba(245,235,216,0.15)">
                  <p style="color:#A8F0C6;font-size:22px;font-weight:700;margin:0 0 4px">${metrics.foundingFeePercent}%</p>
                  <p style="color:#F5EBD8;font-size:11px;margin:0;opacity:0.6">Your Locked Rate</p>
                </td>
                <td style="text-align:center;padding:0 12px;border-right:1px solid rgba(245,235,216,0.15)">
                  <p style="color:#F5EBD8;font-size:22px;font-weight:700;margin:0 0 4px;opacity:0.45;text-decoration:line-through">${metrics.standardFeePercent}%</p>
                  <p style="color:#F5EBD8;font-size:11px;margin:0;opacity:0.45">Standard Rate</p>
                </td>
                <td style="text-align:center;padding:0 0 0 12px">
                  <p style="color:#A8F0C6;font-size:22px;font-weight:700;margin:0 0 4px">${fmtUSD(metrics.feeSavedEst)}</p>
                  <p style="color:#F5EBD8;font-size:11px;margin:0;opacity:0.6">Noted Savings</p>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Founding Milestones Reminder -->
        <div style="padding:0 32px 28px">
          <p style="color:#2B1507;font-size:19px;font-weight:700;margin:0 0 16px">Still Going Strong — Your Founding Benefits</p>
          <div style="background:#2B1507;border-radius:14px;padding:20px 24px">
            ${[
              ["🏆","Founding Business Badge","Displayed on your profile for all to see."],
              ["💰","Locked Fee Rate","Your ${metrics.foundingFeePercent}% rate stays locked. No surprises."],
              ["🧠","Early Access","You'll be among the first to experience every new feature."],
              ["🌍","Founding Recognition","You believed in this vision before anyone else — and we don't forget it."],
            ].map(([icon, title, desc]) => `
            <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px">
              <span style="font-size:20px;flex-shrink:0">${icon}</span>
              <div>
                <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 3px">${title}</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.65;line-height:1.5">${desc}</p>
              </div>
            </div>`).join("")}
          </div>
        </div>

        <!-- CTA -->
        <div style="text-align:center;padding:0 32px 36px">
          <a href="https://mappingwithmelanin.com/business-dashboard" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:16px 44px;border-radius:50px;text-decoration:none;letter-spacing:0.3px">
            Explore Your Dashboard →
          </a>
          <p style="color:#3A1F0E;font-size:13px;margin:16px 0 0;opacity:0.6">
            Update your profile · Discover new features · Connect with your community
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#2B1507;border-radius:0 0 16px 16px;padding:28px 32px">
          <p style="color:#F5EBD8;font-size:15px;line-height:1.7;margin:0 0 16px;opacity:0.85">
            Thank you for ${yearsActive} year${yearsActive !== 1 ? "s" : ""} of trust, loyalty, and partnership. We're building this for you — and with you.
          </p>
          <p style="color:#CA922B;font-size:16px;font-weight:700;font-style:italic;margin:0 0 6px">Map Your Life. Connect Deeper.™</p>
          <p style="color:#F5EBD8;font-size:14px;margin:0 0 4px;opacity:0.8">The Mapping With Melanin™ Team</p>
          <p style="color:#F5EBD8;font-size:12px;opacity:0.45;margin:0">Melanin Maps LLC · <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a> · <a href="https://mappingwithmelanin.com/unsubscribe" style="color:#CA922B">Unsubscribe</a></p>
        </div>
      </div>
    `,
  });
}

export async function sendClaimReceived(to: string, ownerName: string, businessName: string) {
  if (!resend) { log("claim received email"); return; }
  const name = ownerName.split(" ")[0] || ownerName;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `We received your claim for ${businessName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:32px" />

        <h1 style="font-size:26px;color:#2B1507;font-weight:700;margin:0 0 12px;line-height:1.3">
          Claim received, ${name}. 🛡️
        </h1>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          Thanks for claiming <strong>${businessName}</strong> on Mapping With Melanin™. Our team will review your submission and verify your ownership within <strong>2–3 business days</strong>.
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:24px;margin-bottom:28px">
          <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 14px;letter-spacing:1px;text-transform:uppercase">What happens next</p>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(245,235,216,0.1);vertical-align:top;width:28px"><span style="font-size:18px">🔍</span></td>
              <td style="padding:10px 0 10px 12px;border-bottom:1px solid rgba(245,235,216,0.1)">
                <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 2px">Review</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">Our team checks the details you submitted against the business listing.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(245,235,216,0.1);vertical-align:top;width:28px"><span style="font-size:18px">📧</span></td>
              <td style="padding:10px 0 10px 12px;border-bottom:1px solid rgba(245,235,216,0.1)">
                <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 2px">We may reach out</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">If we need additional verification (a document, a quick call), we'll email you at this address.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;vertical-align:top;width:28px"><span style="font-size:18px">✅</span></td>
              <td style="padding:10px 0 10px 12px">
                <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 2px">Approval &amp; access</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">Once approved, you'll get an email with a link to log in and manage your listing.</p>
              </td>
            </tr>
          </table>
        </div>

        <p style="color:#3A1F0E;font-size:14px;line-height:1.6;margin:0 0 28px">
          Questions? Reply to this email or reach us at <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a>.
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:24px">
          <p style="color:#CA922B;font-size:15px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>
          <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">Melanin Maps LLC · <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a></p>
        </div>
      </div>
    `,
  });
}

export async function sendClaimApproved(to: string, ownerName: string, businessName: string) {
  if (!resend) { log("claim approved email"); return; }
  const name = ownerName.split(" ")[0] || ownerName;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `You're approved! Manage ${businessName} on Mapping With Melanin™`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:32px" />

        <h1 style="font-size:26px;color:#2B1507;font-weight:700;margin:0 0 12px;line-height:1.3">
          You're the verified owner of ${businessName}. 🎉
        </h1>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          Hey ${name} — your ownership claim has been <strong>approved</strong>. You now have full access to your business dashboard on Mapping With Melanin™.
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:24px;margin-bottom:28px">
          <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 14px;letter-spacing:1px;text-transform:uppercase">What you can do now</p>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:9px 0;border-bottom:1px solid rgba(245,235,216,0.1);vertical-align:top;width:28px"><span style="font-size:18px">✏️</span></td>
              <td style="padding:9px 0 9px 12px;border-bottom:1px solid rgba(245,235,216,0.1)">
                <p style="color:#F5EBD8;font-size:13px;font-weight:700;margin:0 0 1px">Edit your listing</p>
                <p style="color:#F5EBD8;font-size:12px;margin:0;opacity:0.7">Update your hours, photos, description, and contact info.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:9px 0;border-bottom:1px solid rgba(245,235,216,0.1);vertical-align:top;width:28px"><span style="font-size:18px">💬</span></td>
              <td style="padding:9px 0 9px 12px;border-bottom:1px solid rgba(245,235,216,0.1)">
                <p style="color:#F5EBD8;font-size:13px;font-weight:700;margin:0 0 1px">Respond to reviews</p>
                <p style="color:#F5EBD8;font-size:12px;margin:0;opacity:0.7">Engage with your community directly from the dashboard.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:9px 0;border-bottom:1px solid rgba(245,235,216,0.1);vertical-align:top;width:28px"><span style="font-size:18px">📊</span></td>
              <td style="padding:9px 0 9px 12px;border-bottom:1px solid rgba(245,235,216,0.1)">
                <p style="color:#F5EBD8;font-size:13px;font-weight:700;margin:0 0 1px">View analytics</p>
                <p style="color:#F5EBD8;font-size:12px;margin:0;opacity:0.7">See how many people are finding and saving your business.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:9px 0;vertical-align:top;width:28px"><span style="font-size:18px">🛡️</span></td>
              <td style="padding:9px 0 9px 12px">
                <p style="color:#F5EBD8;font-size:13px;font-weight:700;margin:0 0 1px">Get fully verified</p>
                <p style="color:#F5EBD8;font-size:12px;margin:0;opacity:0.7">Submit docs to earn the Verified Minority-Owned badge and build trust.</p>
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align:center;margin-bottom:32px">
          <a href="https://mappingwithmelanin.com/business-dashboard" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:16px 44px;border-radius:50px;text-decoration:none">
            Go to My Dashboard →
          </a>
          <p style="color:#3A1F0E;font-size:13px;margin:12px 0 0;opacity:0.6">Log in with the account linked to this email address.</p>
        </div>

        <div style="background:#2B1507;border-radius:12px;padding:24px">
          <p style="color:#CA922B;font-size:15px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>
          <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">Melanin Maps LLC · <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a></p>
        </div>
      </div>
    `,
  });
}

export async function sendBusinessSubmissionAlert(data: {
  ownerName: string;
  ownerEmail: string;
  businessName: string;
  category?: string;
  city?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  twitter?: string;
  message: string;
}) {
  if (!resend) { log("business submission alert"); return; }
  const socials = [
    data.instagram ? `<tr><td style="padding:6px 0;color:#3A1F0E;font-size:14px;font-weight:700;width:130px">Instagram</td><td style="padding:6px 0;color:#3A1F0E;font-size:14px">${data.instagram}</td></tr>` : "",
    data.facebook  ? `<tr><td style="padding:6px 0;color:#3A1F0E;font-size:14px;font-weight:700">Facebook</td><td style="padding:6px 0;color:#3A1F0E;font-size:14px">${data.facebook}</td></tr>` : "",
    data.tiktok    ? `<tr><td style="padding:6px 0;color:#3A1F0E;font-size:14px;font-weight:700">TikTok</td><td style="padding:6px 0;color:#3A1F0E;font-size:14px">${data.tiktok}</td></tr>` : "",
    data.twitter   ? `<tr><td style="padding:6px 0;color:#3A1F0E;font-size:14px;font-weight:700">X / Twitter</td><td style="padding:6px 0;color:#3A1F0E;font-size:14px">${data.twitter}</td></tr>` : "",
  ].filter(Boolean).join("");
  await resend.emails.send({
    from: FROM,
    to: "hello@mappingwithmelanin.com",
    replyTo: data.ownerEmail,
    subject: `🏪 New Business Submission: ${data.businessName}${data.city ? ` — ${data.city}` : ""}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:24px" />
        <h2 style="font-size:22px;color:#2B1507;font-weight:700;margin:0 0 20px">New Business Submission</h2>
        <div style="background:#fff;border-radius:12px;padding:24px;margin-bottom:20px;border:1px solid rgba(58,31,14,0.1)">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#3A1F0E;font-size:14px;font-weight:700;width:130px">Business</td><td style="padding:6px 0;color:#2B1507;font-size:16px;font-weight:700">${data.businessName}</td></tr>
            <tr><td style="padding:6px 0;color:#3A1F0E;font-size:14px;font-weight:700">Owner</td><td style="padding:6px 0;color:#3A1F0E;font-size:14px">${data.ownerName}</td></tr>
            <tr><td style="padding:6px 0;color:#3A1F0E;font-size:14px;font-weight:700">Email</td><td style="padding:6px 0;font-size:14px"><a href="mailto:${data.ownerEmail}" style="color:#CA922B">${data.ownerEmail}</a></td></tr>
            ${data.category ? `<tr><td style="padding:6px 0;color:#3A1F0E;font-size:14px;font-weight:700">Category</td><td style="padding:6px 0;color:#3A1F0E;font-size:14px">${data.category}</td></tr>` : ""}
            ${data.city ? `<tr><td style="padding:6px 0;color:#3A1F0E;font-size:14px;font-weight:700">City</td><td style="padding:6px 0;color:#3A1F0E;font-size:14px">${data.city}</td></tr>` : ""}
            ${data.website ? `<tr><td style="padding:6px 0;color:#3A1F0E;font-size:14px;font-weight:700">Website</td><td style="padding:6px 0;font-size:14px"><a href="${data.website}" style="color:#CA922B">${data.website}</a></td></tr>` : ""}
            ${socials}
          </table>
        </div>
        ${data.message ? `<div style="background:#fff;border-radius:12px;padding:20px;border:1px solid rgba(58,31,14,0.1);margin-bottom:20px"><p style="color:#3A1F0E;font-size:13px;font-weight:700;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">About the business</p><p style="color:#3A1F0E;font-size:14px;line-height:1.6;margin:0">${data.message}</p></div>` : ""}
        <div style="background:#2B1507;border-radius:12px;padding:16px">
          <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.8">Reply to this email to contact the owner directly.</p>
        </div>
      </div>
    `,
  });
}

export async function sendNominationAlert(data: {
  nominationName: string;
  nominationCategory?: string;
  nominationSocialLink?: string;
  city?: string;
  neighborhood?: string;
}) {
  if (!resend) { log("nomination alert"); return; }
  await resend.emails.send({
    from: FROM,
    to: "hello@mappingwithmelanin.com",
    subject: `✊🏾 New Business Nomination: ${data.nominationName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:24px" />
        <h2 style="font-size:22px;color:#2B1507;font-weight:700;margin:0 0 8px">Community Nomination</h2>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 20px">A community member nominated a business not yet on MWM.</p>
        <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid rgba(58,31,14,0.1);margin-bottom:20px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#3A1F0E;font-size:14px;font-weight:700;width:140px">Business</td><td style="padding:6px 0;color:#2B1507;font-size:16px;font-weight:700">${data.nominationName}</td></tr>
            ${data.nominationCategory ? `<tr><td style="padding:6px 0;color:#3A1F0E;font-size:14px;font-weight:700">Category</td><td style="padding:6px 0;color:#3A1F0E;font-size:14px">${data.nominationCategory}</td></tr>` : ""}
            ${(data.city || data.neighborhood) ? `<tr><td style="padding:6px 0;color:#3A1F0E;font-size:14px;font-weight:700">Location</td><td style="padding:6px 0;color:#3A1F0E;font-size:14px">${data.neighborhood ? `${data.neighborhood}, ` : ""}${data.city ?? ""}</td></tr>` : ""}
            ${data.nominationSocialLink ? `<tr><td style="padding:6px 0;color:#3A1F0E;font-size:14px;font-weight:700">Social / Website</td><td style="padding:6px 0;font-size:14px"><a href="${data.nominationSocialLink}" style="color:#CA922B">${data.nominationSocialLink}</a></td></tr>` : ""}
          </table>
        </div>
        <div style="background:#2B1507;border-radius:12px;padding:16px">
          <p style="color:#CA922B;font-size:14px;font-weight:700;margin:0 0 4px">Action needed</p>
          <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.8">Reach out to onboard or archive this nomination in the admin panel.</p>
        </div>
      </div>
    `,
  });
}
