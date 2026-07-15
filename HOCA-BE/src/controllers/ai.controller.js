/**
 * AI Controller - Handles AI Study Assistant endpoints (Fastify format)
 * Supports Server-Sent Events (SSE) for streaming responses
 */

const aiService = require('../services/ai.service');
const Room = require('../models/Room');
const AIConversation = require('../models/AIConversation');

const getScope = (value) => value === 'ROOM' ? 'ROOM' : 'MAIN';

const validateRoomScope = async (scope, roomId, user) => {
    if (scope !== 'ROOM') return;
    if (!roomId) {
        throw Object.assign(new Error('Thiếu thông tin phòng thảo luận.'), { status: 400 });
    }
    const room = await Room.findById(roomId).select('roomType owner activeParticipants');
    if (!room || room.roomType !== 'DISCUSSION') {
        throw Object.assign(new Error('Phòng thảo luận không hợp lệ.'), { status: 404 });
    }
    const userId = String(user?._id || user?.id || '');
    const isActiveParticipant = room.activeParticipants.some(
        (participantId) => String(participantId) === userId,
    );
    const isOwner = String(room.owner || '') === userId;
    const isAdmin = user?.role === 'ADMIN';
    if (!isActiveParticipant && !isOwner && !isAdmin) {
        throw Object.assign(new Error('Bạn phải tham gia phòng để sử dụng HOCA AI.'), { status: 403 });
    }
};

/**
 * GET /api/ai/status
 * Get AI availability and remaining questions for user
 */
const getStatus = async (request, reply) => {
    try {
        if (!request.user) {
            return reply.status(401).send({ message: 'Unauthorized' });
        }
        const scope = getScope(request.query?.scope);
        await validateRoomScope(scope, request.query?.roomId, request.user);
        const status = await aiService.getAIStatus(request.user, scope);
        return reply.send(status);
    } catch (error) {
        console.error('AI status error:', error.message, error.stack);
        return reply.status(500).send({ message: 'Failed to get AI status', error: error.message });
    }
};

/**
 * POST /api/ai/chat
 * Stream AI response using Server-Sent Events
 * 
 * Body: { question: string, history?: Array<{role, content}> }
 */
const streamChat = async (request, reply) => {
    const { question, history = [], scope: requestedScope, roomId } = request.body || {};
    const scope = getScope(requestedScope);

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
        return reply.status(400).send({ message: 'Question is required' });
    }

    if (question.length > 2000) {
        return reply.status(400).send({ message: 'Question too long (max 2000 characters)' });
    }

    // Set up SSE headers
    const origin = request.headers.origin;
    const allowedOrigins = [
        'http://localhost:3000',
        'https://hoca.asia',
        'https://www.hoca.asia',
        'https://hoca-six.vercel.app'
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
        reply.raw.setHeader('Access-Control-Allow-Origin', origin);
        reply.raw.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    try {
        await validateRoomScope(scope, roomId, request.user);
        // Stream AI response
        for await (const chunk of aiService.streamAIResponse(question.trim(), request.user, history, scope)) {
            // Send SSE event
            reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }

        // End stream
        reply.raw.write('data: [DONE]\n\n');
        reply.raw.end();

    } catch (error) {
        console.error('AI chat stream error:', error);
        reply.raw.write(`data: ${JSON.stringify({ type: 'error', content: 'Stream error occurred' })}\n\n`);
        reply.raw.end();
    }
};

/**
 * POST /api/ai/ask
 * Non-streaming AI question (simpler endpoint)
 * 
 * Body: { question: string, history?: Array<{role, content}> }
 */
