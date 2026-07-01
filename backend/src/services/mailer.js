import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined
  });
  return transporter;
}

export async function sendInviteEmail({ to, inviterName, teamName, link }) {
  const subject = teamName ? `${inviterName} invited you to join ${teamName} on AURA` : `${inviterName} invited you to AURA`;
  const html = `
    <div style="font-family:sans-serif;line-height:1.5">
      <h2>You're invited to AURA</h2>
      <p><strong>${inviterName}</strong> has invited you${teamName ? ` to join the <strong>${teamName}</strong> team` : ''} on AURA.</p>
      <p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#2fb7a3;color:#07110f;text-decoration:none;border-radius:6px;font-weight:700">Accept invite</a></p>
      <p>Or paste this link in your browser:<br>${link}</p>
      <p style="color:#888;font-size:12px">This invite expires in 7 days.</p>
    </div>`;

  const client = getTransporter();

  if (!client) {
    // No SMTP configured — log so the dev can still test the flow end-to-end.
    console.log('\n[mailer] SMTP not configured. Invite link for', to, ':\n', link, '\n');
    return { delivered: false, link };
  }

  await client.sendMail({
    from: process.env.SMTP_FROM || 'AURA <no-reply@aura.app>',
    to,
    subject,
    html
  });
  return { delivered: true };
}
