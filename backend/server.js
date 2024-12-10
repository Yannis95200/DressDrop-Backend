const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv").config();
const cookieParser = require('cookie-parser');
const {checkUser, requireAuth} = require('./middleware/auth.middleware');
const port = 5000;
const cors = require('cors');

// connexion à la DB
connectDB();

const app = express();

const corsOption = {
  origin: (origin, callback) => {
    const allowedOrigins = ['http://localhost:3000', 'https://cdpn.io'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['sessionId', 'Content-Type'],
  exposeHeaders: ['sessionId'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
};
// CORS configuration
app.use(cors(corsOption));


//Utilisation de cookieParser avant les middlewares
app.use(cookieParser());

//jwt
app.get('*', checkUser);
app.get('/jwtid', requireAuth, (req, res) => {
  res.status(200).send(res.locals.user._id);
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/user", require("./routes/user.routes"));

// Lancer le serveur
app.listen(port, () => console.log("Le serveur a démarré au port  " + port));
