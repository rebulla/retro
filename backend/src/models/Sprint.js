const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema({
  squadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Squad' }, // Note: we'll make this required later after migration
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  theme: { type: String },
  backgroundImage: { type: String },
  themeResponsible: { type: mongoose.Schema.Types.Mixed },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Sprint', sprintSchema);
