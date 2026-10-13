const Listing = require("./models/listing.js");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError.js");
const { reviewSchema } = require("./schema.js");
const { listingSchema } = require("./schema.js");

// LoggedIn Middleware
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        const isProfileRoute = req.originalUrl && req.originalUrl.startsWith("/profile");
        req.flash(
            "error",
            isProfileRoute
                ? "You must be logged in to view your profile!"
                : "You must be logged in to create listing!"
        );
        return req.session.save(() => res.redirect("/login"));
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if(req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

// Profile Identity Verification Middleware (Prevents accessing another user's private profile)
module.exports.isProfileOwner = (req, res, next) => {
    if (!req.isAuthenticated() || !req.user) {
        req.flash("error", "You must be logged in to view your profile!");
        return req.session.save(() => res.redirect("/login"));
    }
    if (req.params.id && String(req.params.id) !== String(req.user._id)) {
        req.flash("error", "Access denied: You cannot access another user's private profile.");
        return req.session.save(() => res.redirect("/profile"));
    }
    next();
};

// Listing Owner Middleware
module.exports.isOwner = async(req, res, next) => {
    try {
        let { id } = req.params;
        let listing = await Listing.findById(id);
        if (!listing) {
            req.flash("error", "Listing you requested for does not exist!");
            return res.redirect("/listings");
        }
        if (!res.locals.currUser || !listing.owner || !listing.owner.equals(res.locals.currUser._id)) {
            req.flash("error", "You are not the owner of this listing");
            return res.redirect(`/listings/${id}`);  
        }
        next();
    } catch (err) {
        next(err);
    }
};

// Schema Middleware
module.exports.validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if(error) {
      let errMsg = error.details.map((el) => el.message).join(",");
      throw new ExpressError(400, errMsg);
    } else {
      next();
    }
};

// Review Middleware (for Review Section)
module.exports.validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if(error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};
  
// Listing Owner Middleware
module.exports.isreviewAuthor = async(req, res, next) => {
    try {
        let { id, reviewId } = req.params;
        let review = await Review.findById(reviewId);
        if (!review) {
            req.flash("error", "Review does not exist!");
            return res.redirect(`/listings/${id}`);
        }
        if (!review.author.equals(res.locals.currUser._id)) {
            req.flash("error", "You are not the author of this review");
            return res.redirect(`/listings/${id}`);  
        }
        next();
    } catch (err) {
        next(err);
    }
};