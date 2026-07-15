const crypto = require('crypto');
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const encodeBase32 = (buffer) => {
  let bits = '';
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');
  let output = '';
  for (let i = 0; i < bits.length; i += 5) output += ALPHABET[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  return output;
};
const decodeBase32 = (value) => {
  let bits = '';
  for (const char of String(value).replace(/=+$/,'').toUpperCase()) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) throw new Error('Invalid base32 secret');
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
};
const generateCode = (secret, time = Date.now()) => {
  const counter = Math.floor(time / 30000);
  const buffer = Buffer.alloc(8); buffer.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac('sha1', decodeBase32(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 15;
  const value = (digest.readUInt32BE(offset) & 0x7fffffff) % 1000000;
  return String(value).padStart(6, '0');
};
const verifyCode = (secret, code) => /^\d{6}$/.test(String(code)) && [-1,0,1].some((window) => {
  const expected = generateCode(secret, Date.now() + window * 30000);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(code)));
});
module.exports = { generateSecret: () => encodeBase32(crypto.randomBytes(20)), generateCode, verifyCode };
