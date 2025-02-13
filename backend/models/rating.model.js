const mongoose = require('mongoose')

const ratingSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId,ref: 'User', required: true},
    shopId: {type: mongoose.Schema.Types.ObjectId,ref: 'Shop', required: false},
    productId: {type: mongoose.Schema.Types.ObjectId,ref: 'Product', required: false},
    rating: {type:Number,required: true, min:1, max:5},
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Rating', ratingSchema)
