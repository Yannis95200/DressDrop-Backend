module.exports.createOrder = async (req, res) => {
    try {
      const { items, totalPrice } = req.body;
  
      // Logique pour créer une commande
      const newOrder = { items, totalPrice, status: 'pending' }; // Exemple
  
      res.status(201).json(newOrder);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  module.exports.getOrder = async (req, res) => {
    // Logique pour récupérer une commande par ID
  };
  
  module.exports.updateOrder = async (req, res) => {
    // Logique pour mettre à jour une commande
  };
  
  module.exports.deleteOrder = async (req, res) => {
    // Logique pour supprimer une commande
  };
  