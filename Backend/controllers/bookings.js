const crypto = require("crypto");
const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");

// Per-listing mutex queue to prevent concurrent race-condition double bookings
const listingLocks = new Map();

async function withListingLock(listingId, taskFn) {
    const key = String(listingId);
    const previous = listingLocks.get(key) || Promise.resolve();
    let release;
    const current = new Promise((resolve) => {
        release = resolve;
    });
    listingLocks.set(key, previous.then(() => current));

    await previous;
    try {
        return await taskFn();
    } finally {
        release();
        if (listingLocks.get(key) === current) {
            listingLocks.delete(key);
        }
    }
}

function parseUTCDate(dateStr) {
    if (!dateStr || typeof dateStr !== "string") return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const d = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    if (
        Number.isNaN(d.getTime()) ||
        d.getUTCFullYear() !== year ||
        d.getUTCMonth() !== month - 1 ||
        d.getUTCDate() !== day
    ) {
        return null;
    }
    return d;
}

function getTodayUTC() {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
}

function formatDateISO(dateObj) {
    if (!dateObj) return "";
    const d = new Date(dateObj);
    return d.toISOString().slice(0, 10);
}

function calculateBookingPrice(listingPrice, nights) {
    const nightlyRate = Math.max(0, Number(listingPrice) || 0);
    const validNights = Math.max(1, Number(nights) || 1);
    const basePrice = nightlyRate * validNights;
    const taxAmount = Math.round(basePrice * 0.18);
    const totalPrice = basePrice + taxAmount;
    return {
        nightlyRate,
        nights: validNights,
        basePrice,
        taxAmount,
        totalPrice,
    };
}

function generateBookingCode() {
    const now = new Date();
    const ymd = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
    const token = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `NJ-${ymd}-${token}`;
}

// GET /listings/:id/availability — Real-time JSON availability & server-side price check
module.exports.checkAvailability = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        return res.status(404).json({ available: false, message: "Property listing not found." });
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

    const { checkIn, checkOut } = req.query;
    if (!checkIn || !checkOut) {
        return res.json({
            available: true,
            reservedRanges,
            nightlyRate: Number(listing.price) || 0,
        });
    }

    const checkInDate = parseUTCDate(checkIn);
    const checkOutDate = parseUTCDate(checkOut);

    if (!checkInDate || !checkOutDate) {
        return res.status(400).json({
            available: false,
            reservedRanges,
            message: "Please select valid check-in and check-out dates.",
        });
    }

    if (checkInDate < todayUTC) {
        return res.status(400).json({
            available: false,
            reservedRanges,
            message: "Check-in date cannot be in the past.",
        });
    }

    if (checkOutDate <= checkInDate) {
        return res.status(400).json({
            available: false,
            reservedRanges,
            message: "Check-out date must be at least 1 night after check-in.",
        });
    }

    const nights = Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    if (nights > 60) {
        return res.status(400).json({
            available: false,
            reservedRanges,
            message: "Maximum stay duration is 60 nights.",
        });
    }

    const conflict = activeBookings.find(
        (b) => b.checkIn < checkOutDate && b.checkOut > checkInDate
    );

    const priceBreakdown = calculateBookingPrice(listing.price, nights);

    if (conflict) {
        return res.json({
            available: false,
            reservedRanges,
            priceBreakdown,
            message: `Unavailable for selected dates (already reserved ${formatDateISO(conflict.checkIn)} to ${formatDateISO(conflict.checkOut)}).`,
        });
    }

    return res.json({
        available: true,
        reservedRanges,
        priceBreakdown,
        message: "Dates are available for instant reservation!",
    });
};

