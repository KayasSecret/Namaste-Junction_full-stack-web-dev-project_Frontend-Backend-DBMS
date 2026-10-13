// Core Functionality in this reviews.js
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

// (POST) Review Route Controller
module.exports.createReview = async (req, res) => {
    console.log(req.params.id);
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    console.log(newReview);
    listing.reviews.push(newReview);
    
    await newReview.save();
    await listing.save();

    req.flash("success", "New Review Created!");

  res.redirect(`/listings/${listing._id}`);
};

// (POST) Review Route Controller
module.exports.destroyReview = async (req, res) => {
    let { id , reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);

    req.flash("success", "New Review Deleted!");

    res.redirect(`/listings/${id}`);
};