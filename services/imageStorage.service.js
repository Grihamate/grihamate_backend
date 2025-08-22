// services/imageStorage.service.js
const ImageKit = require("imagekit");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

/**
 * Upload file buffer to ImageKit
 * @param {Object} file - multer file object
 * @returns {Promise<{url: string, fileId: string, name: string}>}
 */
const uploadFile = async (file) => {
  try {
    const result = await imagekit.upload({
      file: file.buffer, // buffer works directly (no need .toString("base64"))
      fileName: Date.now() + "-" + file.originalname,
      folder: "properties", // optional: organize files in ImageKit
    });

    return {
      url: result.url,
      fileId: result.fileId,
      name: result.name,
    };
  } catch (err) {
    throw new Error("Image upload failed: " + err.message);
  }
};

module.exports = { uploadFile };
