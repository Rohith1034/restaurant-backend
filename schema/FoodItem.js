const mongoose = require("mongoose");

const FoodItemSchema = mongoose.Schema({
    name:String,
    price: String,
    category: String,
    description: String,
    quantity: String,
    images: String,
    timeTOCook: String,
})

module.exports = FoodItemSchema;