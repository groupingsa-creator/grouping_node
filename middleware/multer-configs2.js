const multer = require("multer");

try {
  const MIME_TYPES = {
    "image/jpg": "jpg",
    "image/jpeg": "jpeg",
    "image/png": "png",
    "image/heic": "heic"
  };

  const storage = multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, "images");
    },
    filename: (req, file, callback) => {
      const nameWithoutExt = file.originalname.replace(/\.[^/.]+$/, "").split(" ").join("_");
      const extension = MIME_TYPES[file.mimetype];
      const filename = nameWithoutExt + "_" + Date.now() + "." + extension;
      callback(null, filename);
    }
  });

  module.exports = multer({ storage, limits: {
    fieldSize: 10 * 1024 * 1024, // Limite taille des champs texte (10 Mo)
    fileSize: 5 * 1024 * 1024,   // Limite taille de chaque image (5 Mo ici)
    files: 15                    // Max 15 fichiers
  } }).array("images", 15);
} catch (e) {
  console.log(e);
}
