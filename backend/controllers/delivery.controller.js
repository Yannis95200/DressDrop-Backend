const Delivery = require('../models/delivery.model');
const Order = require('../models/order.model');
const UserModel = require('../models/user.model');
const Shop = require('../models/shop.model');
const googleMaps = require('@google/maps');


const { Client } = require("@googlemaps/google-maps-services-js");

const googleMapsClient = new Client({});

// Fonction pour formater correctement une adresse
const formatAddress = (address) => {
  return `${address.street}, ${address.city}, ${address.postalCode}, ${address.country}`;
};

// Fonction pour calculer le temps de livraison en utilisant Google Maps
const calculateDeliveryTime = async (shopAddress, userAddress) => {
  try {
    const formattedShopAddress = formatAddress(shopAddress);
    const formattedUserAddress = formatAddress(userAddress);

    console.log("Adresse magasin:", formattedShopAddress);
    console.log("Adresse client:", formattedUserAddress);

    const response = await googleMapsClient.distancematrix({
      params: {
        origins: [formattedShopAddress],
        destinations: [formattedUserAddress],
        mode: 'driving',
        units: 'metric',
        key: 'AIzaSyBJeZdIqmkQON37NEpii616Na1uHY1lCtM'
      }
    });

    console.log('Réponse API Google Maps:', JSON.stringify(response.data, null, 2));

    if (
      response.data &&
      response.data.rows &&
      response.data.rows.length > 0 &&
      response.data.rows[0].elements &&
      response.data.rows[0].elements.length > 0 &&
      response.data.rows[0].elements[0].status !== "ZERO_RESULTS"
    ) {
      const distanceInMeters = response.data.rows[0].elements[0].distance.value;
      const durationInSeconds = response.data.rows[0].elements[0].duration.value;

      return {
        distanceInKm: distanceInMeters / 1000,
        timeInMinutes: durationInSeconds / 60,
      };
    } else {
      throw new Error('Aucune donnée valide dans la réponse de Google Maps.');
    }
  } catch (error) {
    console.error("Erreur Google Maps API:", error.response ? error.response.data : error.message);
    throw new Error("Impossible de calculer le temps de livraison.");
  }
};

module.exports.scheduleDelivery = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const order = await Order.findById(orderId).populate('userId');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    console.log('Order found:', order);
    
    const shop = await Shop.findById(order.shopId);
    console.log('Shop found:', shop);
    if (!shop || !shop.ShopAddress) {
      return res.status(404).json({ message: 'Shop address not found' });
    }
    

    // Trouver l'utilisateur
    const user = await UserModel.findById(order.userId);
    if (!user || !user.address) {
      console.log('User or user address not found:', user);
      return res.status(404).json({ message: 'User address not found' });
    }

    // Calculer la distance et le temps de livraison
    const { distanceInKm, timeInMinutes } = await calculateDeliveryTime(shop.ShopAddress, user.address);

    // Enregistrer la livraison
    const delivery = new Delivery({
      orderId: order._id,
      shopAddress: shop.ShopAddress,
      userAddress: user.address,
      estimatedDeliveryTime: { distanceInKm, timeInMinutes },
    });

    await delivery.save();

    res.status(201).json({
      message: 'Delivery scheduled successfully',
      delivery,
    });
  } catch (error) {
    console.error('Error scheduling delivery:', error);
    res.status(500).json({ message: 'Error scheduling delivery', error });
  }
};

module.exports.getAvailableDeliveries = async (req, res) => {
  try {
      const userId = req.user.id;
      const user = await UserModel.findById(userId);

      if (!user || user.role !== "delivery") {
          return res.status(403).json({ message: "Accès refusé. Seuls les livreurs peuvent voir les commandes disponibles." });
      }

      if (!user.address || !user.address.city) {
          return res.status(400).json({ message: "Veuillez configurer votre adresse pour voir les commandes proches." });
      }

      // Recherche des commandes disponibles dans la même ville que le livreur
      const availableOrders = await OrderModel.find({
          status: "pending",
          "deliveryAddress.city": user.address.city
      });

      res.status(200).json({ orders: availableOrders });
  } catch (err) {
      console.error("Erreur lors de la récupération des commandes :", err);
      res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports.updateLiveTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { coordinates } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "ID de commande invalide" });
    }

    const delivery = await DeliveryModel.findOne({ orderId });
    if (!delivery) {
      return res.status(404).json({ message: "Livraison non trouvée" });
    }

    delivery.liveTracking = {
      liveCoordinates: {
        type: "Point",
        coordinates: coordinates,
      },
      lastUpdated: Date.now(),
    };

    await delivery.save();

    res.status(200).json({ message: "Suivi mis à jour", delivery });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du suivi :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports.acceptDelivery = async (req, res) => {
  const deliveryId = req.params.id;
  const deliveryPersonId = req.body.deliveryPersonId;

  try {
    // Trouver la livraison à accepter
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ message: "Commande non trouvée." });
    }

    // Vérifier si la livraison est déjà acceptée ou terminée
    if (delivery.status === 'in-progress' || delivery.status === 'delivered') {
      return res.status(400).json({ message: "Cette commande est déjà en cours ou livrée." });
    }

    // Mettre à jour la livraison avec le livreur et changer son statut
    delivery.deliveryPerson = deliveryPersonId;
    delivery.status = 'in-progress';

    // Sauvegarder la livraison mise à jour
    await delivery.save();

    // Optionnel : mettre à jour l'état de la commande dans le modèle "Order" si nécessaire
    const order = await Order.findById(delivery.orderId);
    if (order) {
      if (order.status !== 'shipped' && order.status !== 'delivered') {
        order.status = 'shipped';
        await order.save();
      }
    }

    // Répondre avec les détails de la livraison acceptée
    res.status(200).json({
      message: "Commande acceptée avec succès.",
      delivery
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de l'acceptation de la commande." });
  }
};

module.exports.completeDelivery = async (req, res) => {
  const deliveryId = req.params.id;

  try {
    // Trouver la livraison
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ message: "Commande non trouvée." });
    }

    // Vérifier si la livraison est déjà terminée
    if (delivery.status === 'delivered') {
      return res.status(400).json({ message: "Cette commande a déjà été livrée." });
    }

    // Mettre à jour le statut de la livraison
    delivery.status = 'delivered';
    delivery.deliveredAt = new Date();
    await delivery.save();

    // Optionnel : mettre à jour l'état de la commande dans le modèle "Order"
    const order = await Order.findById(delivery.orderId);
    if (order) {
      order.status = 'delivered';
      await order.save();
    }

    res.status(200).json({
      message: "Commande marquée comme livrée.",
      delivery
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la finalisation de la commande." });
  }
};
