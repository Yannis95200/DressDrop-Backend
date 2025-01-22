const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv").config();
const cookieParser = require("cookie-parser");
const { checkUser, requireAuth } = require("./middleware/auth.middleware");
const cors = require("cors");
const port = 5000;

// Connexion à la base de données
connectDB();

const app = express();

const corsOption = {
  origin: (origin, callback) => {
    const allowedOrigins = ["http://localhost:3000", "https://cdpn.io"];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  allowedHeaders: ["sessionId", "Content-Type"],
  exposeHeaders: ["sessionId"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
};

// Configuration CORS
app.use(cors(corsOption));

// Middleware pour parser les cookies
app.use(cookieParser());

// JWT
app.get("*", checkUser);
app.get("/jwtid", requireAuth, (req, res) => {
  res.status(200).send(res.locals.user._id);
});

// Middleware pour parser les données JSON et URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes utilisateur
app.use("/user", require("./routes/user.routes"));

// **NOUVELLE ROUTE POUR LES POSTS**

// routes pour les vetement 

app.use("/clothes", require("./routes/clothes.routes"));

app.use("/owner", require("./routes/shop.routes"));

// routes pour le systemes de commande

app.use("/cart", require("./routes/cart.routes"));

app.use('/order', require('./routes/order.routes'));


app.use('/delivery', require('./routes/delivery.routes'));
app.use(express.urlencoded({ extended: true }));



// paiement
app.use('/stripe', require('./routes/stripe.routes'));


// Lancer le serveur
app.listen(port, () => console.log("Le serveur a démarré au port " + port));
