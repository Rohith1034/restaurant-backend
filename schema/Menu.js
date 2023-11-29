const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: String,
    comments: [String],
    category : String,
    ratings: [Number],
    image: String,
})

module.exports = menuSchema;