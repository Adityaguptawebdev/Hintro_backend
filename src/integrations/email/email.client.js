const nodemailer = require('nodemailer');
const logger = require('../../utils/logger');

let transporter = null;

const getTransporter = () => {
  if (!transporter && process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
};

const TYPE_CONFIG = {
  insight_ready:        { emoji: '✨', color: '#f97316', label: 'AI Insights Ready' },
  transcript_processed: { emoji: '📝', color: '#3b82f6', label: 'Transcript Processed' },
  meeting_reminder:     { emoji: '🗓', color: '#f97316', label: 'Meeting Reminder' },
  action_item_overdue:  { emoji: '⚠️', color: '#ef4444', label: 'Action Item Overdue' },
  action_item_due:      { emoji: '🔔', color: '#f59e0b', label: 'Action Item Due Soon' },
};

const buildHtml = ({ type, title, body, recipientName }) => {
  const cfg = TYPE_CONFIG[type] ?? { emoji: '🔔', color: '#f97316', label: 'Notification' };

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#18181b;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;max-width:560px;width:100%;">

        <!-- Top accent bar -->
        <tr><td style="background:linear-gradient(90deg,${cfg.color},${cfg.color}99,transparent);height:3px;"></td></tr>

        <!-- Header -->
        <tr><td style="padding:32px 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="font-size:28px;font-weight:800;color:#f4f4f5;letter-spacing:-0.5px;">Hintro</span>
              </td>
              <td align="right">
                <span style="background:${cfg.color}22;color:${cfg.color};font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;border:1px solid ${cfg.color}44;">
                  ${cfg.emoji} ${cfg.label}
                </span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Divider -->
        <tr><td style="padding:0 32px;"><div style="height:1px;background:rgba(255,255,255,0.07);"></div></td></tr>

        <!-- Body -->
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 6px;font-size:13px;color:#71717a;">
            Hi ${recipientName ?? 'there'},
          </p>
          <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#f4f4f5;line-height:1.3;">
            ${title}
          </h1>
          <div style="background:#27272a;border-radius:10px;padding:16px 20px;border-left:3px solid ${cfg.color};">
            <p style="margin:0;font-size:14px;color:#a1a1aa;line-height:1.6;">${body}</p>
          </div>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 32px 28px;">
          <a href="${process.env.CLIENT_URL ?? 'http://localhost:5173'}/reminders"
             style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#f97316);color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none;">
            View Notifications →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.07);">
          <p style="margin:0;font-size:12px;color:#52525b;">
            You're receiving this because you enabled email notifications in Hintro.
            <br>Manage your preferences in
            <a href="${process.env.CLIENT_URL ?? 'http://localhost:5173'}/settings" style="color:${cfg.color};text-decoration:none;">Settings</a>.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

const sendNotification = async (toEmail, { type, title, body, recipientName }) => {
  const mail = getTransporter();
  if (!mail) {
    logger.warn('[Email] Not configured — set EMAIL_USER and EMAIL_APP_PASSWORD in .env');
    return null;
  }

  const cfg = TYPE_CONFIG[type] ?? { emoji: '🔔', label: 'Notification' };

  try {
    const info = await mail.sendMail({
      from: `"Hintro" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `${cfg.emoji} ${title}`,
      text: `${title}\n\n${body}\n\nView at: ${process.env.CLIENT_URL ?? 'http://localhost:5173'}/reminders`,
      html: buildHtml({ type, title, body, recipientName }),
    });
    logger.info('[Email] Notification sent', { to: toEmail, type, messageId: info.messageId });
    return info;
  } catch (err) {
    logger.error('[Email] Send failed', { to: toEmail, type, error: err.message });
    throw err;
  }
};

module.exports = { sendNotification };
