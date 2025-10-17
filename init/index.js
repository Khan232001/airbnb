const mongoose = require("mongoose");
const initdata = require("./data.js");
const Listing = require("../models/listing.js");
const bookingRoutes = require("./routes/booking");

require("dotenv").config();

const MONGO_URL = process.env.MONGO_URL;
app.use("/bookings", bookingRoutes);

async function main() {
  await mongoose.connect(MONGO_URL);
  console.log("✅ Connected to MongoDB Atlas");
}

const initDB = async () => {
  try {
    await Listing.deleteMany({});
    console.log("🗑️ Deleted all existing listings");

    // Replace this with an actual user _id from your User collection
    const ownerId = "64f0c1b2e4d3f8b8c4e5a6b7";

    // Map through data and add owner + geometry
    const listingsWithOwner = initdata.data.map((obj) => ({
      ...obj,
      owner: ownerId,
      geometry: {
        type: "Point",
        coordinates: [-118.2437, 34.0522], // default Los Angeles
      },
    }));

    await Listing.insertMany(listingsWithOwner);
    console.log("✅ Inserted sample listings into the database");
  } catch (err) {
    console.error("❌ Error seeding DB:", err);
  } finally {
    await mongoose.connection.close();
    console.log("🔒 Closed DB connection");
  }
};

main().then(initDB);
