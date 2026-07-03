const { WebClient } = require('@slack/web-api');
const logger = require('../../utils/logger');

let client = null;

const getClient = () => {
  if (!client && process.env.SLACK_BOT_TOKEN) {
    client = new WebClient(process.env.SLACK_BOT_TOKEN);
  }
  return client;
};

const postMessage = async (channel, blocks, text = '') => {
  const slack = getClient();
  if (!slack) {
    logger.warn('Slack client not configured');
    return null;
  }
  try {
    return await slack.chat.postMessage({ channel, blocks, text });
  } catch (err) {
    logger.error('Slack post failed', { channel, error: err.message });
    throw err;
  }
};

const buildMeetingReminderBlocks = (meeting) => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Meeting Reminder* :calendar:\n*${meeting.title}*\nScheduled: ${new Date(meeting.scheduledAt).toLocaleString()}`,
    },
  },
  ...(meeting.meetingUrl
    ? [{ type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: 'Join Meeting' }, url: meeting.meetingUrl, style: 'primary' }] }]
    : []),
];

const sendMeetingReminder = (channelId, meeting) =>
  postMessage(channelId, buildMeetingReminderBlocks(meeting), `Reminder: ${meeting.title}`);

const TYPE_EMOJI = {
  insight_ready: ':sparkles:',
  transcript_processed: ':memo:',
  meeting_reminder: ':calendar:',
  action_item_overdue: ':warning:',
  action_item_due: ':bell:',
};

const sendNotification = (channelId, { type, title, body, meeting }) => {
  const emoji = TYPE_EMOJI[type] ?? ':bell:';
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${emoji} ${title}*${meeting?.title ? `\n*Meeting:* ${meeting.title}` : ''}\n${body}`,
      },
    },
  ];
  return postMessage(channelId, blocks, title);
};

module.exports = { postMessage, sendMeetingReminder, sendNotification };
