/**
 * Transactional email, over Resend's REST API.
 *
 * Deliberately no SDK: one fetch to one endpoint is the whole integration, and it
 * keeps the serverless bundle small. Set on the Netlify site, never in a committed
 * dotenv file:
 *
 *   netlify env:set RESEND_API_KEY re_xxx
 *   netlify env:set ASTRANOVA_EMAIL_FROM "AstraNova <hello@astranova.uz>"
 *
 * Without a key nothing is sent and the message is logged instead, which is what
 * `next dev` wants: you click the link straight out of the terminal rather than
 * needing a real inbox to test a password reset.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

const FROM = process.env.ASTRANOVA_EMAIL_FROM ?? "AstraNova <hello@astranova.uz>";

/**
 * The origin that links in emails are built from.
 *
 * Deliberately NOT the request's Host header. A spoofed Host would otherwise mail a
 * live password-reset token to an attacker's domain, which turns a convenience
 * feature into an account-takeover vector. One copy of that rule, here.
 */
export function siteOrigin(request: Request): string {
  if (process.env.ASTRANOVA_SITE_URL) {
    return process.env.ASTRANOVA_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "production") return "https://astranova.uz";
  return new URL(request.url).origin;
}

export interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Send one email.
 *
 * Never throws. A failed send must not become a 500, because a 500 on "forgot
 * password" tells an attacker the address exists. Returns whether it actually went.
 */
export async function sendMail(mail: Mail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    console.warn(
      `[email] RESEND_API_KEY not set — not sending.\n` +
        `  to:      ${mail.to}\n` +
        `  subject: ${mail.subject}\n\n${mail.text}\n`,
    );
    return false;
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }),
    });

    if (!res.ok) {
      console.error(`[email] Resend rejected the send (${res.status}):`, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send failed:", err);
    return false;
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   The shell every AstraNova email is poured into.

   Table-based and inline-styled because mail clients are not browsers: Gmail
   strips <style> blocks, Outlook renders through Word, and flexbox does not
   exist in most of them. This looks like 2005 HTML on purpose.

   Dark by default to match the site, but with a light fallback: Gmail and
   Outlook will happily invert colours on their own, so the palette is chosen
   to survive that rather than to fight it.
   ───────────────────────────────────────────────────────────────────────── */

export function shell(opts: {
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  footnote?: string;
  footer: string;
}): string {
  const { heading, body, ctaLabel, ctaHref, footnote, footer } = opts;

  const cta =
    ctaLabel && ctaHref
      ? `<tr><td style="padding:8px 0 4px">
           <a href="${ctaHref}" style="display:inline-block;background:#6c6ed0;color:#ffffff;
              text-decoration:none;font-weight:700;font-size:15px;padding:13px 28px;
              border-radius:999px">${ctaLabel}</a>
         </td></tr>`
      : "";

  const note = footnote
    ? `<tr><td style="padding:18px 0 0;font-size:13px;line-height:1.6;color:#8e88b4">
         ${footnote}</td></tr>`
    : "";

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f3f9">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f9;padding:32px 16px">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="max-width:520px;background:#0e0d1c;border-radius:18px;padding:36px 32px">

      <tr><td style="padding-bottom:22px">
        <span style="font-size:21px;font-weight:800;color:#ffffff;letter-spacing:-.02em">
          Astra<span style="color:#9a92f5">Nova</span></span>
      </td></tr>

      <tr><td style="font-size:23px;line-height:1.25;font-weight:700;color:#ffffff;padding-bottom:14px">
        ${heading}</td></tr>

      <tr><td style="font-size:15px;line-height:1.65;color:#c9c4e6;padding-bottom:22px">
        ${body}</td></tr>

      ${cta}
      ${note}

      <tr><td style="padding-top:26px;border-top:1px solid #262445;margin-top:8px"></td></tr>
      <tr><td style="padding-top:16px;font-size:12px;line-height:1.6;color:#6f6a96">
        ${footer}</td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}
