const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");

const userController = require("../controllers/users.js");

// GET and POST (SIGNUP ROUTE)
router.route("/signup")
    .get(userController.renderSignupForm)
    .post(wrapAsync(userController.signup));

// GET and POST (LOGIN ROUTE)
router.route("/login")
    .get(userController.renderLoginForm)
    .post(saveRedirectUrl,
         passport.authenticate("local", { failureRedirect: "/login" , failureFlash: true }), 
         userController.login
    );

router.get("/logout", userController.logout);

module.exports = router;