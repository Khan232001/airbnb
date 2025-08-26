const mongoose = require("mongoose");
const initdata= require("./data.js");
const Listing = require("../models/listing.js");
const MONGO_URL = "mongodb://localhost:27017/wanderlust";
main()
.then(()=>{
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
});
async function main() {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB");
}
const initDB= async () => {
    await Listing.deleteMany({});
    initdata.data=initdata.data.map((obj)=>({...obj,owner: "64f0c1b2e4d3f8b8c4e5a6b7"})); // Set owner for each listing
    console.log("Deleted all existing listings");
    await Listing.insertMany(initdata.data);
    console.log("Inserted sample listings into the database");
};
initDB();