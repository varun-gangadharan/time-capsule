import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_URL = "https://api.resend.com/emails";

Deno.serve(async (req) => {
  // Auth: verify via a shared secret stored in CRON_SECRET env var.
  // The anon JWT gets the request past the Supabase gateway;
  // this header check ensures only our cron job (or manual test) can trigger processing.
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== cronSecret) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return Response.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // --- Fetch pending + retryable failed notifications ---
  const { data: notifications, error: fetchErr } = await supabase
    .from("notification_queue")
    .select("id, capsule_id, user_id, attempts")
    .or("status.eq.pending,and(status.eq.failed,attempts.lt.3)")
    .limit(50);

  if (fetchErr) {
    return Response.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!notifications || notifications.length === 0) {
    return Response.json({ processed: 0, sent: 0, failed: 0 });
  }

  // --- Fetch capsule titles for email ---
  const capsuleIds = [...new Set(notifications.map((n) => n.capsule_id))];
  const { data: capsules } = await supabase
    .from("capsules")
    .select("id, title, created_at")
    .in("id", capsuleIds);

  const capsuleMap = new Map(
    (capsules ?? []).map((c) => [c.id, { title: c.title, createdAt: c.created_at }])
  );

  // --- Process each notification ---
  let sent = 0;
  let failed = 0;

  for (const notif of notifications) {
    // Look up user email
    const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(notif.user_id);
    if (userErr || !userData?.user?.email) {
      await markFailed(supabase, notif, "No email found for user");
      failed++;
      continue;
    }

    const email = userData.user.email;
    const capsule = capsuleMap.get(notif.capsule_id);
    const title = capsule?.title ?? "Untitled";
    const createdAt = capsule?.createdAt
      ? new Date(capsule.createdAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "a while ago";

    // Send via Resend
    const appUrl = Deno.env.get("APP_URL") ?? supabaseUrl.replace(".supabase.co", ".vercel.app");
    const capsuleLink = `${appUrl}/capsules/${notif.capsule_id}`;

    try {
      const res = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: Deno.env.get("EMAIL_FROM") ?? "Memory Capsule <notifications@resend.dev>",
          to: email,
          subject: "Future you has mail",
          html: buildEmailHtml({ title, createdAt, capsuleLink }),
        }),
      });

      if (res.ok) {
        await supabase
          .from("notification_queue")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", notif.id);
        sent++;
      } else {
        const errText = await res.text();
        await markFailed(supabase, notif, errText);
        failed++;
      }
    } catch (err) {
      await markFailed(supabase, notif, String(err));
      failed++;
    }
  }

  return Response.json({ processed: notifications.length, sent, failed });
});

// --- Helpers ---

async function markFailed(
  supabase: ReturnType<typeof createClient>,
  notif: { id: number; attempts: number },
  error: string
) {
  await supabase
    .from("notification_queue")
    .update({
      status: "failed",
      attempts: notif.attempts + 1,
      last_error: error.slice(0, 500),
    })
    .eq("id", notif.id);
}

function buildEmailHtml({
  title,
  createdAt,
  capsuleLink,
}: {
  title: string;
  createdAt: string;
  capsuleLink: string;
}): string {
  // Escape HTML entities in user content
  const safeTitle = escapeHtml(title);
  const safeDate = escapeHtml(createdAt);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f0eaff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#fffef8;border:3px solid #222;border-radius:12px;box-shadow:4px 4px 0 #222;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#c1f0c1,#a8e6cf);border-bottom:3px solid #222;border-radius:9px 9px 0 0;padding:20px 30px;">
            <span style="font-size:22px;font-weight:800;color:#222;letter-spacing:0.5px;">
              &#x1f4ec; Memory Capsule
            </span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 30px;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#222;">
              A capsule from past-you has arrived.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
              You sealed <strong>&ldquo;${safeTitle}&rdquo;</strong> on ${safeDate}.
              The wait is over &mdash; it&rsquo;s time to see what you wrote.
            </p>

            <!-- CTA Button -->
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:linear-gradient(to bottom,#c1f0c1,#7de6a8);border:2.5px solid #222;border-radius:8px;box-shadow:3px 3px 0 #222;">
                  <a href="${capsuleLink}" target="_blank"
                     style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:800;color:#222;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">
                    Open Your Capsule
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 30px;border-top:2px dashed #ddd;">
            <p style="margin:0;font-size:12px;color:#999;line-height:1.5;">
              You&rsquo;re receiving this because a capsule you sealed has reached its open date.
              You can turn off email reminders in your
              <a href="${capsuleLink.split('/capsules/')[0]}/settings" style="color:#999;">Settings</a>.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
