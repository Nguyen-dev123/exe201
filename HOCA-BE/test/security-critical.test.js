const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const totp = require('../src/services/totp.service');
const subscriptions = require('../src/services/subscription.service');

test('TOTP accepts current code and rejects an incorrect code', () => {
  const secret = totp.generateSecret();
  assert.equal(totp.verifyCode(secret, totp.generateCode(secret)), true);
  assert.equal(totp.verifyCode(secret, '000000'), totp.generateCode(secret) === '000000');
});

test('all tiers can create unlimited rooms per day', () => {
  assert.equal(subscriptions.getTierLimits('FREE').roomsPerDay, Infinity);
  assert.equal(subscriptions.getTierLimits('MONTHLY').roomsPerDay, Infinity);
  assert.equal(subscriptions.getTierLimits('YEARLY').roomsPerDay, Infinity);
});

test('room microphone policy is enforced by tier and room type', () => {
  assert.equal(subscriptions.checkMicPermission({ subscriptionTier: 'FREE' }, { roomType: 'SILENT' }).canUseMic, false);
  assert.equal(subscriptions.checkMicPermission({ subscriptionTier: 'FREE' }, { roomType: 'DISCUSSION' }).canUseMic, false);
  assert.equal(subscriptions.checkMicPermission({ subscriptionTier: 'MONTHLY' }, { roomType: 'DISCUSSION' }).canUseMic, true);
});

test('release-critical routes and payment fallback remain fail-closed', () => {
  const root = path.join(__dirname, '..', 'src');
  const cronRoutes = fs.readFileSync(path.join(root, 'routes', 'cron.routes.js'), 'utf8');
  const payment = fs.readFileSync(path.join(root, 'services', 'payment.service.js'), 'utf8');
  const auth = fs.readFileSync(path.join(root, 'services', 'auth.service.js'), 'utf8');
  assert.doesNotMatch(cronRoutes, /fix-rooms-public|list-all-rooms|check-rooms-ownership/);
  assert.match(payment, /IS_PRODUCTION && !payOS/);
  assert.match(payment, /ACTIVE_PLAN_DUPLICATE/);
  assert.match(auth, /await sendVerificationEmail\(user, verificationCode\)/);
  assert.match(auth, /OTP_DELIVERY_FAILED/);
});

test('self-service billing endpoints remain user-scoped and refund requests are explicit', () => {
  const root = path.join(__dirname, '..', 'src');
  const routes = fs.readFileSync(path.join(root, 'routes', 'payment.routes.js'), 'utf8');
  const payment = fs.readFileSync(path.join(root, 'services', 'payment.service.js'), 'utf8');
  const transaction = fs.readFileSync(path.join(root, 'models', 'Transaction.js'), 'utf8');
  assert.match(routes, /transactions\/:transactionId\/receipt[^\n]+protect/);
  assert.match(routes, /transactions\/:transactionId\/retry[^\n]+protect/);
  assert.match(routes, /transactions\/:transactionId\/refund[^\n]+protect/);
  assert.match(payment, /_id: transactionId,\s*user: userId/);
  assert.match(payment, /refundStatus = 'REQUESTED'/);
  assert.match(transaction, /'NONE', 'REQUESTED', 'APPROVED', 'REJECTED', 'REFUNDED'/);
});
