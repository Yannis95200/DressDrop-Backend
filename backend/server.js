const express = require("express");
require('dotenv').config();
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const { checkUser, requireAuth } = require("./middleware/auth.middleware");
const cors = require("cors");
const http = require('http');
const socketIo = require('socket.io');

const port = process.env.PORT || 5000;

// Connexion à la base de données
connectDB();

const app = express();

// Middleware pour parser les données JSON et URL-encoded
app.use(express.urlencoded({ extended: false }));
app.use(express.json())

// Middleware CORS
// Configuration CORS pour Express
app.use(cors({
  origin: ["http://localhost:3000", "http://10.0.2.2:5000"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Middleware pour parser les cookies
app.use(cookieParser());

// Logger des requêtes (déplacé après CORS & cookies)
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url} - Body:`, req.body);
  next();
});

// Servir les fichiers statiques (images, fichiers, etc.)
app.use('/uploads', express.static('uploads'));


// Routes
app.use("/user", require("./routes/user.routes"));
app.use("/clothes", require("./routes/clothes.routes"));
app.use("/shops", require("./routes/shop.routes"));
app.use("/cart", require("./routes/cart.routes"));
app.use("/order", require("./routes/order.routes"));
app.use("/deliveries", require("./routes/delivery.routes"));
app.use("/stripe", require("./routes/stripe.routes"));
app.use("/payment", require("./routes/payment.routes"));
app.use("/rating", require("./routes/rating.routes"));

// Création du serveur HTTP
const server = http.createServer(app);

// Initialisation de WebSocket (si utilisé)
const io = socketIo(server, {
  cors: { origin: "*" }
});

io.on('connection', (socket) => {
  console.log('Un utilisateur est connecté');

  socket.on('liveTrackingUpdate', (data) => {
    console.log('Mise à jour de suivi:', data);
    io.emit('liveTrackingUpdate', data);
  });

  socket.on('disconnect', () => {
    console.log('Un utilisateur a quitté');
  });
});

// Lancement du serveur
server.listen(port, "0.0.0.0", () => {
  console.log(`Le serveur écoute sur le port ${port}`);
});
