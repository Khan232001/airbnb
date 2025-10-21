// const mongoose = require("mongoose");
// const Schema = mongoose.Schema;

// const bookingSchema = new Schema({
//   user: { type: Schema.Types.ObjectId, ref: "User", required: true },
//   listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
//   checkIn: { type: Date, required: true },
//   checkOut: { type: Date, required: true },
//   guests: { type: Number, required: true },
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model("Booking", bookingSchema);

// models/booking.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  listing: { 
    type: Schema.Types.ObjectId, 
    ref: "Listing", 
    required: true 
  },
  checkIn: { 
    type: Date, 
    required: true 
  },
  checkOut: { 
    type: Date, 
    required: true 
  },
  guests: { 
    type: Number, 
    required: true 
  },
  totalPrice: { 
    type: Number, 
    default: 0 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Optional: Automatically calculate total price before saving
bookingSchema.pre("save", async function (next) {
  if (this.checkIn && this.checkOut) {
    const Listing = mongoose.model("Listing");
    const listing = await Listing.findById(this.listing);

    if (listing && listing.price) {
      const days =
        (new Date(this.checkOut) - new Date(this.checkIn)) /
        (1000 * 60 * 60 * 24);
      this.totalPrice = days > 0 ? listing.price * days : listing.price;
    }
  }
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
