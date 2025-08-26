const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { listingSchema, reviewSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const { isLoggedIn } = require("../middleware");
const listingController = require("../controllers/listing.js");
const reviewController = require("../controllers/review.js");

// ✅ Cloudinary & Multer for Image Upload
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// ✅ JOI Listing Validation
function validateListing(req, res, next) {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(msg, 400);
  }
  next();
}

// ✅ JOI Review Validation
function validateReview(req, res, next) {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(msg, 400);
  }
  next();
}

// ✅ LISTING ROUTES
router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.array("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing)
  );

router.get("/new", isLoggedIn, listingController.renderNewForm);

router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    upload.array("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(isLoggedIn, wrapAsync(listingController.deleteListing));

router.get("/:id/edit", isLoggedIn, wrapAsync(listingController.renderEditForm));

// ✅ DELETE SINGLE IMAGE FROM CLOUDINARY + DB
router.delete(
  "/:id/images/:filename",
  isLoggedIn,
  wrapAsync(listingController.deleteImage)
);

// ✅ REVIEW ROUTES (nested inside listing)
router.post(
  "/:id/reviews",
  isLoggedIn,
  validateReview,
  wrapAsync(reviewController.createReview)
);

router.delete(
  "/:id/reviews/:reviewId",
  isLoggedIn,
  wrapAsync(reviewController.deleteReview)
);

module.exports = router;
