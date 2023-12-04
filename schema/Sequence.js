const mongoose = require("mongoose");

const sequenceSchema = new mongoose.Schema({
    _id: String,
    seq: Number
});

module.exports = sequenceSchema;