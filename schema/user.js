const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
  cart: [String],
  recently_viewed: [String],
  "address": {
    "street": String,
    "city": String,
    "state": String,
    "zipCode": String,
    "country": String
  },
  admin: Boolean,
  orders: [{
    "orderId": String,
    "restaurantId": String,
    "items": [
      {
        "itemId": String,
        "name": String,
        "quantity": Number,
        "price": Number,
      }
    ],
    "totalAmount": Number,
  }],
});

module.exports = userSchema;
