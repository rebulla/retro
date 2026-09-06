const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  columnId: { type: mongoose.Schema.Types.ObjectId, required: true },
  text: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  votes: { type: Number, default: 0 },
  voters: [{
    uid: String,
    name: String
  }]
});

const retrospectiveBoardSchema = new mongoose.Schema({
  squadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Squad' },
  sprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', required: true },
  title: { type: String, default: 'Retrospectiva' },
  backgroundImage: { type: String, default: '' },
  status: { type: String, enum: ['waiting', 'active'], default: 'waiting' },
  columns: [{ 
    name: { type: String, required: true }, 
    description: { type: String, default: '' },
    color: { type: String } 
  }],
  cards: [cardSchema]
}, { timestamps: true });

module.exports = mongoose.model('RetrospectiveBoard', retrospectiveBoardSchema);
