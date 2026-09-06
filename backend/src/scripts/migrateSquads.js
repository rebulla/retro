require('dotenv').config();
const mongoose = require('mongoose');
const Squad = require('../models/Squad');
const User = require('../models/User');
const Sprint = require('../models/Sprint');
const PokerRoom = require('../models/PokerRoom');
const RetrospectiveBoard = require('../models/RetrospectiveBoard');
const KudosBoard = require('../models/KudosBoard');
const Kudo = require('../models/Kudo');

async function runMigration() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Create Default Squad
    let defaultSquad = await Squad.findOne({ name: 'Squad Padrão' });
    if (!defaultSquad) {
      defaultSquad = await Squad.create({ name: 'Squad Padrão', description: 'Squad gerada automaticamente para os dados legados' });
      console.log('Created Default Squad:', defaultSquad._id);
    } else {
      console.log('Default Squad already exists:', defaultSquad._id);
    }

    // 2. Update Users
    const users = await User.find({ status: { $exists: false } }); // users without status are legacy
    for (let user of users) {
      user.status = 'approved';
      user.globalRole = user.role === 'admin' ? 'admin' : 'user';
      if (!user.squads || user.squads.length === 0) {
        user.squads = [{ squad: defaultSquad._id, role: 'admin' }];
      }
      await user.save();
      console.log(`Updated legacy user ${user.email}`);
    }

    // 3. Update Resources
    const resources = [
      { model: Sprint, name: 'Sprints' },
      { model: PokerRoom, name: 'Poker Rooms' },
      { model: RetrospectiveBoard, name: 'Retrospective Boards' },
      { model: KudosBoard, name: 'Kudos Boards' },
      { model: Kudo, name: 'Kudos' }
    ];

    for (const { model, name } of resources) {
      const result = await model.updateMany(
        { squadId: { $exists: false } },
        { $set: { squadId: defaultSquad._id } }
      );
      console.log(`Migrated ${result.modifiedCount} ${name}`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
