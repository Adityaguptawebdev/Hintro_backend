const TelegramBot = require('node-telegram-bot-api');
const logger = require('../../utils/logger');

let bot = null;

const getBot = () => {
  if (!bot && process.env.TELEGRAM_BOT_TOKEN) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
  }
  return bot;
};

const sendMessage = async (chatId, text, options = {}) => {
  const instance = getBot();
  if (!instance) {
    logger.warn('Telegram bot not configured');
    return null;
  }
  try {
    return await instance.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      ...options,
    });
  } catch (err) {
    logger.error('Telegram send failed', { chatId, error: err.message });
    throw err;
  }
};

const sendMeetingReminder = (chatId, meeting) =>
  sendMessage(
    chatId,
    `*Meeting Reminder* 🗓\n\n*${meeting.title}*\nScheduled: ${new Date(meeting.scheduledAt).toLocaleString()}\n${meeting.meetingUrl ? `[Join Meeting](${meeting.meetingUrl})` : ''}`
  );

const sendActionItemAlert = (chatId, item) =>
  sendMessage(
    chatId,
    `*Action Item ${item.isOverdue ? 'Overdue ⚠️' : 'Due Soon 🔔'}*\n\n${item.title}\nDue: ${new Date(item.dueDate).toLocaleDateString()}`
  );

const TYPE_EMOJI = {
  insight_ready: '✨',
  transcript_processed: '📝',
  meeting_reminder: '🗓',
  action_item_overdue: '⚠️',
  action_item_due: '🔔',
};

const sendNotification = (chatId, { type, title, body, meeting }) => {
  const emoji = TYPE_EMOJI[type] ?? '🔔';
  const meetingLine = meeting?.title ? `\n*Meeting:* ${meeting.title}` : '';
  return sendMessage(chatId, `*${emoji} ${title}*${meetingLine}\n\n${body}`);
};

module.exports = { sendMessage, sendMeetingReminder, sendActionItemAlert, sendNotification };