// POST /listings/:id/bookings — Create a new reservation with concurrency lock & server-side validation
module.exports.createBooking = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("owner");

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return req.session.save(() => res.redirect("/listings"));
    }

    if (!req.user) {
        req.flash("error", "Please log in to reserve a stay.");
        return req.session.save(() => res.redirect("/login"));
    }

    // Business rule: Property owners cannot book their own property
    if (listing.owner && listing.owner._id.equals(req.user._id)) {
        req.flash("error", "Hosts cannot book their own property listing.");
        return req.session.save(() => res.redirect(`/listings/${id}`));
    }

    const payload = req.body.booking || req.body || {};
    const checkInDate = parseUTCDate(payload.checkIn);
    const checkOutDate = parseUTCDate(payload.checkOut);
    const guestsCount = Number.parseInt(payload.guestsCount, 10) || 2;
    const paymentMethod = payload.paymentMethod === "online_pending" ? "online_pending" : "pay_at_property";
    const specialRequests = typeof payload.specialRequests === "string"
        ? payload.specialRequests.trim().slice(0, 400)
        : "";

    const todayUTC = getTodayUTC();

    if (!checkInDate || !checkOutDate) {
        req.flash("error", "Please provide valid check-in and check-out dates.");
        return req.session.save(() => res.redirect(`/listings/${id}`));
    }

    if (checkInDate < todayUTC) {
        req.flash("error", "Check-in date cannot be in the past.");
        return req.session.save(() => res.redirect(`/listings/${id}`));
    }

    if (checkOutDate <= checkInDate) {
        req.flash("error", "Check-out date must be after the check-in date.");
        return req.session.save(() => res.redirect(`/listings/${id}`));
    }

    const nights = Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    if (nights < 1 || nights > 60) {
        req.flash("error", "Stay duration must be between 1 and 60 nights.");
        return req.session.save(() => res.redirect(`/listings/${id}`));
    }

    if (guestsCount < 1 || guestsCount > 12) {
        req.flash("error", "Guest count must be between 1 and 12 guests.");
        return req.session.save(() => res.redirect(`/listings/${id}`));
    }

    const priceData = calculateBookingPrice(listing.price, nights);

    // Serialize concurrent booking attempts for this listing
    const result = await withListingLock(listing._id, async () => {
        const overlappingBooking = await Booking.findOne({
            listing: listing._id,
            status: "confirmed",
            checkIn: { $lt: checkOutDate },
            checkOut: { $gt: checkInDate },
        });

        if (overlappingBooking) {
            return {
                conflict: true,
                conflictRange: `${formatDateISO(overlappingBooking.checkIn)} to ${formatDateISO(overlappingBooking.checkOut)}`,
            };
        }

        const newBooking = new Booking({
            bookingCode: generateBookingCode(),
            listing: listing._id,
            guest: req.user._id,
            host: listing.owner ? listing.owner._id : req.user._id,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            nights: priceData.nights,
            guestsCount,
            nightlyRate: priceData.nightlyRate,
            basePrice: priceData.basePrice,
            taxAmount: priceData.taxAmount,
            totalPrice: priceData.totalPrice,
            status: "confirmed",
            paymentMethod,
            paymentStatus: paymentMethod === "online_pending" ? "pending" : "pay_at_property",
            specialRequests,
        });

        await newBooking.save();
        return { conflict: false, booking: newBooking };
    });

    if (result.conflict) {
        req.flash(
            "error",
            `Sorry, those dates are already reserved (${result.conflictRange}). Please choose different dates.`
        );
        return req.session.save(() => res.redirect(`/listings/${id}`));
    }

    req.flash(
        "success",
        `Reservation Confirmed! Your Booking ID is ${result.booking.bookingCode}.`
    );
    return req.session.save(() => res.redirect(`/bookings/${result.booking._id}`));
};

// GET /bookings — Unified Guest Trips & Host Reservations Dashboard
module.exports.listBookings = async (req, res) => {
    const guestBookings = await Booking.find({ guest: req.user._id })
        .populate("listing")
        .populate("host", "username email fullName")
        .sort({ createdAt: -1 });

    const hostBookings = await Booking.find({ host: req.user._id })
        .populate("listing")
        .populate("guest", "username email fullName phone")
        .sort({ createdAt: -1 });

    const todayUTC = getTodayUTC();

    res.render("bookings/index.ejs", {
        guestBookings,
        hostBookings,
        todayUTC,
    });
};

