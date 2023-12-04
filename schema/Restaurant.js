const mongoose = require("mongoose");

const RestaurantSchema = new mongoose.Schema({
    id: String,
    name: String,
    email: String,
    phone: String,
    password: String,
    "address": {
        "street": String,
        "city": String,
        "state": String,
        "zipCode": String,
        "country": String
    },
    orders: [{
        "orderId": String,
        "userId": String,
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
    foodItems: [String],
});

module.exports = RestaurantSchema;