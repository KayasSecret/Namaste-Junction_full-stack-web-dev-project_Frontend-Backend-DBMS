// ===== Getting Started Getting Started ===== //
const path = require("path");
if(process.env.NODE_ENV != "production") {
  require('dotenv').config({ path: path.resolve(__dirname, "../.env") })
};

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// const MONGO_URL = "mongodb://127.0.0.1:27017/namastejunction";
const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
    await mongoose.connect(dbUrl)
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../Frontend/views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "../Frontend/public")));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("ERROR in MONGO SESSION STORE", err)
});

const sessionOption = ({ 
  store,
  secret: process.env.SECRET,
  resave: false, 
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true
  } 
});

app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// app.get("/demouser", async (req, res) => {
//   let fakeUser = new User({
//     email: "student23@gmail.com",
//     username: "delta-student"
//   });

//   let registeredUser = await User.register(fakeUser, "HelloStudent");
//   res.send(registeredUser);
// });

// Root Route Redirect
app.get("/", (req, res) => {
  res.redirect("/listings");
});

// Path = /Backend/routes/listing.js
app.use("/listings", listingRouter);

// Path = /Backend/routes/review.js
app.use("/listings/:id/reviews", reviewRouter);

// Path = /Backend/routes/booking.js
const bookingRouter = require("./routes/booking.js");
app.use("/bookings", bookingRouter);

// Path = /Backend/routes/user.js
app.use("/", userRouter);

// Error Route 
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

// Error Handling (Middleware) 
app.use((err, req, res, next) => {
  let {statusCode = 500, message = "Something went wrong..!"} = err;
  res.status(statusCode).render("error.ejs", { message });
  // res.status(statusCode).send(message);
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`server is listening on port ${port}`);
});