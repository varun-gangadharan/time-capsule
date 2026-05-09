import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_APP_URL = "https://varcapsule.xyz";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return Response.json({ error: "RESEND_API_KEY not configured" }, { status: 500, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY_VALUE");
  const authorization = req.headers.get("Authorization");
  if (!supabaseAnonKey || !authorization) {
    return Response.json({ error: "Missing auth configuration" }, { status: 401, headers: corsHeaders });
  }

  const { capsuleId } = await req.json().catch(() => ({ capsuleId: null }));
  if (!capsuleId || typeof capsuleId !== "string") {
    return Response.json({ error: "capsuleId is required" }, { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });

  const { data: capsule, error } = await supabase
    .from("capsules")
    .select("id, title, open_date, share_token, shared_with_email")
    .eq("id", capsuleId)
    .single();

  if (error || !capsule) {
    return Response.json({ error: "Capsule not found or not authorized" }, { status: 404, headers: corsHeaders });
  }

  if (!capsule.share_token || !capsule.shared_with_email) {
    return Response.json({ error: "Capsule has not been shared with an email" }, { status: 400, headers: corsHeaders });
  }

  const appUrl = getAppUrl();
  const sharedLink = `${appUrl}/shared/${capsule.share_token}`;
  const openDate = capsule.open_date
    ? new Date(`${capsule.open_date}T00:00:00`).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "its unlock date";

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: Deno.env.get("EMAIL_FROM") ?? "Memory Capsule <notifications@resend.dev>",
      to: capsule.shared_with_email,
      subject: "A time capsule was shared with you",
      html: buildShareInviteHtml({
        title: capsule.title,
        openDate,
        sharedLink,
      }),
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Resend send-share-invite failed", {
      status: res.status,
      body: errorText.slice(0, 1000),
    });
    return Response.json(
      { sent: false, error: errorText.slice(0, 500) },
      { status: 200, headers: corsHeaders }
    );
  }

  return Response.json({ sent: true }, { headers: corsHeaders });
});

function getAppUrl(): string {
  return (Deno.env.get("APP_URL") ?? DEFAULT_APP_URL).replace(/\/+$/, "");
}

function buildShareInviteHtml({
  title,
  openDate,
  sharedLink,
}: {
  title: string;
  openDate: string;
  sharedLink: string;
}): string {
  const safeTitle = escapeHtml(title);
  const safeOpenDate = escapeHtml(openDate);
  const safeLink = escapeHtml(sharedLink);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f0eaff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#fffef8;border:3px solid #222;border-radius:12px;box-shadow:4px 4px 0 #222;">
        <tr>
          <td style="background:linear-gradient(135deg,#ffd6e8,#c1f0c1);border-bottom:3px solid #222;border-radius:9px 9px 0 0;padding:20px 30px;">
            <span style="font-size:22px;font-weight:800;color:#222;letter-spacing:0.5px;">Memory Capsule</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 30px;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#222;">Someone shared a capsule with you.</p>
            <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
              <strong>&ldquo;${safeTitle}&rdquo;</strong> unlocks on ${safeOpenDate}. Verify this email address to view it.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:linear-gradient(to bottom,#c1f0c1,#7de6a8);border:2.5px solid #222;border-radius:8px;box-shadow:3px 3px 0 #222;">
                  <a href="${safeLink}" target="_blank"
                     style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:800;color:#222;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">
                    View Capsule
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 30px;border-top:2px dashed #ddd;">
            <p style="margin:0;font-size:12px;color:#999;line-height:1.5;">
              This private invite only works for the email address that received it.
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
