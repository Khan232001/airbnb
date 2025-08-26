const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user.js");
const { saveRedirectUrl } = require("../middleware"); // Correct middleware name

// ----- Signup Form -----
router.get("/signup", (req, res) => {
  res.render("users/signup");
});

// ----- Signup Logic -----
router.post("/signup", async (req, res, next) => {
  try {
    const { username, email, password } = req.body.user;
    const newUser = new User({ username, email });
    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to Wanderlust!");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
});

// ----- Login Form -----
router.get("/login", (req, res) => {
  res.render("users/login");
});

// ----- Login Logic -----
router.post(
  "/login",
  saveRedirectUrl, // ✅ Correct middleware function name
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  (req, res) => {
    req.flash("success", `Welcome back, ${req.user.username}!`);
    const redirectUrl = req.session.redirectUrl || "/listings"; // fallback
    delete req.session.redirectUrl; // clear it after using
    res.redirect(redirectUrl);
  }
);

// ----- Logout -----
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Logged out successfully!");
    res.redirect("/listings");
  });
});

module.exports = router;
