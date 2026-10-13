// Core Functionality in this users.js
const User = require("../models/user.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

// Signup Page Rendering Controller
module.exports.renderSignupForm = (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect("/listings");
    }
    res.render("users/signup.ejs");
};

// SignUp (POST) Route Controller
module.exports.signup = async (req, res, next) => {
    try {
        let { username, email, password } = req.body;

        username = (username || "").trim();
        email = (email || "").trim().toLowerCase();
        password = (password || "").trim();

        if (!username || username.length < 3) {
            req.flash("error", "Username must be at least 3 characters long.");
            return req.session.save(() => res.redirect("/signup"));
        }
        if (username.length > 30) {
            req.flash("error", "Username cannot exceed 30 characters.");
            return req.session.save(() => res.redirect("/signup"));
        }
        if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
            req.flash("error", "Username can only contain letters, numbers, dots, hyphens, and underscores.");
            return req.session.save(() => res.redirect("/signup"));
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            req.flash("error", "Please provide a valid email address.");
            return req.session.save(() => res.redirect("/signup"));
        }
        if (!password || password.length < 6) {
            req.flash("error", "Password must be at least 6 characters long.");
            return req.session.save(() => res.redirect("/signup"));
        }

        // Duplicate email prevention
        const existingEmailUser = await User.findOne({ email });
        if (existingEmailUser) {
            req.flash("error", "An account with this email address already exists. Please log in or use a different email.");
            return req.session.save(() => res.redirect("/signup"));
        }

        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.session.sessionCreatedAt = Date.now();
            req.session.lastActivity = Date.now();
            req.flash("success", "Welcome to NamasteJunction!");
            let redirectUrl = res.locals.redirectUrl || req.session.redirectUrl || "/listings";
            delete req.session.redirectUrl;
            return req.session.save(() => res.redirect(redirectUrl));
        });
    } catch (err) {
        req.flash("error", err.message);
        return req.session.save(() => res.redirect("/signup"));
    }
};

// Login Page Rendering Controller
module.exports.renderLoginForm = (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect("/listings");
    }
    if (req.query.expired === "idle") {
        res.locals.error = ["Your session expired due to inactivity. Please log in again."];
    } else if (req.query.expired === "absolute") {
        res.locals.error = ["Your session has expired. Please log in again."];
    }
    res.render("users/login.ejs");
};

// Login Route Controller
module.exports.login = async (req, res) => {
    req.session.sessionCreatedAt = Date.now();
    req.session.lastActivity = Date.now();
    req.flash("success", "Welcome back to NamasteJunction! You are logged in!");
    let redirectUrl = res.locals.redirectUrl || req.session.redirectUrl || "/listings";
    delete req.session.redirectUrl;
    return req.session.save(() => res.redirect(redirectUrl));
};

// Logout Route Controller — securely logs out, destroys the server-side session, and clears the session cookie
module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.session.destroy((destroyErr) => {
            if (destroyErr) {
                return next(destroyErr);
            }
            res.clearCookie("connect.sid", {
                path: "/",
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
            });
            return res.redirect("/listings");
        });
    });
};

// Profile Page Rendering Controller (Strictly for the Logged-In User)
module.exports.renderProfile = async (req, res) => {
    // Always fetch the authenticated user's own record from MongoDB
    const profileUser = await User.findById(req.user._id);
    if (!profileUser) {
        req.flash("error", "User account not found.");
        return req.session.save(() => res.redirect("/listings"));
    }

    const userListings = await Listing.find({ owner: profileUser._id });
    const userReviews = await Review.find({ author: profileUser._id });

    res.render("users/profile.ejs", {
        profileUser,
        userListings,
        userReviews
    });
};

// Profile Update Controller (Strictly for the Logged-In User)
module.exports.updateProfile = async (req, res) => {
    const profileUser = await User.findById(req.user._id);
    if (!profileUser) {
        req.flash("error", "User account not found.");
        return req.session.save(() => res.redirect("/listings"));
    }

    const { email, fullName, location, phone, bio } = req.body.profile || req.body || {};

    if (!email || !String(email).trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
        req.flash("error", "Please provide a valid email address.");
        return req.session.save(() => res.redirect("/profile"));
    }

    profileUser.email = String(email).trim();
    if (typeof fullName === "string") profileUser.fullName = fullName.trim().slice(0, 80);
    if (typeof location === "string") profileUser.location = location.trim().slice(0, 100);
    if (typeof phone === "string") profileUser.phone = phone.trim().slice(0, 30);
    if (typeof bio === "string") profileUser.bio = bio.trim().slice(0, 500);

    await profileUser.save();

    req.flash("success", "Your profile information has been updated!");
    return req.session.save(() => res.redirect("/profile"));
};