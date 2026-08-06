const mongoose = require('mongoose');
const User = require('../src/models/User');

const uri = process.env.E2E_MONGODB_URI;
if (!uri) throw new Error('E2E_MONGODB_URI is required');
const databaseMatch = uri.match(/\/(?!\/)([^/?]+)(?:\?|$)/);
const databaseName = (databaseMatch?.[1] || '').toLowerCase();
if (!/(e2e|test)/.test(databaseName)) {
  throw new Error(`Refusing to seed non-test database: ${databaseName || '(default)'}`);
}

const password = process.env.E2E_PASSWORD || 'Hoca-E2E-2026!';
const runId = process.env.E2E_RUN_ID || Date.now().toString(36);

async function main() {
  await mongoose.connect(uri);
  await mongoose.connection.dropDatabase();
  const accounts = [
    { key: 'admin', role: 'ADMIN', email: `e2e-admin-${runId}@example.test` },
    { key: 'user', role: 'MEMBER', email: `e2e-user-${runId}@example.test` },
    { key: 'peer', role: 'MEMBER', email: `e2e-peer-${runId}@example.test` },
  ];
  for (const account of accounts) {
    await User.create({
      email: account.email,
      password,
      displayName: `E2E ${account.key}`,
      role: account.role,
      accountStatus: 'ACTIVE',
      subscriptionTier: 'LIFETIME',
      isOnboarded: true,
    });
  }
  process.stdout.write(JSON.stringify({ runId, password, accounts }));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
