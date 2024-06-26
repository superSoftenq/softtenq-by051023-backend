const express = require("express");
const cors = require("cors");
const helper = require("./controllers/common")
const app = express();

// parse requests of content-type - application/json
app.use(express.json());
app.use(cors());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use((req,res,next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});
app.get('/', (req, res) => {
  res.send('succl resp');
});
app.get('/fr', (req, res) => {
  res.send('back and front are friends');
});

app.use(cors());

const db = require("./models");

const Role = db.role;

db.sequelize.sync({force: false});
//при первом запуске с новой БД, вызвать функцию initial()
function initial() {
  Role.create({
    id: 1,
    name: "user"
  });
 
  Role.create({
    id: 2,
    name: "moderator"
  });
 
  Role.create({
    id: 3,
    name: "admin"
  });
}


require('./routes/auth.routes')(app);
require('./routes/user.routes')(app);
require('./routes/userReactions.routes')(app);
require('./routes/news.routes.js')(app);
require('./routes/photo.routes.js')(app);
require('./routes/relations.routes.js')(app);
app.listen(3000, () => console.log('Example app is listening on port 3000.'));
//module.exports = express.Router
