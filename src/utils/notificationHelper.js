const Notification = require('../models/Notification.model');
const User = require('../models/User.model');
const telegramClient = require('../integrations/telegram/telegram.client');
const slackClient = require('../integrations/slack/slack.client');
const emailClient = require('../integrations/email/email.client');
const logger = require('./logger');

/**
 * Creates an in-app notification and delivers it to external channels
 * based on the user's preferences.
 */
const createAndDeliver = async ({ userId, type, title, body, relatedMeeting, meeting }) => {
  const channels = { inApp: { sent: true, sentAt: new Date() } };

  try {
    await Notification.create({
      recipient: userId,
      type,
      title,
      body,
      relatedMeeting,
      channels,
    });
  } catch (err) {
    logger.error(`[NotificationHelper] Failed to create in-app notification`, { userId, type, error: err.message });
    return;
  }

  // Fetch user preferences — only needed for external delivery
  let user;
  try {
    user = await User.findById(userId).lean();
  } catch {
    return;
  }
  if (!user) return;

  const prefs = user.preferences ?? {};
  const integrations = user.integrations ?? {};

  if (prefs.notifyViaTelegram && integrations.telegram?.isConnected) {
    try {
      await telegramClient.sendNotification(integrations.telegram.chatId, { type, title, body, meeting });
    } catch (err) {
      logger.error(`[NotificationHelper] Telegram delivery failed`, { userId, type, error: err.message });
    }
  }

  if (prefs.notifyViaSlack && integrations.slack?.isConnected) {
    try {
      await slackClient.sendNotification(integrations.slack.channelId, { type, title, body, meeting });
    } catch (err) {
      logger.error(`[NotificationHelper] Slack delivery failed`, { userId, type, error: err.message });
    }
  }

  if (prefs.notifyViaEmail && user.email) {
    try {
      await emailClient.sendNotification(user.email, { type, title, body, recipientName: user.name });
    } catch (err) {
      logger.error(`[NotificationHelper] Email delivery failed`, { userId, type, error: err.message });
    }
  }
};

module.exports = { createAndDeliver };
