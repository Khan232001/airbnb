require("dotenv").config(); // Load .env at the very top

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore= require('connect-mongo');
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const flash = require("connect-flash");

// Debug check
console.log("Secret key loaded:", process.env.SECRET_KEY);

// MongoDB URL
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

// Utils
const ExpressError = require("./utils/ExpressError.js");

// Models
const User = require("./models/user.js");

// Routers
const listings = require("./routes/listing.js");
const reviews = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// ---- MongoDB Connection ----
main()
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

async function main() {
  await mongoose.connect(MONGO_URL);
}

// ---- View Engine & Middleware ----
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// ---- Session Configuration ----
const sessionConfig = {
  secret: process.env.SECRET_KEY || "fallbacksecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));
app.use(flash());

// ---- Passport Configuration ----
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ---- Logged-in User Debug ----
app.use((req, res, next) => {
  console.log("Logged in user:", req.user);
  next();
});

// ---- Global Template Variables ----
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// ---- Routes ----
app.use("/listings", listings);
app.use("/listings/:id/reviews", reviews);
app.use("/", userRouter);

// ---- Root Route ----
app.get("/", (req, res) => {
  res.send("Home Page Working!");
});

// ---- Demo User Route ----
app.get("/demouser", async (req, res) => {
  try {
    let demouser = new User({
      email: "demouser@example.com",
      username: "demouser",
    });
    let registeredUser = await User.register(demouser, "password");
    res.send(registeredUser);
  } catch (e) {
    res.send(e.message);
  }
});

// ---- 404 Handler ----
app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

// ---- Error Handler ----
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something went wrong!";
  res.status(statusCode).render("error.ejs", { statusCode, message: err.message });
});

// ---- Start Server ----
app.listen(8080, () => {
  console.log("🚀 Server running on port 8080");
});
