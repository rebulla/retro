const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  theme: { type: String },
  backgroundImage: { type: String },
  themeResponsible: { type: mongoose.Schema.Types.Mixed },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Sprint', sprintSchema);
