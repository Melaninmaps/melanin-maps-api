# Mapping With Melanin™ — Founder Notification & Tester Group Monitoring
**Prepared by:** Manus AI
**Date:** August 11, 2026
**For:** Replit Engineering Team
**Priority:** CRITICAL — Non-negotiable requirement before tester group launch.

---

## The Requirement

The platform will have approximately 30 testers across the United States and in Phuket, Thailand. When anything breaks — KinfolkAI, the business search, the safety hub, or any core feature — **the founder must be notified first and immediately.** Not after Replit investigates. Not after a ticket is filed. The founder gets the alert at the same moment Replit does, or before.

This is not optional. The founder is running a live tester group and a campaign simultaneously. A silent failure during this window is a trust failure with real users.

---

## 1. Founder Alert Configuration

### For the UptimeRobot (or equivalent) Monitor:
When configuring the uptime monitor for `/api/health/kinfolk` and any other health check endpoints, add the founder's contact information as the **primary alert recipient**, not a secondary one.

Alert configuration must be:
- **Alert 1 (Primary):** Founder's email — immediate, every failure
- **Alert 2 (Primary):** Founder's phone number — SMS alert on every failure
- **Alert 3 (Secondary):** Replit team Slack/email

The founder must receive the same alert at the same time as the engineering team. There is no "we'll investigate and then tell the founder" workflow. The founder is notified simultaneously.

### Alert Message Format:
The alert message must be clear and actionable, not technical jargon:

```
🚨 MWM ALERT — KinfolkAI is DOWN
Time: [timestamp]
Status: [error message]
Affected: All users including ~30 active testers (US + Phuket)
Action required: Replit team notified. Expected response: 15 minutes.
Monitor: [link to uptime dashboard]
```

---

## 2. What Must Be Monitored

With 30 testers active across multiple time zones (US and Phuket, which is UTC+7), the monitoring must cover all hours — not just business hours. Configure all monitors to run 24/7 with no maintenance windows during the tester period.

The following endpoints must each have their own monitor:

| Monitor | Endpoint | Check Interval | Alert Threshold |
|---|---|---|---|
| KinfolkAI Backend | `/api/health/kinfolk` | Every 5 minutes | 1 failure = alert |
| Homepage Load | `/` | Every 5 minutes | 2 consecutive failures = alert |
| Business Search API | `/api/businesses/search?q=test` | Every 10 minutes | 1 failure = alert |
| Authentication | `/api/auth/status` | Every 10 minutes | 1 failure = alert |
| Safety Hub | `/safety` | Every 15 minutes | 2 consecutive failures = alert |

KinfolkAI and Business Search have the lowest tolerance (1 failure = immediate alert) because these are the two features testers will use most.

---

## 3. The Tester Experience — What Happens When Something Breaks

When a monitor triggers an alert, the following sequence must happen automatically:

**Within 0 minutes:** Founder receives SMS and email alert simultaneously with Replit team.

**Within 15 minutes:** Replit must acknowledge the alert to the founder — either confirming they are investigating or confirming the fix is already deployed.

**Within 60 minutes:** The issue must be resolved or the founder must receive a status update explaining the delay and the expected resolution time.

**When resolved:** The founder receives a resolution notification: *"KinfolkAI is back online. Downtime: [X minutes]. Root cause: [brief explanation]. Prevention: [what was done to prevent recurrence]."*

---

## 4. In-App Tester Feedback Channel

With 30 testers active, you need a direct line from testers to the founder when something feels wrong — even if the monitors don't catch it (e.g., a feature that works but returns wrong results).

Implement a simple in-app feedback mechanism for the tester group:
- A "Report an Issue" button accessible from every page (can be the existing Beta Feedback button, but it must route directly to the founder's email, not just a general inbox)
- The report must automatically include: the page the user was on, the action they were taking, their user ID, and a timestamp
- The founder receives these reports directly

---

## 5. Replit's Obligation During the Tester Period

Replit must commit to the following during the active tester period:

1. **Response time:** Any alert acknowledged within 15 minutes, 24 hours a day, 7 days a week, for the duration of the tester group period.
2. **No unannounced deployments:** Any deployment during the tester period must be announced to the founder at least 30 minutes in advance, with a rollback plan ready.
3. **Daily status check:** Each morning during the tester period, Replit sends the founder a one-line status: *"All systems operational"* or *"[Issue] detected and resolved at [time]."*
4. **Founder is never the last to know:** If a tester reports an issue before the monitors catch it, Replit must acknowledge the founder's report within 15 minutes.

---

## Summary

You have 30 real people — some of them in Phuket right now, some across the US — who are going to test this platform and form their first impression of it. If KinfolkAI goes down and nobody tells you for hours, those testers have a broken experience and you have no way to respond. The monitoring system described in the previous brief catches the technical failure. This brief ensures you are always the first person who knows about it.
