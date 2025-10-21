const Listing = require("../models/listing");
const Review = require("../models/review");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// ✅ INDEX: Show only non-deleted listings
module.exports.index = async (req, res) => {
  const allListings = await Listing.find({
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  });
  res.render("listings/index", { listings: allListings });
};

// ✅ Render new listing form
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// ✅ Create new listing with map location
module.exports.createListing = async (req, res) => {
  let response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send();

  const newListing = new Listing(req.body.listing);
  newListing.geometry = response.body.features[0].geometry;
  await newListing.save();

  req.flash("success", "Successfully created a new listing!");
  res.redirect(`/listings/${newListing._id}`);
};

// ✅ Show single listing (handles deleted check)
module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id).populate("reviews");

  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  // If the listing is deleted, show the restore screen
  if (listing.isDeleted) {
    return res.render("listings/show.ejs", {
      listing,
      mapToken: process.env.MAP_TOKEN,
      deleted: false,
    });
  }

  res.render("listings/show.ejs", {
    listing,
    mapToken: process.env.MAP_TOKEN,
  });
};

// ✅ Render edit form
module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }
  res.render("listings/edit.ejs", { listing });
};

// ✅ Update listing
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findByIdAndUpdate(id, req.body.listing, {
    runValidators: true,
    new: true,
  });
  req.flash("success", "Listing updated successfully!");
  res.redirect(`/listings/${listing._id}`);
};

// ✅ SOFT DELETE (Move to Trash)
module.exports.deleteListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  listing.isDeleted = true;
  await listing.save();

  req.flash("success", "Listing moved to Trash!");
  res.redirect("/listings");
};

// ✅ RESTORE listing from Trash
module.exports.restoreListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  listing.isDeleted = false;
  await listing.save();

  req.flash("success", "Listing restored successfully!");
  res.redirect(`/listings/${id}`);
};

// ✅ Create Review
module.exports.createReview = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  const newReview = new Review(req.body.review);
  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();

  req.flash("success", "Review added successfully!");
  res.redirect(`/listings/${id}`);
};
