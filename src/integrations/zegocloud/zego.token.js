const crypto = require('crypto');

// Implements ZEGOCLOUD's generateToken04 algorithm for server-side kit token generation.
// Ref: https://docs.zegocloud.com/article/15074
const generateToken04 = (appId, userId, serverSecret, effectiveTimeInSeconds, payload = '') => {
  const createTime = Math.floor(Date.now() / 1000);
  const expire = createTime + effectiveTimeInSeconds;

  const tokenInfo = {
    app_id: appId,
    user_id: userId,
    nonce: Math.floor(Math.random() * 2147483647),
    ctime: createTime,
    expire,
    payload,
  };

  const plaintext = Buffer.from(JSON.stringify(tokenInfo), 'utf8');
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(serverSecret.substring(0, 32), 'utf8');

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);

  // Wire format: expire(8B big-endian) | ivLen(2B) | iv | encLen(2B) | encrypted
  const buf = Buffer.alloc(8 + 2 + iv.length + 2 + encrypted.length);
  buf.writeBigInt64BE(BigInt(expire), 0);
  buf.writeUInt16BE(iv.length, 8);
  iv.copy(buf, 10);
  buf.writeUInt16BE(encrypted.length, 10 + iv.length);
  encrypted.copy(buf, 12 + iv.length);

  return '04' + buf.toString('base64');
};

const generateKitToken = (appId, serverSecret, roomId, userId, expiresInSec = 3600) => {
  const payload = JSON.stringify({
    room_id: roomId,
    privilege: { 1: 1, 2: 1 },
    stream_id_list: null,
  });
  return generateToken04(appId, userId, serverSecret, expiresInSec, payload);
};

module.exports = { generateKitToken };
