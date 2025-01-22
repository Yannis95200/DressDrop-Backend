module.exports.getDeliveryOptions = async (req, res) => {
    try {
      const options = [
        { type: 'standard', price: 5, time: '3-5 days' },
        { type: 'express', price: 10, time: '1-2 days' },
      ];
      res.status(200).json(options);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  module.exports.scheduleDelivery = async (req, res) => {
    try {
      const { address, date } = req.body;
  
      if (!address || !date) {
        return res.status(400).json({ message: 'Address and date are required' });
      }
  
      const delivery = { address, date, status: 'scheduled' }; // Exemple fictif
      res.status(201).json(delivery);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  