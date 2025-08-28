// ----- Load env first -----
require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const flash = require("connect-flash");

const ExpressError = require("./utils/ExpressError.js");
const User = require("./models/user.js");

// Routers
const listings = require("./routes/listing.js");
const reviews = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// ----- Config (Render/Prod friendly) -----
const PORT = process.env.PORT || 8080;
const DB_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/wanderlust";
const SESSION_SECRET = process.env.SECRET_KEY || "fallbacksecret";

const app = express();

// If behind a proxy (Render/Heroku), trust it so secure cookies work
app.set("trust proxy", 1);

// ----- DB Connection -----
mongoose
  .connect(DB_URL)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ----- Views & Static -----
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// ----- Parsers & Helpers -----
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// ----- Session Store (Mongo Atlas) -----
const store = MongoStore.create({
  mongoUrl: DB_URL,
  crypto: { secret: SESSION_SECRET },
  touchAfter: 24 * 3600, // reduces write ops
});

store.on("error", (e) => {
  console.error("SESSION STORE ERROR", e);
});

app.use(
  session({
    store,
    name: "session_id",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only over HTTPS in prod
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  })
);

app.use(flash());

// ----- Auth (Passport) -----
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ----- Globals for templates -----
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// ----- Routes -----
app.use("/listings", listings);
app.use("/listings/:id/reviews", reviews);
app.use("/", userRouter);

// Root → show listings instead of "Home Page Working!"
app.get("/", (req, res) => res.redirect("/listings"));

// Demo user route
app.get("/demouser", async (req, res) => {
  try {
    const demouser = new User({
      email: "demouser@example.com",
      username: "demouser",
    });
    const registeredUser = await User.register(demouser, "password");
    res.send(registeredUser);
  } catch (e) {
    res.send(e.message);
  }
});

// ----- 404 -----
app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

// ----- Error handler -----
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong!";
  try {
    return res.status(statusCode).render("error.ejs", { statusCode, message });
  } catch {
    return res.status(statusCode).json({ statusCode, message });
  }
});

// ----- Start Server -----
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
