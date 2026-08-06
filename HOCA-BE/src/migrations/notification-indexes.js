const Notification = require('../models/Notification');

async function migrateNotificationIndexes() {
  const indexName = 'user_1_data.reminderKey_1';
  const indexes = await Notification.collection.indexes();
  const existing = indexes.find((index) => index.name === indexName);
  if (existing?.sparse || (existing && !existing.partialFilterExpression)) {
    await Notification.collection.dropIndex(indexName);
  }
  await Notification.createIndexes();
}

module.exports = migrateNotificationIndexes;
