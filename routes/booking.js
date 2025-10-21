// routes/booking.js
const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { isLoggedIn } = require("../middleware");

// 🟢 Create a booking
router.post("/:id/book", isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut, guests } = req.body;

    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    // Calculate days stayed and total price
    const days =
      (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);
    const totalPrice = days > 0 ? listing.price * days : listing.price;

    const booking = new Booking({
      user: req.user._id,
      listing: listing._id,
      checkIn,
      checkOut,
      guests,
      totalPrice,
    });

    await booking.save();

    req.flash(
      "success",
      `Booking confirmed! Total: $${totalPrice.toFixed(2)} for ${days} days.`
    );
    res.redirect(`/listings/${id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong while booking.");
    res.redirect("/listings");
  }
});

// 🟢 View all bookings for logged-in user
router.get("/my-bookings", isLoggedIn, async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).populate("listing");
  res.render("bookings/index", { bookings });
});
// ❌ Cancel a booking
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Booking.findByIdAndDelete(id);
    req.flash("success", "Booking cancelled successfully!");
    res.redirect("/bookings/my-bookings");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to cancel booking.");
    res.redirect("/bookings/my-bookings");
  }
});

module.exports = router;
