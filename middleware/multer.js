// middlewares/multer.js
const multer = require("multer");
const { cloudinary } = require("./cloudinaryConfig");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith("image/");
    if (!isImage) throw new Error("Fichier non image");

    return {
      folder: "grouping",
      resource_type: "image",

      // ✅ Important: on laisse Cloudinary choisir le meilleur format (avif/webp/jpeg)
      // ne force pas allowed_formats sinon tu bloques avif/webp
      // allowed_formats: ["jpg", "jpeg", "heic", "png"],

      transformation: [
        // 1) redimensionnement "safe" (pas d'upscale)
        { width: 1440, height: 1440, crop: "limit" },

        // 2) compression + format auto + suppression metadata
        { quality: "auto:good", fetch_format: "auto", flags: "strip_profile" },

        // 3) (optionnel) activer compression progressive pour JPEG si jamais
        { flags: "progressive" },
      ],
    };
  },
});

const multerInstance = multer({ storage });

const handleUpload = (req, res, next) => {
  multerInstance.single("image")(req, res, function (err) {
    if (err) {
      console.error("Erreur upload multer :", err);
      return res.status(400).json({
        error: "Échec de l’upload du fichier.",
        details: err.message,
      });
    }
    next();
  });
};

module.exports = { handleUpload };
