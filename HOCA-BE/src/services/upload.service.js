const cloudinary = require('../config/cloudinary');

/**
 * Upload an image buffer to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {Object} options - Upload options
 * @param {string} options.folder - Cloudinary folder (e.g., 'avatars', 'badges')
 * @param {string} options.publicId - Optional public ID for the image
 * @param {Object} options.transformation - Optional transformations
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadImage = async (fileBuffer, options = {}) => {
    const { folder = 'uploads', publicId, transformation } = options;

    return new Promise((resolve, reject) => {
        const uploadOptions = {
            folder,
            resource_type: 'image',
        };

        if (publicId) {
            uploadOptions.public_id = publicId;
            uploadOptions.overwrite = true;
        }

        if (transformation) {
            uploadOptions.transformation = transformation;
        }

        // For avatars, apply default transformations
        if (folder === 'avatars') {
            uploadOptions.transformation = [
                { width: 200, height: 200, crop: 'fill', gravity: 'face' },
                { quality: 'auto', fetch_format: 'auto' }
            ];
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id
                    });
                }
            }
        );

        uploadStream.end(fileBuffer);
    });
};

const uploadDocument = async (fileBuffer, options = {}) => {
    const { folder = 'discussion-documents', filename } = options;
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'raw',
                public_id: filename ? `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}` : undefined,
            },
            (error, result) => {
                if (error) reject(error);
                else resolve({ url: result.secure_url, publicId: result.public_id });
            },
        );
        uploadStream.end(fileBuffer);
    });
};

const uploadMedia = async (fileBuffer, options = {}) => {
    const { folder = 'ad-media', resourceType = 'image' } = options;
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType,
                quality: resourceType === 'image' ? 'auto' : undefined,
                fetch_format: resourceType === 'image' ? 'auto' : undefined,
            },
            (error, result) => {
                if (error) reject(error);
                else resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                    resourceType: result.resource_type,
                    bytes: result.bytes,
                    width: result.width,
                    height: result.height,
                    duration: result.duration,
                });
            },
        );
        uploadStream.end(fileBuffer);
    });
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<void>}
 */
const deleteImage = async (publicId, resourceType = 'image') => {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = {
    uploadImage,
    uploadMedia,
    uploadDocument,
    deleteImage
};
