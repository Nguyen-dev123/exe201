const { uploadImage, uploadMedia, uploadDocument } = require('../services/upload.service');
const { protect, admin } = require('../middlewares/auth.middleware');

const isSupportedImageBuffer = (buffer, mimetype) => {
    if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;
    const hex = buffer.subarray(0, 12).toString('hex');
    if (mimetype === 'image/jpeg') return hex.startsWith('ffd8ff');
    if (mimetype === 'image/png') return hex.startsWith('89504e470d0a1a0a');
    if (mimetype === 'image/gif') return /^GIF8[79]a$/.test(buffer.subarray(0, 6).toString('ascii'));
    if (mimetype === 'image/webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    return false;
};

const uploadRoutes = async (app) => {
    // Upload avatar
    app.post('/avatar', {
        preHandler: [protect]
    }, async (request, reply) => {
        try {
            const data = await request.file();

            if (!data) {
                return reply.status(400).send({ error: 'No file uploaded' });
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!allowedTypes.includes(data.mimetype)) {
                return reply.status(400).send({ error: 'Invalid file type. Allowed: jpeg, png, webp, gif' });
            }

            // Read file buffer
            const buffer = await data.toBuffer();
            if (!isSupportedImageBuffer(buffer, data.mimetype)) {
                return reply.status(400).send({ error: 'Nội dung tệp không khớp với định dạng ảnh.' });
            }

            // Upload to Cloudinary
            const result = await uploadImage(buffer, {
                folder: 'avatars',
                publicId: `user_${request.user.id}` // Use user ID as public ID for easy overwrite
            });

            // Update user avatar in database
            const User = require('mongoose').model('User');
            await User.findByIdAndUpdate(request.user.id, { avatar: result.url });

            return {
                success: true,
                url: result.url
            };
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to upload avatar' });
        }
    });

    // General image upload (for admin/badges etc.)
    app.post('/image', {
        preHandler: [protect]
    }, async (request, reply) => {
        try {
            const data = await request.file();

            if (!data) {
                return reply.status(400).send({ error: 'No file uploaded' });
            }

            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!allowedTypes.includes(data.mimetype)) {
                return reply.status(400).send({ error: 'Invalid image type' });
            }
            const buffer = await data.toBuffer();
            if (!isSupportedImageBuffer(buffer, data.mimetype)) {
                return reply.status(400).send({ error: 'Nội dung tệp không khớp với định dạng ảnh.' });
            }

            // Get folder from query or default to 'uploads'
            const allowedFolders = new Set(['uploads', 'badges', 'backgrounds', 'discussion']);
            const folder = allowedFolders.has(request.query.folder) ? request.query.folder : 'uploads';

            const result = await uploadImage(buffer, { folder });

            return {
                success: true,
                url: result.url,
                publicId: result.publicId
            };
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to upload image' });
        }
    });

    app.post('/ad-media', {
        preHandler: [protect, admin]
    }, async (request, reply) => {
        try {
            const data = await request.file({
                limits: { files: 1, fileSize: 25 * 1024 * 1024 }
            });
            if (!data) {
                return reply.status(400).send({ message: 'Vui lòng chọn một tệp để tải lên.' });
            }

            const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            const videoTypes = ['video/mp4', 'video/webm'];
            const isImage = imageTypes.includes(data.mimetype);
            const isVideo = videoTypes.includes(data.mimetype);
            if (!isImage && !isVideo) {
                return reply.status(400).send({ message: 'Chỉ hỗ trợ JPG, PNG, WEBP, GIF, MP4 hoặc WEBM.' });
            }

            const buffer = await data.toBuffer();
            const maxBytes = isImage ? 5 * 1024 * 1024 : 25 * 1024 * 1024;
            if (buffer.length > maxBytes) {
                return reply.status(400).send({
                    message: isImage ? 'Ảnh không được vượt quá 5 MB.' : 'Video không được vượt quá 25 MB.'
                });
            }

            const result = await uploadMedia(buffer, {
                folder: 'hoca/ads',
                resourceType: isImage ? 'image' : 'video'
            });
            return { success: true, type: isImage ? 'image' : 'video', ...result };
        } catch (error) {
            request.log.error(error);
            if (error?.code === 'FST_INVALID_MULTIPART_CONTENT_TYPE') {
                return reply.status(400).send({ message: 'Vui lòng gửi tệp theo định dạng multipart/form-data.' });
            }
            if (error?.code === 'FST_REQ_FILE_TOO_LARGE') {
                return reply.status(400).send({ message: 'Tệp tải lên vượt quá giới hạn cho phép.' });
            }
            return reply.status(500).send({ message: 'Không thể tải media lên. Vui lòng thử lại.' });
        }
    });

    app.post('/discussion-document', {
        preHandler: [protect]
    }, async (request, reply) => {
        try {
            const subscriptionService = require('../services/subscription.service');
            if (request.user.role !== 'ADMIN' && subscriptionService.getEffectiveTier(request.user) === 'FREE') {
                return reply.status(403).send({ error: 'Tải tài liệu trong Phòng Thảo luận chỉ dành cho HOCA+.' });
            }
            const data = await request.file();
            if (!data) return reply.status(400).send({ error: 'No file uploaded' });
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/plain',
                'image/jpeg',
                'image/png',
                'image/webp',
            ];
            if (!allowedTypes.includes(data.mimetype)) {
                return reply.status(400).send({ error: 'Chỉ hỗ trợ PDF, Word, PowerPoint, ảnh và tệp văn bản.' });
            }
            const result = await uploadDocument(await data.toBuffer(), { filename: data.filename });
            return { success: true, url: result.url, publicId: result.publicId, name: data.filename };
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Không thể tải tài liệu lên.' });
        }
    });

    app.post('/support-attachment', { preHandler: [protect] }, async (request, reply) => {
        try {
            const data = await request.file({ limits: { files: 1, fileSize: 25 * 1024 * 1024 } });
            if (!data) return reply.status(400).send({ error: 'No file uploaded' });
            const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            const videoTypes = ['video/mp4', 'video/webm'];
            if (![...imageTypes, ...videoTypes].includes(data.mimetype)) return reply.status(400).send({ error: 'Chỉ hỗ trợ ảnh JPG, PNG, WEBP, GIF hoặc video MP4, WEBM.' });
            const result = await uploadMedia(await data.toBuffer(), { folder: 'hoca/support', resourceType: imageTypes.includes(data.mimetype) ? 'image' : 'video' });
            return { success: true, url: result.url, type: imageTypes.includes(data.mimetype) ? 'image' : 'video', name: data.filename };
        } catch (error) {
            request.log.error(error);
            return reply.status(error?.code === 'FST_REQ_FILE_TOO_LARGE' ? 400 : 500).send({ error: error?.code === 'FST_REQ_FILE_TOO_LARGE' ? 'Tệp vượt quá 25 MB.' : 'Không thể tải tệp hỗ trợ lên.' });
        }
    });
};

module.exports = uploadRoutes;
