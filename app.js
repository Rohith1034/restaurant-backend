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
app.use(express.json());
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
            profile_pic: "",
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

app.post("/profiledata", async(req, res) => {
    try {
        const sentData = req.body;
        const foundUsers = await User.findOne({id:sentData.userId});
        res.json(foundUsers);
        
    } catch (error) {
        console.error("Error processing /profiledata:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/updateprofile",async(req,res) => {
    try {
        const data = req.body;
        const founduser = await User.findOne({id: data.userId});
        founduser.name = data.name;
        founduser.email = data.email;
        founduser.phone = data.phone;
        founduser.password = data.password;
        founduser.cart = data.cart;
        founduser.recently_viewed = data.recently_viewed;
        founduser.orders = data.orders;
        founduser.profile_pic = data.profile_pic;
        founduser.admin = data.admin;
        founduser.address.street = data.address.street;
        founduser.address.city = data.address.city;
        founduser.address.state = data.address.state;
        founduser.address.country = data.address.country;
        founduser.address.zipCode = data.address.zipCode;
        founduser.save();
    }
    catch (error) {

    }
})
app.post("/addtocart", async (req, res) => {
    try {
        const data = req.body;
        

        const userId = data.userId;

        // Find the user by _id
        const foundUser = await User.findById(userId);
        //console.log(foundUser);

        if (!foundUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the item already exists in the cart
        let existingItem = foundUser.cart.find(cartItem => cartItem.itemId === data.id);

        // Use data.itemId to fetch the menu item
        const menuData = await Menu.findOne({ _id: new mongoose.Types.ObjectId(data.id) });
        
        if (!menuData) {
            return res.status(404).json({ message: "Menu item not found" });
        }

        if (existingItem) {
            // Increment quantity if item exists
            existingItem.quantity += 1;
        } else {
            // Add new item to cart if it doesn't exist
            const newitem = {
                itemId: menuData.id,
                name: menuData.name,
                price: menuData.price,
                image: menuData.image,
                quantity: 1,
            };
            foundUser.cart.push(newitem);
        }

        
        await foundUser.save();
        res.status(200).json({ message: "Item added to cart", cart: foundUser.cart });

    } catch (error) {
        console.error("Error in adding to cart:", error);
        res.status(500).json({ error: "An error occurred while adding to cart" });
    }
});



const { ObjectId } = mongoose.Types; // Ensure ObjectId is imported

app.post("/wishlistdata", async (req, res) => {
    try {
        const userid = req.body.userId;
        const foundUser = await User.findOne({ _id: userid });
        if (foundUser) {
            res.json(foundUser);
        }
    }
    catch (error) {

    }
});


app.post("/wishlistdel",async(req,res) => {
    const data = req.body;
    const foundUser = await User.findOne({id:data.userID})
    if (foundUser) {
        var cartItems = foundUser.cart;
        for (let i = 0;i < cartItems.length;i++) {
            if (data.itemId === cartItems[i]._id.toString()) {
                cartItems.pop(i);
            }
        }
        foundUser.cart = cartItems;
        foundUser.save();
        res.json(foundUser);
    }
})

app.post("/placeorder", async (req, res) => {
    try {
        const response = req.body;
        const userid = response.id;

        // Find the user by ID
        const foundUser = await User.findOne({ _id: userid });
        if (!foundUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Calculate total amount and prepare items array
        let totalAmount = 0;
        const items = response.data.map((entry) => {
            const { item } = entry; // Extract the nested item
            if (
                typeof item.price !== "number" ||
                typeof item.quantity !== "number" ||
                isNaN(item.price) ||
                isNaN(item.quantity)
            ) {
                throw new Error(`Invalid item data: ${JSON.stringify(entry)}`);
            }

            totalAmount += item.price * item.quantity;
            return {
                itemId: item.itemId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                img: item.image
            };
        });

        // Create a new order
        const newOrder = {
            orderId: `order_${Date.now()}`, // Generate a unique order ID
            items: items,
            totalAmount: totalAmount,
        };

        // Push the new order to the user's orders array
        foundUser.orders.push(newOrder);
        foundUser.cart = [];
        await foundUser.save();
        
        res.status(200);
    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});



app.post("/updatequantity",async(req,res) => {
    try {
    
        const userId = req.body.userId;
        const itemId = req.body.itemId;
        const quantity = req.body.quantity;
        const foundUser = await User.findOne({id:userId});
        let index = 0;
        if (foundUser) {
            for (let i = 0;i < foundUser.cart.length;i++){
                if (itemId === foundUser.cart[i]._id.toString()) {
                    console.log(index)
                    index = i;
                }
            }
            foundUser.cart[index].quantity = quantity;
            foundUser.save();
            res.json(foundUser);
        }
        
    }
    catch (error) {

    }
})

app.post("/orderdata",async(req,res) => {
    try {
        const response = req.body;
        const foundUser = await User.findOne({id:response.userId});
        if (foundUser) {
            res.status(200).json(foundUser.orders);
        }
    }
    catch (error) {

    }
})

app.post("/menudata", async (req, res) => {
    try {
        const foundItems = await Menu.find({});
        if (foundItems != null) {
            res.status(404);
        }
        else {
            res.status(200).json(foundItems);
        }
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
