const OrderModel = require('../models/order.model')
const ClothesModel = require('../models/clothes.model')

module.exports.createOrder = async (req, res) => {
  try {
      const { userId, items } = req.body;

      // Vérifiez si les champs nécessaires sont présents
      if (!userId || !items || items.length === 0) {
          return res.status(400).json({ message: 'userId and items are required' });
      }

      // Récupérez les détails des produits pour calculer le prix total
      const productIds = items.map((item) => item.productId);
      const products = await ClothesModel.find({ _id: { $in: productIds } });

      if (products.length !== items.length) {
          return res.status(400).json({ message: 'One or more products not found' });
      }

      // Calculez le prix total
      let totalPrice = 0;
      items.forEach((item) => {
          const product = products.find((p) => p._id.toString() === item.productId.toString());
          if (product) {
              totalPrice += product.price * item.quantity;
          }
      });

      // Créez une nouvelle commande
      const newOrder = await OrderModel.create({
          userId,
          items,
          totalPrice, // Utilisez le prix calculé
          status: 'pending',
      });

      res.status(201).json(newOrder);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error creating order', error });
  }
};

  //  Récupérer une commande par ID
module.exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    // Trouvez la commande par ID
    const order = await OrderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Récupérez les détails des produits (ClothesModel au lieu de "Product")
    const productIds = order.items.map((item) => item.productId);
    const products = await ClothesModel.find({ _id: { $in: productIds } });

    // Ajoutez les détails des produits à la réponse
    const detailedItems = order.items.map((item) => {
      const product = products.find((p) => p._id.toString() === item.productId.toString());
      return {
        ...item._doc,
        product: product || null,
      };
    });

    const orderWithDetails = {
      ...order._doc,
      items: detailedItems,
    };

    res.status(200).json(orderWithDetails);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error });
  }
};


module.exports.updateOrder = async (req, res) => {
  // Logique pour mettre à jour une commande
};

module.exports.deleteOrder = async (req, res) => {
  // Logique pour supprimer une commande
};
