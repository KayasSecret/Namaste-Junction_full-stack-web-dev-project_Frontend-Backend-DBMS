const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const {
    storage,
    imageFileFilter,
    MAX_IMAGE_SIZE_BYTES,
    MAX_GALLERY_FILES_PER_UPLOAD
} = require("../cloudConfig.js");

const upload = multer({
    storage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: MAX_IMAGE_SIZE_BYTES,
        files: MAX_GALLERY_FILES_PER_UPLOAD
    }
});

// Middleware wrapper for multi-photo gallery upload with user-friendly validation errors
function uploadGalleryPhotos(req, res, next) {
    const multiUpload = upload.array("photos", MAX_GALLERY_FILES_PER_UPLOAD);
    multiUpload(req, res, (err) => {
        if (!err) return next();

        const redirectTarget = req.params.id ? `/listings/${req.params.id}` : "/listings";
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                req.flash("error", "Upload failed: Each photo must be 5 MB or smaller.");
            } else if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
                req.flash("error", `Upload failed: You can upload up to ${MAX_GALLERY_FILES_PER_UPLOAD} photos at a time.`);
            } else {
                req.flash("error", `Upload error: ${err.message}`);
            }
            return req.session.save(() => res.redirect(redirectTarget));
        }

        req.flash("error", err.message || "Invalid image file. Only JPG, PNG, and WEBP images are allowed.");
        return req.session.save(() => res.redirect(redirectTarget));
    });
}

// index (GET) and create (POST) Route
router
    .route("/")
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIn,
        upload.single("listing[image]"),
        validateListing,
        wrapAsync(listingController.createListing)
    );

// New Listing Route
router.get("/new", isLoggedIn, listingController.renderNewForm);

// Show (GET) , update (PUT) , delete (DELETE) Route
router
    .route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(
        isLoggedIn,
        isOwner,
        upload.single("listing[image]"),
        validateListing,
        wrapAsync(listingController.updateListing)
    )
    .delete(
        isLoggedIn,
        isOwner,
        wrapAsync(listingController.destroyListing)
    );

// Owner-Only Multi-Photo Gallery Upload & Photo Deletion Routes
router.post(
    "/:id/photos",
    isLoggedIn,
    isOwner,
    uploadGalleryPhotos,
    wrapAsync(listingController.uploadPhotos)
);

router.delete(
    "/:id/photos/:photoId",
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.deletePhoto)
);

// Edit Route
router.get(
    "/:id/edit",
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.renderEditForm)
);

// Property Availability & Booking Reservation Routes
const bookingController = require("../controllers/bookings.js");

router.get(
    "/:id/availability",
    wrapAsync(bookingController.checkAvailability)
);

router.post(
    "/:id/bookings",
    isLoggedIn,
    wrapAsync(bookingController.createBooking)
);

module.exports = router;