// GET /bookings/:bookingId — Booking Confirmation Receipt & Details
module.exports.showBooking = async (req, res) => {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId)
        .populate("listing")
        .populate("guest", "username email fullName phone")
        .populate("host", "username email fullName phone");

    if (!booking) {
        req.flash("error", "Reservation not found.");
        return req.session.save(() => res.redirect("/bookings"));
    }

    const isGuest = booking.guest && booking.guest._id.equals(req.user._id);
    const isHost = booking.host && booking.host._id.equals(req.user._id);

    if (!isGuest && !isHost) {
        req.flash("error", "Access denied: You are not authorized to view another user's reservation.");
        return req.session.save(() => res.redirect("/bookings"));
    }

    const todayUTC = getTodayUTC();
    res.render("bookings/show.ejs", {
        booking,
        isGuest,
        isHost,
        todayUTC,
    });
};

// PATCH / POST /bookings/:bookingId/cancel — Cancel Reservation (Guest or Host)
module.exports.cancelBooking = async (req, res) => {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
        req.flash("error", "Reservation not found.");
        return req.session.save(() => res.redirect("/bookings"));
    }

    const isGuest = booking.guest && booking.guest.equals(req.user._id);
    const isHost = booking.host && booking.host.equals(req.user._id);

    if (!isGuest && !isHost) {
        req.flash("error", "Access denied: You cannot cancel another user's reservation.");
        return req.session.save(() => res.redirect("/bookings"));
    }

    if (booking.status === "cancelled") {
        req.flash("error", "This reservation has already been cancelled.");
        return req.session.save(() => res.redirect(`/bookings/${booking._id}`));
    }

    if (booking.status === "completed") {
        req.flash("error", "Completed stays cannot be cancelled.");
        return req.session.save(() => res.redirect(`/bookings/${booking._id}`));
    }

    booking.status = "cancelled";
    booking.cancelledBy = isGuest ? "guest" : "host";
    booking.cancelledAt = new Date();
    if (booking.paymentStatus === "paid") {
        booking.paymentStatus = "refunded";
    }
    await booking.save();

    req.flash("success", `Reservation ${booking.bookingCode} has been cancelled and dates have been released.`);
    const redirectBack = req.query.from === "dashboard" ? "/bookings" : `/bookings/${booking._id}`;
    return req.session.save(() => res.redirect(redirectBack));
};

// PATCH / POST /bookings/:bookingId/status — Host-Only Reservation Management
module.exports.updateHostBookingStatus = async (req, res) => {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
        req.flash("error", "Reservation not found.");
        return req.session.save(() => res.redirect("/bookings"));
    }

    const isHost = booking.host && booking.host.equals(req.user._id);
    if (!isHost) {
        req.flash("error", "Access denied: Only the property host can update reservation status.");
        return req.session.save(() => res.redirect("/bookings"));
    }

    const { status, paymentStatus } = req.body;
    if (status && ["confirmed", "completed", "cancelled"].includes(status)) {
        booking.status = status;
        if (status === "cancelled" && !booking.cancelledAt) {
            booking.cancelledBy = "host";
            booking.cancelledAt = new Date();
        }
    }

    if (paymentStatus && ["pay_at_property", "pending", "paid", "refunded"].includes(paymentStatus)) {
        booking.paymentStatus = paymentStatus;
    }

    await booking.save();

    req.flash("success", `Updated reservation ${booking.bookingCode}.`);
    const redirectBack = req.query.from === "dashboard" ? "/bookings" : `/bookings/${booking._id}`;
    return req.session.save(() => res.redirect(redirectBack));
};

module.exports.getTodayUTC = getTodayUTC;
module.exports.formatDateISO = formatDateISO;
