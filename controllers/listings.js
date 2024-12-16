// Core Functionality in this listings.js
const { response } = require("express");
const Listing = require("../models/listing.js");
// ye map function ke liye thaa but abhee ke liye ignore this
// const locationiq = require('@api/locationiq');
// const mapToken = process.env.MAP_TOKEN;
// const geocodingClient = locationiq({ accessToken: mapToken });

// Index Route Controller
module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("../views/listings/index.ejs", { allListings });
};

// New Listing Route Controller
module.exports.renderNewForm = async (req, res) => {
    res.render("../views/listings/new.ejs");
};

// Show Route Controller
module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
    .populate(
        { path: "reviews",
          populate: {
                path: "author", select: "username",
            },
        }
    )
    .populate("owner");
    if(!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }
    console.log(listing);
    res.render("../views/listings/show.ejs", { listing });  
};

// Create Route Controller
module.exports.createListing = async (req, res, next) => {
    // ye map function ke liye thaa but abhee ke liye ignore this
    // let response = await geocodingClient.forwardGeocode({
    //     query: 'New Delhi, India',
    //     limit: 1
    // })
    //   .send()

    // console.log(response);  
    // res.send("done!");

    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    
    newListing.image = {url, filename};
    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

// Edit Route Controller
module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

// Update Route Controller
module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});

    if(typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = {url, filename};
        await listing.save();       
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);  
};

// Delete Route Controller
module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");  
};
