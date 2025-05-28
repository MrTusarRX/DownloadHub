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


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});



v

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