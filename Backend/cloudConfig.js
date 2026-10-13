const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const hasCloudinaryCredentials = Boolean(
    process.env.CLOUD_NAME &&
    process.env.CLOUD_API_KEY &&
    process.env.CLOUD_API_SECRET
);

if (hasCloudinaryCredentials) {
    cloudinary.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.CLOUD_API_KEY,
        api_secret: process.env.CLOUD_API_SECRET
    });
}

const uploadsDir = path.join(__dirname, "../Frontend/public/uploads/listings");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_IMAGE_MIMES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
]);

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per image
const MAX_GALLERY_FILES_PER_UPLOAD = 10;

// Persistent local storage engine compatible with Multer & CloudinaryStorage output shape ({ path, filename })
const localGalleryStorage = {
    _handleFile(req, file, cb) {
        const ext = (path.extname(file.originalname || "") || ".jpg").toLowerCase();
        const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : ".jpg";
        const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
        const filename = `nj-stay-${uniqueSuffix}${safeExt}`;
        const fullDiskPath = path.join(uploadsDir, filename);
        const publicUrl = `/uploads/listings/${filename}`;

        const outStream = fs.createWriteStream(fullDiskPath);
        file.stream.pipe(outStream);
        outStream.on("error", (err) => cb(err));
        outStream.on("finish", () => {
            cb(null, {
                path: publicUrl,
                filename: filename,
                size: outStream.bytesWritten
            });
        });
    },
    _removeFile(req, file, cb) {
        if (!file || !file.filename) return cb(null);
        const fullDiskPath = path.join(uploadsDir, path.basename(file.filename));
        fs.unlink(fullDiskPath, () => cb(null));
    }
};

const storage = hasCloudinaryCredentials
    ? new CloudinaryStorage({
          cloudinary: cloudinary,
          params: {
              folder: "namastejunction_DEV",
              allowedFormats: ["png", "jpg", "jpeg", "webp"]
          }
      })
    : localGalleryStorage;

function imageFileFilter(req, file, cb) {
    const ext = (path.extname(file.originalname || "") || "").toLowerCase();
    const mimeOk = ALLOWED_IMAGE_MIMES.has((file.mimetype || "").toLowerCase());
    const extOk = ALLOWED_EXTENSIONS.has(ext);
    if (!mimeOk || !extOk) {
        const err = new Error("Only JPG, JPEG, PNG, and WEBP image files are allowed.");
        err.code = "INVALID_FILE_TYPE";
        return cb(err, false);
    }
    cb(null, true);
}

module.exports = {
    cloudinary,
    storage,
    hasCloudinaryCredentials,
    uploadsDir,
    imageFileFilter,
    MAX_IMAGE_SIZE_BYTES,
    MAX_GALLERY_FILES_PER_UPLOAD
};
