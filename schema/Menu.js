const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: String,
    comments: [String],
    category : String,
    ratings: [Number],
    image: String,
    timeTOCook: String,
    quantity: String,
})

module.exports = menuSchema;