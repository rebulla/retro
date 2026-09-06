const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = require('./src/models/User');
  const users = await User.find({});
  console.log(users.map(u => ({ email: u.email, globalRole: u.globalRole })));
  process.exit();
}).catch(console.error);
