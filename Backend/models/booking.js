const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    bookingCode: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true,
        index: true,
    },
    guest: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    host: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    checkIn: {
        type: Date,
        required: true,
        index: true,
    },
    checkOut: {
        type: Date,
        required: true,
        index: true,
    },
    nights: {
        type: Number,
        required: true,
        min: 1,
        max: 60,
    },
    guestsCount: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
        default: 2,
    },
    roomType: {
        code: { type: String, default: "deluxe" },
        name: { type: String, default: "Deluxe Room" },
        nightlyRate: { type: Number, default: 0 },
        bedConfig: { type: String, default: "1 King Bed" },
    },
    roomsCount: {
        type: Number,
        default: 1,
        min: 1,
    },
    extraGuestCharges: {
        type: Number,
        default: 0,
        min: 0,
    },
    gstRate: {
        type: Number,
        default: 0.18,
    },
    gstLabel: {
        type: String,
        default: "GST (18%)",
    },
    nightlyRate: {
        type: Number,
        required: true,
        min: 0,
    },
    basePrice: {
        type: Number,
        required: true,
        min: 0,
    },
    taxAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: ["confirmed", "cancelled", "completed"],
        default: "confirmed",
        index: true,
    },
    paymentMethod: {
        type: String,
        enum: ["pay_at_property", "online_pending"],
        default: "pay_at_property",
    },
    paymentStatus: {
        type: String,
        enum: ["pay_at_property", "pending", "paid", "refunded"],
        default: "pay_at_property",
    },
    specialRequests: {
        type: String,
        default: "",
        trim: true,
        maxlength: 400,
    },
    cancelledBy: {
        type: String,
        enum: ["guest", "host", null],
        default: null,
    },
    cancelledAt: {
        type: Date,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Compound index to accelerate overlap lookups on active reservations for a listing
bookingSchema.index({ listing: 1, status: 1, checkIn: 1, checkOut: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
