const mongoose = require('mongoose');

const kudoItemSchema = new mongoose.Schema({
  from: {
    uid: String,
    name: String,
    avatar: String
  },
  to: { type: String, required: true },
  message: { type: String, required: true },
  badge: { type: String, default: '' },
  votes: { type: Number, default: 0 },
  voters: [{
    uid: String,
    name: String
  }]
}, { timestamps: true });

const kudosBoardSchema = new mongoose.Schema({
  sprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', required: true },
  title: { type: String, default: 'Mural de Kudos' },
  introduction: { type: String, default: 'Reconheça e celebre as conquistas da sua equipe nesta Sprint!' },
  backgroundImage: { type: String, default: '' },
  kudos: [kudoItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('KudosBoard', kudosBoardSchema);
