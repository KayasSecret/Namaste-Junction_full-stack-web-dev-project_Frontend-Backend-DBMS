// Core Functionality in this listings.js
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const { getTodayUTC, formatDateISO } = require("./bookings.js");

// Index Route Controller
module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

// New Listing Route Controller
module.exports.renderNewForm = async (req, res) => {
    res.render("listings/new.ejs");
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
        return res.redirect("/listings");
    }

    const todayUTC = getTodayUTC();
    const activeBookings = await Booking.find({
        listing: listing._id,
        status: "confirmed",
        checkOut: { $gt: todayUTC },
    })
        .select("checkIn checkOut")
        .sort({ checkIn: 1 });

    const reservedRanges = activeBookings.map((b) => ({
        checkIn: formatDateISO(b.checkIn),
        checkOut: formatDateISO(b.checkOut),
    }));

    res.render("listings/show.ejs", { listing, reservedRanges });  
};

// Create Route Controller
module.exports.createListing = async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    
    if (req.file) {
        let url = req.file.path;
        let filename = req.file.filename;
        newListing.image = {url, filename};
    }

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
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image && listing.image.url ? listing.image.url : "";
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

// Update Route Controller
module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = {url, filename};
        await listing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);  
};

const path = require("path");
const fs = require("fs");
const { cloudinary, hasCloudinaryCredentials, uploadsDir } = require("../cloudConfig.js");

// Delete Route Controller
module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");  
};

// Multi-Photo Gallery Upload Controller (Owner Only)
module.exports.uploadPhotos = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    // Strict backend owner authorization check
    if (!req.user || !listing.owner || !listing.owner.equals(req.user._id)) {
        req.flash("error", "You are not authorized to upload photos to this listing.");
        return res.redirect(`/listings/${id}`);
    }

    if (!req.files || req.files.length === 0) {
        req.flash("error", "Please select at least one valid photo to upload.");
        return res.redirect(`/listings/${id}`);
    }

    const uploadedPhotos = req.files.map((file) => ({
        url: file.path,
        filename: file.filename || "listinggallery",
        uploadedAt: new Date()
    }));

    if (!Array.isArray(listing.images)) {
        listing.images = [];
    }

    listing.images.push(...uploadedPhotos);

    // If the listing had no primary cover image, assign the first uploaded photo
    if (!listing.image || !listing.image.url) {
        listing.image = {
            url: uploadedPhotos[0].url,
            filename: uploadedPhotos[0].filename
        };
    }

    await listing.save();

    const count = uploadedPhotos.length;
    req.flash("success", `Successfully added ${count} ${count === 1 ? "photo" : "photos"} to your property gallery!`);
    return req.session.save(() => res.redirect(`/listings/${id}`));
};

// Delete Individual Gallery Photo Controller (Owner Only)
module.exports.deletePhoto = async (req, res) => {
    const { id, photoId } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    // Strict backend owner authorization check
    if (!req.user || !listing.owner || !listing.owner.equals(req.user._id)) {
        req.flash("error", "You are not authorized to modify photos for this listing.");
        return res.redirect(`/listings/${id}`);
    }

    const targetPhoto = Array.isArray(listing.images)
        ? listing.images.find((img) => String(img._id) === String(photoId))
        : null;

    if (!targetPhoto) {
        req.flash("error", "Photo not found in gallery.");
        return res.redirect(`/listings/${id}`);
    }

    listing.images = listing.images.filter((img) => String(img._id) !== String(photoId));
    await listing.save();

    // Clean up underlying file from local uploads or Cloudinary if applicable
    if (targetPhoto.url && targetPhoto.url.startsWith("/uploads/listings/") && targetPhoto.filename) {
        const diskPath = path.join(uploadsDir, path.basename(targetPhoto.filename));
        fs.unlink(diskPath, () => {});
    } else if (hasCloudinaryCredentials && targetPhoto.filename && targetPhoto.filename.includes("namastejunction")) {
        cloudinary.uploader.destroy(targetPhoto.filename).catch(() => {});
    }

    req.flash("success", "Photo removed from gallery.");
    return req.session.save(() => res.redirect(`/listings/${id}`));
};
