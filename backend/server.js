const express = require("express");
require('dotenv').config();
const connectDB = require("./config/db");
const dotenv = require("dotenv").config();
const cookieParser = require("cookie-parser");
const { checkUser, requireAuth } = require("./middleware/auth.middleware");
const cors = require("cors");
const http = require('http');
const socketIo = require('socket.io');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const port = process.env.PORT || 5000;


connectDB();

const app = express();
app.use(express.json());

// Configuration CORS pour Express
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

// Middleware pour parser les cookies
app.use(cookieParser());

// Middleware pour vérifier le JWT
app.get("*", checkUser);
app.get("/jwtid", requireAuth, (req, res) => {
  res.status(200).send(res.locals.user._id);
});

// Middleware pour parser les données JSON et URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes utilisateur
app.use("/user", require("./routes/user.routes"));
app.use("/clothes", require("./routes/clothes.routes"));
app.use("/shops", require("./routes/shop.routes"));
app.use("/cart", require("./routes/cart.routes"));
app.use('/order', require('./routes/order.routes'));
app.use('/deliveries', require('./routes/delivery.routes'));
app.use('/stripe', require('./routes/stripe.routes'));

// Routes de notation
app.use('/rating', require('./routes/rating.routes'));

// Stripe payment endpoint
app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: req.body.items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
          },
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/success`,
      cancel_url: `${req.protocol}://${req.get('host')}/cancel`,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Erreur de création de session Stripe :', error);
    res.status(500).send('Erreur lors de la création de la session de paiement');
  }
});

// Créer le serveur HTTP pour gérer à la fois Express et WebSocket
const server = http.createServer(app);

// Initialiser WebSocket avec Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*",
  }
});

// Gestion des connexions WebSocket
io.on('connection', (socket) => {
  console.log('Un utilisateur est connecté');

  // Réception d'un message en temps réel (ex: suivi de livraison)
  socket.on('liveTrackingUpdate', (data) => {
    console.log('Mise à jour de suivi:', data);
    // Émettre la mise à jour aux autres clients connectés
    io.emit('liveTrackingUpdate', data);
  });

  // Déconnexion du client
  socket.on('disconnect', () => {
    console.log('Un utilisateur a quitté');
  });
});

// Démarrer le serveur WebSocket + Express sur le même port
server.listen(port, () => {
  console.log(`Le serveur WebSocket et Express écoute sur le port ${port}`);
});
