const mongoose = require('mongoose');

const pokerRoomSchema = new mongoose.Schema({
  sprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint' },
  name: { type: String, required: true },
  facilitator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['waiting', 'voting', 'revealed'], default: 'waiting' },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vote: { type: String }
  }],
  averageVote: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('PokerRoom', pokerRoomSchema);
