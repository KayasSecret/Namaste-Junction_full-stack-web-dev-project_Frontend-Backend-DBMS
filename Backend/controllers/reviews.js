// Core Functionality in this reviews.js
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

// (POST) Review Route Controller
module.exports.createReview = async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    if (!listing) {
        req.flash("error", "Listing not found.");
        return req.session.save(() => res.redirect("/listings"));
    }
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    listing.reviews.push(newReview);
    
    await newReview.save();
    await listing.save();

    req.flash("success", "New Review Created!");
    return req.session.save(() => res.redirect(`/listings/${listing._id}`));
};

// (DELETE) Review Route Controller
module.exports.destroyReview = async (req, res) => {
    let { id, reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);

    req.flash("success", "Review Deleted!");
    return req.session.save(() => res.redirect(`/listings/${id}`));
};