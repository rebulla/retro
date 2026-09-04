const mongoose = require('mongoose');

const kudoSchema = new mongoose.Schema({
  sprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', required: true },
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Kudo', kudoSchema);
