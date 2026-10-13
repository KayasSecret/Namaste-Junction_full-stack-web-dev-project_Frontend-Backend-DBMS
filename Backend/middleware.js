const Listing = require("./models/listing.js");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError.js");
const { reviewSchema } = require("./schema.js");
const { listingSchema } = require("./schema.js");

// LoggedIn Middleware
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        if (req.method === "GET") {
            req.session.redirectUrl = req.originalUrl;
        } else {
            // For non-GET requests (e.g. POST booking or POST review),
            // redirect back to the originating listing page or referer instead of a POST endpoint
            const referer = req.get("Referer");
            if (referer) {
                try {
                    const parsed = new URL(referer);
                    req.session.redirectUrl = parsed.pathname;
                } catch {
                    req.session.redirectUrl = req.params.id ? `/listings/${req.params.id}` : "/listings";
                }
            } else if (req.params.id) {
                req.session.redirectUrl = `/listings/${req.params.id}`;
            } else {
                req.session.redirectUrl = "/listings";
            }
        }

        let errorMsg = "You must be logged in to access this page.";
        if (req.originalUrl && req.originalUrl.startsWith("/profile")) {
            errorMsg = "You must be logged in to view your profile!";
        } else if (req.originalUrl && req.originalUrl.includes("/bookings")) {
            errorMsg = "You must be logged in to reserve a stay or view your bookings!";
        } else if (req.originalUrl && req.originalUrl.includes("/reviews")) {
            errorMsg = "You must be logged in to leave or manage a review!";
        } else if (req.originalUrl && req.originalUrl.startsWith("/listings/new")) {
            errorMsg = "You must be logged in to create a listing!";
        }

        req.flash("error", errorMsg);
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
module.exports.isOwner = async (req, res, next) => {
    try {
        let { id } = req.params;
        let listing = await Listing.findById(id);
        if (!listing) {
            req.flash("error", "Listing you requested for does not exist!");
            return req.session.save(() => res.redirect("/listings"));
        }
        const currentUser = req.user || res.locals.currUser;
        if (!currentUser || !listing.owner || !listing.owner.equals(currentUser._id)) {
            req.flash("error", "You do not have permission to modify this listing.");
            return req.session.save(() => res.redirect(`/listings/${id}`));
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
  
// Review Author Middleware
module.exports.isreviewAuthor = async (req, res, next) => {
    try {
        let { id, reviewId } = req.params;
        let review = await Review.findById(reviewId);
        if (!review) {
            req.flash("error", "Review does not exist!");
            return req.session.save(() => res.redirect(`/listings/${id}`));
        }
        const currentUser = req.user || res.locals.currUser;
        if (!currentUser || !review.author || !review.author.equals(currentUser._id)) {
            req.flash("error", "You are not authorized to delete this review.");
            return req.session.save(() => res.redirect(`/listings/${id}`));
        }
        next();
    } catch (err) {
        next(err);
    }
};