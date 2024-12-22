const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
  cart: [
    {
      itemId: String,  // Unique identifier for the item
      name: String,    // Name of the item
      price: Number,
      image: String,   // Price of the item
      quantity: {      // Quantity of the item in the cart
        type: Number,   // Default quantity is 1 if not specified
      }
      
    }
  ],
  profile_pic: String,
  recently_viewed: [String],
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  admin: Boolean,
  orders: [
    {
      orderId: String,
      items: [
        {
          itemId: String,
          name: String,
          quantity: Number,
          price: Number,
          img: String
        }
      ],
      totalAmount: Number,
    }
  ],
});

module.exports = userSchema;
