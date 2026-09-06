const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, sparse: true },
  googleId: { type: String }, // maintained for backward compatibility
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  globalRole: { type: String, enum: ['admin', 'user'], default: 'user' },
  squads: [{
    squad: { type: mongoose.Schema.Types.ObjectId, ref: 'Squad' },
    role: { type: String, enum: ['admin', 'dev', 'po', 'qa', 'scrum_master'], default: 'dev' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
