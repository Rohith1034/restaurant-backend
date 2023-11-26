require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const userSchema = require("./schema/user");
const bcrypt = require("bcrypt");
const md5 = require("md5");




const saltRounds = 10;

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Create a mongoose model from the userSchema
const User = mongoose.model("User", userSchema);

app.post("/data", async (req, res) => {
    try {
        const data = req.body;
        const newUser = new User({
            name: data.name,
            email: data.email,
            phone: data.phone,
            password: md5(data.confirmPassword),
            cart: [],
            recently_viewed: [],
            orders: [{}],
            address: {
                street: data.street,
                city: data.city,
                state: data.state,
                zipcode: data.zipcode,
                country: data.country,
            },
        });
        const foundItems = await User.findOne({email: newUser.email});
        if (foundItems === null) {
            newUser.save();
            res.json({ "result": "Registered" });
        }
        else {
            res.json({ "result": "Not Registered", "error": "Email Already Registered" })
        }
    } catch (error) {
        console.error("Error handling data:", error);
        res.status(500).json({ error: "An error occurred while processing the data" });
    }
});

app.get("/",(req,res) => {
    res.send("<h1>Hello world</h1>");
})

app.post("/userdata", async (req, res) => {
    try {
        const usesCollection = mongoose.connection.collection("users");
        const userData = await usesCollection.find({}).toArray();
        res.json(userData);
    }

    catch(error) {
        console.log(error);
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const main = async () => {
    try {
        await mongoose.connect(
            process.env.MONGO_URL,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }
        );
        console.log("Connected to MongoDB successfully");
    } catch (error) {
        console.log(error);
    }
};

main();
