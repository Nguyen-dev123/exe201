const mongoose = require('mongoose');

/**
 * AI Usage Schema - Tracks daily AI question usage per user
 * FREE users: 15 questions/day on the personal AI page
 * Paid users: Unlimited only when AI is used inside a room
 */
const aiUsageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String, // Format: YYYY-MM-DD for easy daily tracking
        required: true
    },
    questionCount: {
        type: Number,
        default: 0
    },
    freeMainQuestionCount: {
        type: Number,
        default: 0
    },
    questions: [{
        question: String,
        response: String,
        model: String,
        tokensUsed: Number,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

const getVietnamDateKey = (date = new Date()) =>
    new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);

// Compound index for efficient daily lookup
aiUsageSchema.index({ user: 1, date: 1 }, { unique: true });

// Static method to get or create today's usage record
aiUsageSchema.statics.getTodayUsage = async function (userId) {
    const today = getVietnamDateKey();

    return this.findOneAndUpdate(
        { user: userId, date: today },
        {
            $setOnInsert: {
                questionCount: 0,
                freeMainQuestionCount: 0,
                questions: []
            }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

// Static method to increment usage
aiUsageSchema.statics.incrementUsage = async function (userId, questionData, options = {}) {
    const today = getVietnamDateKey();
    const increments = { questionCount: 1 };
    if (options.countTowardsDailyLimit) increments.freeMainQuestionCount = 1;

    return await this.findOneAndUpdate(
        { user: userId, date: today },
        {
            $inc: increments,
            $push: {
                questions: {
                    question: questionData.question?.substring(0, 500), // Limit stored question length
                    response: questionData.response?.substring(0, 1000), // Limit stored response length
                    model: questionData.model,
                    tokensUsed: questionData.tokensUsed || 0
                }
            }
        },
        { upsert: true, new: true }
    );
};

// Static method to check if user can ask (for FREE users)
aiUsageSchema.statics.canAsk = async function (userId, dailyLimit) {
    const usage = await this.getTodayUsage(userId);
    return usage.freeMainQuestionCount < dailyLimit;
};

// Atomically reserve one free personal-AI question so parallel requests
// cannot exceed the daily allowance.
aiUsageSchema.statics.reserveFreeMainQuestion = async function (userId, dailyLimit) {
    const today = getVietnamDateKey();
    await this.getTodayUsage(userId);

    return this.findOneAndUpdate(
        {
            user: userId,
            date: today,
            $expr: {
                $lt: [{ $ifNull: ['$freeMainQuestionCount', 0] }, dailyLimit]
            }
        },
        { $inc: { freeMainQuestionCount: 1 } },
        { new: true }
    );
};

const AIUsage = mongoose.model('AIUsage', aiUsageSchema);

module.exports = AIUsage;
