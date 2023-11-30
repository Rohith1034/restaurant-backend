require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const userSchema = require("./schema/user");
const bcrypt = require("bcrypt");
const md5 = require("md5");
const menuSchema = require("./schema/Menu");




const saltRounds = 10;

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Create a mongoose model from the userSchema
const User = mongoose.model("User", userSchema);
const Menu = mongoose.model("menu",menuSchema);

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
            admin: false,
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
        const sentData = req.body;
        const email = sentData.username.join(', ');
        const password = sentData.password.join(', ');
        const foundItems = await User.findOne({email:email});
        if (foundItems == null) {
            res.json({loginStatus: "Failed",error: "email not found"});
        }
        else if(foundItems != null){
            if (foundItems.password === md5(password)) {
                res.json({loginStatus: "success",userid:foundItems._id});
            }
            else {
                res.json({loginStatus: "failed",error: "incorrect password"})
            }
        }
    }

    catch(error) {
        console.log(error);
    }
})

app.post("/menudata",async(req,res) => {
    try {
        const foundItems = await Menu.find({});
        res.json(foundItems)
    }
    catch(error) {
        console.log(error);
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.post("/fooditems/:id",async(req,res) => {
    try {
        const id = req.params;
        const fooditems = await Menu.find({_id:new mongoose.Types.ObjectId(id)});
        res.json(fooditems);
    }
    catch (error) {
        console.log(error);
    }
} )

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
