jest.mock('../../../src/models/ActionItem.model');
jest.mock('../../../src/models/Notification.model');
jest.mock('../../../src/integrations/telegram/telegram.client');

const ActionItem = require('../../../src/models/ActionItem.model');
const Notification = require('../../../src/models/Notification.model');
const telegramClient = require('../../../src/integrations/telegram/telegram.client');
const { runOverdueDetectionJob } = require('../../../src/jobs/overdue.job');

const makeItem = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  title: 'Write release notes',
  status: 'pending',
  dueDate: new Date('2024-01-01'),
  owner: {
    _id: '507f1f77bcf86cd799439012',
    integrations: { telegram: { chatId: '12345', isConnected: false } },
    preferences: { notifyViaTelegram: false },
  },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  ActionItem.findByIdAndUpdate = jest.fn().mockResolvedValue({});
  Notification.create = jest.fn().mockResolvedValue({});
  Notification.findOneAndUpdate = jest.fn().mockResolvedValue({});
  telegramClient.sendMessage = jest.fn().mockResolvedValue({ message_id: 99 });
});

describe('Overdue Detection Job', () => {
  it('marks items overdue and creates in-app notification', async () => {
    ActionItem.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue([makeItem()]),
    });

    await runOverdueDetectionJob();

    expect(ActionItem.findByIdAndUpdate).toHaveBeenCalledWith(
      makeItem()._id,
      expect.objectContaining({ isOverdue: true })
    );
    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'action_item_overdue' })
    );
  });

  it('sends Telegram alert when user has Telegram enabled', async () => {
    const item = makeItem({
      owner: {
        _id: '507f1f77bcf86cd799439012',
        integrations: { telegram: { chatId: '12345', isConnected: true } },
        preferences: { notifyViaTelegram: true },
      },
    });

    ActionItem.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue([item]),
    });

    await runOverdueDetectionJob();

    expect(telegramClient.sendMessage).toHaveBeenCalledWith(
      '12345',
      expect.stringContaining('Write release notes')
    );
  });

  it('does NOT send Telegram when user has Telegram disabled', async () => {
    ActionItem.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue([makeItem()]),
    });

    await runOverdueDetectionJob();

    expect(telegramClient.sendMessage).not.toHaveBeenCalled();
  });

  it('continues processing remaining items when one fails', async () => {
    const item1 = makeItem({ _id: 'aaa' });
    const item2 = makeItem({ _id: 'bbb' });

    ActionItem.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue([item1, item2]),
    });

    ActionItem.findByIdAndUpdate = jest
      .fn()
      .mockRejectedValueOnce(new Error('DB error'))
      .mockResolvedValueOnce({});

    await expect(runOverdueDetectionJob()).resolves.not.toThrow();
    expect(Notification.create).toHaveBeenCalledTimes(1);
  });
});
