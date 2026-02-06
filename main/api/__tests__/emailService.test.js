function base64UrlDecode(input) {
  const b64 = String(input)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padLen = (4 - (b64.length % 4)) % 4;
  const padded = b64 + '='.repeat(padLen);
  return Buffer.from(padded, 'base64').toString('utf8');
}

describe('emailService', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  function setup({ sendImpl, listPages, getImpl, configOverride } = {}) {
    jest.doMock('../config', () => {
      return {
        config: {
          quotaLimit: 1200000,
          requestsPerEmail: 1,
          ...configOverride,
        },
      };
    });

    const send = jest.fn();
    const list = jest.fn();
    const get = jest.fn();

    if (sendImpl) send.mockImplementation(sendImpl);
    else send.mockResolvedValue({ data: { id: 'msg-1' } });

    if (Array.isArray(listPages) && listPages.length) {
      list.mockImplementation(async () => listPages.shift());
    } else {
      list.mockResolvedValue({ data: { messages: [], nextPageToken: undefined } });
    }

    if (getImpl) get.mockImplementation(getImpl);
    else get.mockResolvedValue({ data: { snippet: '' } });

    const gmail = {
      users: {
        messages: { send, list, get },
      },
    };

    const getGmailClient = jest.fn(() => gmail);

    jest.doMock('../services/googleAuth', () => {
      return { getGmailClient };
    });

    const fs = require('fs');
    jest.spyOn(fs, 'appendFileSync').mockImplementation(() => {});

    return { getGmailClient, gmail, send, list, get, fs };
  }

  test('createMimeMessage encode en base64url et contient les headers', async () => {
    setup();
    const { createMimeMessage } = require('../services/emailService');

    const raw = createMimeMessage('to@example.com', 'from@example.com', 'Hello', '<b>Hi</b>');

    expect(raw).not.toMatch(/[+/=]/);
    const decoded = base64UrlDecode(raw);

    expect(decoded).toContain('To: to@example.com');
    expect(decoded).toContain('From: from@example.com');
    expect(decoded).toContain('Subject: Hello');
    expect(decoded).toContain('<b>Hi</b>');
  });

  test('sendEmail appelle Gmail API et log', async () => {
    const { send, fs } = setup();

    const emailService = require('../services/emailService');
    const result = await emailService.sendEmail(
      'sender@example.com',
      'to@example.com',
      'Sub',
      '<p>Body</p>'
    );

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toMatchObject({
      userId: 'me',
      requestBody: { raw: expect.any(String) },
    });

    expect(fs.appendFileSync).toHaveBeenCalled();
    expect(result).toMatchObject({ id: 'msg-1' });
  });

  test('sendBulkEmails rotate les senders et appelle onProgress', async () => {
    const { getGmailClient } = setup();

    const emailService = require('../services/emailService');

    const onProgress = jest.fn();
    const res = await emailService.sendBulkEmails(
      ['s1@example.com', 's2@example.com'],
      ['r1@example.com', 'r2@example.com', 'r3@example.com'],
      'Sub',
      'Body',
      onProgress
    );

    // requestsPerEmail=1 => sender rotate à chaque envoi
    expect(getGmailClient.mock.calls.map((c) => c[0])).toEqual([
      's1@example.com',
      's2@example.com',
      's1@example.com',
    ]);

    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(res).toEqual({ sentCount: 3, total: 3 });
  });

  test('sendBulkEmails continue en cas d\'erreur et marque ok=false', async () => {
    const sendImpl = jest
      .fn()
      .mockResolvedValueOnce({ data: { id: '1' } })
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce({ data: { id: '3' } });

    setup({ sendImpl: (...args) => sendImpl(...args) });
    const emailService = require('../services/emailService');

    const onProgress = jest.fn();
    const res = await emailService.sendBulkEmails(
      ['s1@example.com'],
      ['r1@example.com', 'r2@example.com', 'r3@example.com'],
      'Sub',
      'Body',
      onProgress
    );

    const oks = onProgress.mock.calls.map((c) => c[0].ok);
    expect(oks).toEqual([true, false, true]);
    expect(res).toEqual({ sentCount: 2, total: 3 });
  });

  test('getBouncedEmails retourne une liste unique', async () => {
    const page1 = { data: { messages: [{ id: 'm1' }, { id: 'm2' }], nextPageToken: 't2' } };
    const page2 = { data: { messages: [{ id: 'm3' }], nextPageToken: undefined } };

    const getImpl = jest
      .fn()
      .mockResolvedValueOnce({ data: { snippet: 'Delivery to user1@example.com failed' } })
      .mockResolvedValueOnce({ data: { snippet: 'again user1@example.com' } })
      .mockResolvedValueOnce({ data: { snippet: 'blocked user2@example.com' } });

    setup({ listPages: [page1, page2], getImpl: (...args) => getImpl(...args) });

    const emailService = require('../services/emailService');
    const bounced = await emailService.getBouncedEmails('sender@example.com');

    expect(bounced.sort()).toEqual(['user1@example.com', 'user2@example.com']);
  });
});
