// ===== Getting Started Getting Started ===== //
const path = require("path");
if(process.env.NODE_ENV != "production") {
  require('dotenv').config({ path: path.resolve(__dirname, "../.env") })
};

const express = require("express");
const app = express();
app.set("trust proxy", 1);
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

const isProduction = process.env.NODE_ENV === "production";

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 60, // Refresh session touch in Mongo at most once per 60 seconds
  ttl: 2 * 60 * 60, // Server-side session TTL in MongoStore: 2 hours
});

store.on("error", (err) => {
  console.log("ERROR in MONGO SESSION STORE", err);
});

// Browser-session-only cookie configuration:
// Omitting expires and maxAge ensures the cookie is sent without an expiration timestamp,
// instructing the browser to discard the cookie upon browser session exit.
const sessionOption = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false, // Prevent persisting unauthenticated empty guest sessions
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
  },
};

app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Server-Side Session Activity & Timeout Enforcement Middleware
// Enforces a 1-hour idle timeout and 12-hour absolute session ceiling on authenticated sessions
const SESSION_IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour idle timeout
const SESSION_ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000; // 12 hours absolute lifetime

app.use((req, res, next) => {
  if (req.session && req.isAuthenticated && req.isAuthenticated()) {
    const now = Date.now();
    const lastActivity = req.session.lastActivity;
    const createdAt = req.session.sessionCreatedAt;

    // Check idle timeout
    if (lastActivity && now - lastActivity > SESSION_IDLE_TIMEOUT_MS) {
      req.logout((err) => {
        req.session.destroy(() => {
          res.clearCookie("connect.sid", {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: isProduction,
          });
          return res.redirect("/login?expired=idle");
        });
      });
      return;
    }

    // Check absolute session ceiling
    if (createdAt && now - createdAt > SESSION_ABSOLUTE_TIMEOUT_MS) {
      req.logout((err) => {
        req.session.destroy(() => {
          res.clearCookie("connect.sid", {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: isProduction,
          });
          return res.redirect("/login?expired=absolute");
        });
      });
      return;
    }

    // Record activity timestamp and session creation if not set
    req.session.lastActivity = now;
    if (!req.session.sessionCreatedAt) {
      req.session.sessionCreatedAt = now;
    }
  }

  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

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