const askQuestion = async (request, reply) => {
    const { question, history = [], scope: requestedScope, roomId, conversationId } = request.body || {};
    const scope = getScope(requestedScope);

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
        return reply.status(400).send({ message: 'Question is required' });
    }

    if (question.length > 2000) {
        return reply.status(400).send({ message: 'Question too long (max 2000 characters)' });
    }

    try {
        await validateRoomScope(scope, roomId, request.user);
        const subject = String(request.body?.subject || 'Chung').trim().slice(0, 80);
        const explanationLevel = ['SIMPLE', 'STANDARD', 'ADVANCED'].includes(request.body?.explanationLevel)
            ? request.body.explanationLevel : 'STANDARD';
        const result = await aiService.askAI(question.trim(), request.user, history, scope, { subject, explanationLevel });
        let savedConversationId = conversationId;
        let savedMessageId = null;
        if (scope === 'MAIN') {
            let conversation = conversationId
                ? await AIConversation.findOne({ _id: conversationId, user: request.user._id })
                : null;
            if (!conversation) {
                conversation = await AIConversation.create({
                    user: request.user._id,
                    title: question.trim().slice(0, 80),
                    subject,
                    explanationLevel,
                });
            } else {
                conversation.subject = subject;
                conversation.explanationLevel = explanationLevel;
            }
            conversation.messages.push(
                { role: 'user', content: question.trim() },
                { role: 'assistant', content: result.response, sources: result.sources || [] },
            );
            await conversation.save();
            savedConversationId = conversation._id;
            savedMessageId = conversation.messages[conversation.messages.length - 1]._id;
        }
        return reply.send({
            success: true,
            response: result.response,
            remaining: result.remaining,
            conversationId: savedConversationId,
            messageId: savedMessageId,
            sources: result.sources || [],
        });
    } catch (error) {
        console.error('AI ask error:', error);

        if (error.code === 'AI_DAILY_LIMIT_REACHED' || error.code === 'ROOM_AI_PREMIUM_REQUIRED') {
            return reply.status(error.status || 429).send({
                success: false,
                message: error.message,
                limitReached: error.code === 'AI_DAILY_LIMIT_REACHED',
                premiumRequired: error.code === 'ROOM_AI_PREMIUM_REQUIRED'
            });
        }

        return reply.status(error.status || 500).send({
            success: false,
            message: error.status ? error.message : 'Failed to get AI response'
        });
    }
};

const listConversations = async (request, reply) => {
    const items = await AIConversation.find({ user: request.user._id })
        .select('title subject explanationLevel updatedAt messages')
        .sort('-updatedAt').limit(100).lean();
    reply.send(items.map((item) => ({ ...item, messageCount: item.messages?.length || 0, messages: undefined })));
};
const getConversation = async (request, reply) => {
    const item = await AIConversation.findOne({ _id: request.params.id, user: request.user._id });
    if (!item) return reply.code(404).send({ message: 'Không tìm thấy cuộc trò chuyện' });
    reply.send(item);
};
const updateConversation = async (request, reply) => {
    const updates = {};
    if (request.body?.title) updates.title = String(request.body.title).trim().slice(0, 120);
    if (request.body?.subject) updates.subject = String(request.body.subject).trim().slice(0, 80);
    if (['SIMPLE', 'STANDARD', 'ADVANCED'].includes(request.body?.explanationLevel)) updates.explanationLevel = request.body.explanationLevel;
    const item = await AIConversation.findOneAndUpdate({ _id: request.params.id, user: request.user._id }, updates, { new: true });
    if (!item) return reply.code(404).send({ message: 'Không tìm thấy cuộc trò chuyện' });
    reply.send(item);
};
const deleteConversation = async (request, reply) => {
    const result = await AIConversation.deleteOne({ _id: request.params.id, user: request.user._id });
    if (!result.deletedCount) return reply.code(404).send({ message: 'Không tìm thấy cuộc trò chuyện' });
    reply.send({ success: true });
};
const rateMessage = async (request, reply) => {
    const feedback = ['UP', 'DOWN', null].includes(request.body?.feedback) ? request.body.feedback : null;
    const item = await AIConversation.findOneAndUpdate(
        { _id: request.params.id, user: request.user._id, 'messages._id': request.params.messageId },
        { $set: { 'messages.$.feedback': feedback } },
        { new: true },
    );
    if (!item) return reply.code(404).send({ message: 'Không tìm thấy câu trả lời' });
    reply.send({ success: true });
};

/**
 * GET /api/ai/usage
 * Get user's AI usage statistics
 */
const getUsage = async (request, reply) => {
    try {
        const AIUsage = require('../models/AIUsage');
        const usage = await AIUsage.getTodayUsage(request.user._id);
        const limitInfo = await aiService.checkAILimit(request.user, 'MAIN');

        return reply.send({
            today: {
                questionsAsked: limitInfo.isPremium
                    ? usage.questionCount
                    : (usage.freeMainQuestionCount || 0),
                remaining: limitInfo.remaining,
                limit: limitInfo.limit
            },
            isPremium: limitInfo.isPremium
        });
    } catch (error) {
        console.error('AI usage error:', error);
        return reply.status(500).send({ message: 'Failed to get usage' });
    }
};

module.exports = {
    getStatus,
    streamChat,
    askQuestion,
    getUsage
    ,listConversations
    ,getConversation
    ,updateConversation
    ,deleteConversation
    ,rateMessage
};
