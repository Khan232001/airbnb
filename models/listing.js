const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js"); // ⭐ updated
const listingSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: {
    filename: { type: String, required: true },
    url: {
      type: String,
      default:
        "https://tchelete.com/wp-content/uploads/2023/06/working-at-airbnb-1024x768-1-758x569.jpg",
    },
  },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  country: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },

  // ⭐ new: store ObjectId refs to Review
  reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
  owner:{
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  geometry:{
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  // category:{
  //   type: String,
  //   enum: ["apartment", "house", "cottage", "villa", "hotel"],
  // }
});
listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});
module.exports = mongoose.model("Listing", listingSchema);
