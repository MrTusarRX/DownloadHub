const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
   useNewUrlParser: true,
   useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
   .catch(err => console.log(err));

// Mod schema
const modSchema = new mongoose.Schema({
  _id: String,
  name: String,
  img: String,
  href: String,
  version: String,
  size: String,
  mod_info: String,
  game_link: String,
  game_update: Date,
  mymod_update: Date,
  img2: String,
  dis: String,
  gameinfo: [String]
});

const Mod = mongoose.model('Mod', modSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve HTML UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});



app.get('/mods', async (req, res) => {
  try {
    const mods = await Mod.find().sort({ mymod_update: -1 });
    res.json(mods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch mods' });
  }
});

//test dont worry about this

// Handle mod upload
app.post('/upload', async (req, res) => {
  const {
    id,
    name,
    img,
    href,
    version,
    size,
    mod_info,
    game_link,
    game_update,
    mymod_update,
    img2,
    dis,
    gameinfo
  } = req.body;

  // Parse dates with validation
  const parseDate = (dateString) => {
    if (!dateString) return new Date();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  const features = gameinfo ? gameinfo.split(',').map(item => item.trim()) : [];

  try {
    const mod = new Mod({
      _id: id,
      name,
      img,
      href,
      version,
      size,
      mod_info: mod_info || null,
      game_link,
      game_update: parseDate(game_update),
      mymod_update: parseDate(mymod_update),
      img2,
      dis,
      gameinfo: features
    });

    await mod.save();
    res.send('<h2>Mod uploaded successfully!</h2><a href="/">Back</a>');
  } catch (err) {
    console.error(err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).send(`Validation error: ${messages.join(', ')}`);
    }
    
    res.status(500).send('Error saving to database');
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});