require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      await mongoose.connection.collection('users').dropIndex('googleId_1');
      console.log('Index googleId_1 dropped successfully');
    } catch (e) {
      console.log('Error dropping index:', e.message);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
