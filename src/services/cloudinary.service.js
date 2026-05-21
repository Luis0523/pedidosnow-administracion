const { v2: cloudinary } = require('cloudinary');

const config = require('../config');
const { BadRequestError } = require('../utils/errors');

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret
});

const isConfigured = () => {
  return !!(config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret);
};

const uploadImage = async ({ imageBase64, folder, publicId }) => {
  if (!imageBase64) {
    throw new BadRequestError('imageBase64 es requerido.');
  }

  if (!isConfigured()) {
    return { url: null, publicId: null };
  }

  const source = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const uploadResult = await cloudinary.uploader.upload(source, {
    folder: `${config.cloudinary.folder}/${folder}`,
    public_id: publicId,
    overwrite: true,
    resource_type: 'image'
  });

  return {
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id
  };
};

module.exports = {
  uploadImage
};
