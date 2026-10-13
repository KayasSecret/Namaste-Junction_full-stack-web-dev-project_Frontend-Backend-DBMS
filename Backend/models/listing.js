const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        url: String,
        filename: String
    },
    images: [
        {
            url: {
                type: String,
                required: true,
            },
            filename: {
                type: String,
                default: "listinggallery",
            },
            uploadedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    price: Number,
    location: String,
    country: String,
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        },
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    roomTypes: [
        {
            code: {
                type: String,
                required: true,
                trim: true,
            },
            name: {
                type: String,
                required: true,
                trim: true,
            },
            price: {
                type: Number,
                required: true,
                min: 0,
            },
            baseOccupancy: {
                type: Number,
                default: 2,
                min: 1,
            },
            maxOccupancy: {
                type: Number,
                required: true,
                min: 1,
            },
            extraGuestRate: {
                type: Number,
                default: 0,
                min: 0,
            },
            bedConfig: {
                type: String,
                default: "1 King Bed",
            },
            roomSize: {
                type: String,
                default: "350 sq.ft",
            },
            amenities: {
                type: [String],
                default: [],
            },
            description: {
                type: String,
                default: "",
            },
            isAvailable: {
                type: Boolean,
                default: true,
            },
        },
    ],
});

listingSchema.post("findOneAndDelete", async (listing) => {
    if(listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews }});
    }
});

// Generate default room types if not provided
const { getDefaultRoomTypes } = require("../utils/pricing.js");

listingSchema.pre("save", function (next) {
    if (!this.roomTypes || this.roomTypes.length === 0) {
        this.roomTypes = getDefaultRoomTypes(this.price || 3000);
    }
    next();
});

listingSchema.methods.getRoomTypes = function () {
    if (this.roomTypes && this.roomTypes.length > 0) {
        return this.roomTypes;
    }
    return getDefaultRoomTypes(this.price || 3000);
};

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;