const Meeting = require('../models/Meeting.model');
const Notification = require('../models/Notification.model');
const telegramClient = require('../integrations/telegram/telegram.client');
const slackClient = require('../integrations/slack/slack.client');
const emailClient = require('../integrations/email/email.client');
const logger = require('../utils/logger');

const MAX_LEAD_TIME_HOURS = 48; // covers all possible user preferences

const runMeetingReminderJob = async () => {
  const now = new Date();
  const to = new Date(Date.now() + MAX_LEAD_TIME_HOURS * 60 * 60 * 1000);

  const meetings = await Meeting.find({
    status: 'scheduled',
    scheduledAt: { $gte: now, $lte: to },
    reminderSentAt: null,
  }).populate('owner', 'name email integrations preferences');

  logger.info(`[ReminderJob] Found ${meetings.length} upcoming meetings within ${MAX_LEAD_TIME_HOURS}h`);

  for (const meeting of meetings) {
    const { owner } = meeting;

    // Respect each user's preferred lead time
    const leadTimeHours = owner.preferences?.reminderLeadTimeHours ?? 24;
    const userWindow = new Date(Date.now() + leadTimeHours * 60 * 60 * 1000);
    if (meeting.scheduledAt > userWindow) {
      logger.info(`[ReminderJob] Skipping ${meeting._id} — outside user's ${leadTimeHours}h window`);
      continue;
    }

    const channels = { inApp: {}, telegram: {}, slack: {} };

    try {
      const scheduledStr = new Date(meeting.scheduledAt).toLocaleString();

      // In-app notification
      await Notification.create({
        recipient: owner._id,
        type: 'meeting_reminder',
        title: 'Meeting Reminder',
        body: `"${meeting.title}" starts at ${scheduledStr}`,
        relatedMeeting: meeting._id,
        channels: { inApp: { sent: true, sentAt: now } },
      });
      channels.inApp = { sent: true, sentAt: now };

      // Telegram
      if (owner.preferences?.notifyViaTelegram && owner.integrations?.telegram?.isConnected) {
        await telegramClient.sendMeetingReminder(owner.integrations.telegram.chatId, meeting);
        channels.telegram = { sent: true, sentAt: new Date() };
      }

      // Slack
      if (owner.preferences?.notifyViaSlack && owner.integrations?.slack?.isConnected) {
        await slackClient.sendMeetingReminder(owner.integrations.slack.channelId, meeting);
        channels.slack = { sent: true, sentAt: new Date() };
      }

      // Email
      if (owner.preferences?.notifyViaEmail && owner.email) {
        try {
          await emailClient.sendNotification(owner.email, {
            type: 'meeting_reminder',
            title: 'Meeting Reminder',
            body: `"${meeting.title}" is scheduled for ${scheduledStr}.${meeting.meetingUrl ? ` Join here: ${meeting.meetingUrl}` : ''}`,
            recipientName: owner.name,
          });
        } catch (emailErr) {
          logger.error('[ReminderJob] Email failed', { meetingId: meeting._id, error: emailErr.message });
        }
      }

      await Meeting.findByIdAndUpdate(meeting._id, { reminderSentAt: new Date() });
      logger.info(`[ReminderJob] Reminder sent for meeting ${meeting._id}`);
    } catch (err) {
      logger.error(`[ReminderJob] Failed for meeting ${meeting._id}`, { error: err.message });
    }
  }
};

module.exports = { runMeetingReminderJob };
