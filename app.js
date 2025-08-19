const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Use environment variable OR fallback placeholder
const mongoURI = process.env.MONGODB_URI || "your-mongodb-uri-here";

mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("MongoDB Error:", err));

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

app.use(session({
  secret: process.env.SESSION_SECRET || "your-session-secret-here",
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: mongoURI }) // persist sessions
}));

// Routes
app.use('/flags', require('./routes/flags'));
app.use('/auth', require('./routes/auth'));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
