const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/bookings.js");

// Guest Trips & Host Reservations Dashboard
router.get("/", isLoggedIn, wrapAsync(bookingController.listBookings));

// Single Booking Confirmation Voucher & Details
router.get("/:bookingId", isLoggedIn, wrapAsync(bookingController.showBooking));

// Cancel Reservation (Guest or Host)
router.patch("/:bookingId/cancel", isLoggedIn, wrapAsync(bookingController.cancelBooking));
router.post("/:bookingId/cancel", isLoggedIn, wrapAsync(bookingController.cancelBooking));

module.exports = router;
