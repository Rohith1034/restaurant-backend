require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const userSchema = require("./schema/user");
const bcrypt = require("bcrypt");
const md5 = require("md5");
const menuSchema = require("./schema/Menu");
const restaurantSchema = require("./schema/Restaurant");
const sequenceSchema = require("./schema/Sequence");


const saltRounds = 10;

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Create a mongoose model from the userSchema
const User = mongoose.model("User", userSchema);
const Menu = mongoose.model("menu", menuSchema);
const Restaurant = mongoose.model("Restaurant", restaurantSchema);
const Sequence = mongoose.model('Sequence', sequenceSchema);
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
        const foundItems = await User.findOne({ email: newUser.email });
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

app.get("/", (req, res) => {
    res.send("<h1>Hello world</h1>");
})

app.post("/userdata", async (req, res) => {
    try {
        const sentData = req.body;
        const email = sentData.username.join(', ');
        const password = sentData.password.join(', ');
        const foundItems = await User.findOne({ email: email });
        if (foundItems == null) {
            res.json({ loginStatus: "Failed", error: "email not found" });
        }
        else if (foundItems != null) {
            if (foundItems.password === md5(password)) {
                res.json({ loginStatus: "success", userid: foundItems._id });
            }
            else {
                res.json({ loginStatus: "failed", error: "incorrect password" })
            }
        }
    }

    catch (error) {
        console.log(error);
    }
})

app.post("/menudata", async (req, res) => {
    try {
        const foundItems = await Menu.find({});
        res.json(foundItems)
    }
    catch (error) {
        console.log(error);
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get("/allfooditems",async(req,res) => {
    try {
        const fooditems = await Menu.find({});
        res.json(fooditems);
    }
    catch (error) {
        console.log(error);
    }
})


app.post("/fooditems/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const fooditems = await Menu.find({ _id: new mongoose.Types.ObjectId(id) });
        res.json(fooditems);
    }
    catch (error) {
        console.log(error);
    }
})

app.post("/restaurantdata",async(req,res) => {
    try {
        const restaurantData = await Restaurant.find({});
        res.json(restaurantData);
    }
    catch(error) {
        console.log(error);
    }
})

app.post("/restaurant/register", async (req, res) => {
    try {
        const restaurantIdTOString = await getNextSequenceValue("id");
        console.log(restaurantIdTOString);
        const data = await req.body;

        const newRestaurant = new Restaurant({
            id: "restaurant" + restaurantIdTOString,
            name: data.name,
            email: data.email,
            phone: data.phone,
            password: md5(data.confirmPassword),
            image: data.images,
            description: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy.",
            ratings: [],
            comments: [],
            orders: [{}],
            address: {
                street: data.street,
                city: data.city,
                state: data.state,
                zipcode: data.zipcode,
                country: data.country,
            },
            fooditems: [],
        });

        const foodItems = await Restaurant.findOne({ email: data.email });
        if (foodItems === null) {
            console.log("hey");
            newRestaurant.save();
            res.json({ "result": "Registered" });
        }
        else {
            res.json({ "result": "Not Registered", "error": "Email Already Registered" });
        }
    }
    catch (error) {
        console.log(error);
    }
})

app.post("/restaurant/login", async (req, res) => {
    try {
        const response = await req.body;
        const email = response.username.join(', ');
        const password = response.password.join(', ');
        const restaurantData = await Restaurant.findOne({ email: email });
        if (restaurantData === null) {
            res.json({ loginStatus: "Failed", error: "email not found" });
        }
        else {
            if (restaurantData.password === md5(password)) {
                res.json({ loginStatus: "success", restaurantid: restaurantData.id });
            }
            else {
                res.json({ loginStatus: "failed", error: "incorrect password" });
            }
        }
    }
    catch (error) {
        console.log(error);
    }
})

app.post("/restaurant/edititem", async (req, res) => {
    try {
        const editedItem = req.body;
        const { _id, ...updatedFields } = editedItem;

        const result = await Menu.updateOne(
            { _id: mongoose.Types.ObjectId(_id) },
            { $set: updatedFields }
        );

        if (result.matchedCount === 1) {
            res.status(200).json({ success: true, message: 'Item updated successfully.' });
        } else {
            res.status(404).json({ success: false, message: 'Item not found or no changes made.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error.' });
    }
});

const deleteItem = async (resid, foodid) => {
    try {
        const updatedRestaurantData = await Restaurant.findOneAndUpdate(
            { id: resid },
            { $pull: { foodItems: foodid } },
            { new: true }
        );

        if (updatedRestaurantData) {
            console.log("Item deleted successfully:", foodid);
            console.log("Updated Restaurant Data:", updatedRestaurantData);
        } else {
            console.log("Item not found or deletion failed.");
        }
    } catch (error) {
        console.error("Error deleting item:", error);
    }
};



app.post("/restaurant/fooditem/delete", async (req, res) => {
    try {
        const data = await req.body;
        const response = await Menu.deleteOne({ _id: mongoose.Types.ObjectId(data.id) });
        deleteItem(data.restaurantId,data.id);
        res.json({"status":true});
    }
    catch (error) {
        console.log(error);
    }
})

app.post("/restaurant/newitem", async (req, res) => {
    try {
        const FoodItem = await req.body;
        const newFoodItem = new Menu({
            name: FoodItem.name,
            price: FoodItem.price,
            category: FoodItem.category,
            description: FoodItem.description,
            quantity: FoodItem.quantity,
            timeTOCook: FoodItem.timeToCook,
            image: FoodItem.images,
            ratings: [],
            comments: [],
        })
        await newFoodItem.save();
        console.log(newFoodItem);
        const foundItems = await Restaurant.findOne({ id: FoodItem.id });
        foundItems.foodItems.push(newFoodItem._id);
        foundItems.save();
        res.json({ status: true });
    }
    catch (error) {
        console.log(error);
    }
})

app.post("/restaurant/details/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const foundItems = await Restaurant.findOne({ id: id });
        res.json(foundItems);
    }
    catch (error) {
        console.log(error)
    }
})

app.post("/restaurantfooditems/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const foundItems = await Restaurant.findOne({ id: id });
        console.log(foundItems);
        var foodArray = [];
        for (let i = 0; i < foundItems.foodItems.length; i++) {
            const res = await Menu.findOne({ _id: new mongoose.Types.ObjectId(foundItems.foodItems[i]) });
            foodArray.push(res);
        }
        res.json(foodArray);
    }
    catch (error) {
        console.log(error);
    }
})


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


async function getNextSequenceValue(sequenceName) {
    try {
        const sequenceDocument = await Sequence.findOneAndUpdate(
            { _id: sequenceName },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        return sequenceDocument.seq;
    } catch (error) {
        throw error;
    }
}

main();
