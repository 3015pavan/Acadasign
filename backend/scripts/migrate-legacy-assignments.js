#!/usr/bin/env node
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai';

(async function migrate() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db();
    const assignments = db.collection('assignments');

    const query = { $or: [{ userId: { $exists: false } }, { userId: null }, { userId: '' }] };
    const update = { $set: { legacyUnowned: true } };

    console.log('Running migration: flagging legacy assignments without userId...');
    const result = await assignments.updateMany(query, update);
    console.log(`Matched ${result.matchedCount}, modified ${result.modifiedCount}`);
    console.log('Migration complete. Legacy assignments are now flagged with `legacyUnowned: true`.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
})();
