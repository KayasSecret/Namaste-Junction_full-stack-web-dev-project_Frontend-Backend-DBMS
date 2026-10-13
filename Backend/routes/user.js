const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { isLoggedIn, isProfileOwner, saveRedirectUrl } = require("../middleware.js");

const userController = require("../controllers/users.js");

// GET and POST (SIGNUP ROUTE)
router.route("/signup")
    .get(userController.renderSignupForm)
    .post(wrapAsync(userController.signup));

// GET and POST (LOGIN ROUTE)
router.route("/login")
    .get(userController.renderLoginForm)
    .post(
        saveRedirectUrl,
        passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }),
        userController.login
    );

// LOGOUT ROUTE (Supports both GET link and POST form)
router.get("/logout", userController.logout);
router.post("/logout", userController.logout);

// PROTECTED USER PROFILE ROUTES (Current Authenticated User Only)
router.route("/profile")
    .get(isLoggedIn, isProfileOwner, wrapAsync(userController.renderProfile))
    .put(isLoggedIn, isProfileOwner, wrapAsync(userController.updateProfile))
    .post(isLoggedIn, isProfileOwner, wrapAsync(userController.updateProfile));

// Direct URL with user ID — strictly verified by isProfileOwner so users cannot access another user's private profile
router.route("/profile/:id")
    .get(isLoggedIn, isProfileOwner, wrapAsync(userController.renderProfile))
    .put(isLoggedIn, isProfileOwner, wrapAsync(userController.updateProfile));

module.exports = router;