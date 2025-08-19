const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: String,
  challengeId: String,
  submittedFlag: String,
  isCorrect: Boolean,
  timestamp: Date
});

module.exports = mongoose.model('Player', playerSchema);
