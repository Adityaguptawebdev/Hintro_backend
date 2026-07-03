const ActionItem = require('../models/ActionItem.model');
const Notification = require('../models/Notification.model');
const telegramClient = require('../integrations/telegram/telegram.client');
const emailClient = require('../integrations/email/email.client');
const logger = require('../utils/logger');

const buildOverdueMessage = (item) =>
  `🚨 *Overdue Task Reminder*\n\nTask: ${item.title}\nStatus: ${item.status.toUpperCase()}\nDue: ${item.dueDate.toLocaleDateString()}`;

const runOverdueDetectionJob = async () => {
  const now = new Date();

  const overdueItems = await ActionItem.find({
    status: { $in: ['pending', 'in_progress'] },
    dueDate: { $lt: now },
    isOverdue: false,
  }).populate('owner', 'name email integrations preferences');

  logger.info(`[OverdueJob] Detected ${overdueItems.length} newly overdue items`);

  for (const item of overdueItems) {
    try {
      await ActionItem.findByIdAndUpdate(item._id, {
        isOverdue: true,
        overdueDetectedAt: now,
      });

      const channelUpdate = { inApp: { sent: true, sentAt: now } };

      await Notification.create({
        recipient: item.owner._id,
        type: 'action_item_overdue',
        title: 'Action Item Overdue',
        body: `"${item.title}" was due on ${item.dueDate.toLocaleDateString()}`,
        relatedActionItem: item._id,
        channels: channelUpdate,
      });

      // Send Telegram alert when the user has Telegram connected
      const telegramChatId = item.owner?.integrations?.telegram?.chatId;
      const telegramEnabled = item.owner?.integrations?.telegram?.isConnected;
      const notifyViaTelegram = item.owner?.preferences?.notifyViaTelegram;

      if (telegramChatId && telegramEnabled && notifyViaTelegram) {
        try {
          const msg = await telegramClient.sendMessage(telegramChatId, buildOverdueMessage(item));
          if (msg?.message_id) {
            await Notification.findOneAndUpdate(
              { relatedActionItem: item._id, recipient: item.owner._id, type: 'action_item_overdue' },
              { 'channels.telegram': { sent: true, sentAt: now, messageId: String(msg.message_id) } }
            );
          }
        } catch (telegramErr) {
          logger.error('[OverdueJob] Telegram alert failed', {
            itemId: item._id,
            chatId: telegramChatId,
            error: telegramErr.message,
          });
        }
      }

      if (item.owner?.preferences?.notifyViaEmail && item.owner?.email) {
        try {
          await emailClient.sendNotification(item.owner.email, {
            type: 'action_item_overdue',
            title: 'Action Item Overdue',
            body: `"${item.title}" was due on ${item.dueDate.toLocaleDateString()} and is now overdue.`,
            recipientName: item.owner.name,
          });
        } catch (emailErr) {
          logger.error('[OverdueJob] Email alert failed', { itemId: item._id, error: emailErr.message });
        }
      }
    } catch (err) {
      logger.error(`[OverdueJob] Failed for item ${item._id}`, { error: err.message });
    }
  }
};

module.exports = { runOverdueDetectionJob };
