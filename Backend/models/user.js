const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
    },
    fullName: {
        type: String,
        default: "",
        trim: true,
    },
    bio: {
        type: String,
        default: "",
        trim: true,
    },
    location: {
        type: String,
        default: "",
        trim: true,
    },
    phone: {
        type: String,
        default: "",
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);