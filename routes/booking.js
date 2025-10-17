const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { isLoggedIn } = require("../middleware");

// Create booking
router.post("/:id/book", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const { checkIn, checkOut, guests } = req.body;

  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  const booking = new Booking({
    user: req.user._id,
    listing: listing._id,
    checkIn,
    checkOut,
    guests,
  });

  await booking.save();
  req.flash("success", "Booking confirmed!");
  res.redirect(`/listings/${id}`);
});

module.exports = router;
