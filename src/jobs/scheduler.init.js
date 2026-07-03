const cron = require('node-cron');
const logger = require('../utils/logger');
const { runMeetingReminderJob } = require('./reminder.job');
const { runOverdueDetectionJob } = require('./overdue.job');

const initScheduler = () => {
  // Meeting reminders – every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    logger.info('[Scheduler] Running meeting reminder job');
    await runMeetingReminderJob().catch((err) =>
      logger.error('[Scheduler] Reminder job failed', { error: err.message })
    );
  });

  // Overdue detection – every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    logger.info('[Scheduler] Running overdue detection job');
    await runOverdueDetectionJob().catch((err) =>
      logger.error('[Scheduler] Overdue job failed', { error: err.message })
    );
  });

  logger.info('[Scheduler] All jobs registered');
};

module.exports = { initScheduler };
