const User = require('../models/User');
const Room = require('../models/Room');
const RoomCategory = require('../models/RoomCategory');
const Transaction = require('../models/Transaction');
const SystemConfig = require('../models/SystemConfig');
const Report = require('../models/Report');
const AIUsage = require('../models/AIUsage');
const StudySession = require('../models/StudySession');
const Notification = require('../models/Notification');
const AdminAuditLog = require('../models/AdminAuditLog');
const roomService = require('../services/room.service');
const subscriptionService = require('../services/subscription.service');
const moment = require('moment');

const AI_DAILY_LIMIT = 15;
const getVietnamDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);

const writeAuditLog = async (req, action, details = {}) => {
  try {
    await AdminAuditLog.create({
      admin: req.user._id,
      action,
      targetType: details.targetType || 'SYSTEM',
      targetId: details.targetId?.toString() || '',
      targetLabel: details.targetLabel || '',
      metadata: details.metadata || {},
      ip: req.ip || req.headers?.['x-forwarded-for'] || ''
    });
  } catch (error) {
    req.log?.error?.(error, 'Unable to write admin audit log');
  }
};

// User Management
const getAllUsers = async (req, reply) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', order = 'desc', createdWithinDays } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (createdWithinDays !== undefined) {
      const days = Math.min(365, Math.max(1, parseInt(createdWithinDays, 10) || 7));
      query.createdAt = { $gte: moment().subtract(days, 'days').toDate() };
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const [users, total] = await Promise.all([
      User.find(query)
        .select([
          'displayName',
          'email',
          'avatar',
          'role',
          'totalStudyMinutes',
          'subscriptionTier',
          'subscriptionStartDate',
          'subscriptionExpiry',
          'isLocked',
          'isBlocked',
          'lockReason',
          'currentRoomId',
          'createdAt'
        ].join(' '))
        .populate('currentRoomId', 'name roomType isActive')
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .sort(sortOptions)
        .lean(),
      User.countDocuments(query)
    ]);
    const today = getVietnamDateKey();
    const usageRows = await AIUsage.find({
      user: { $in: users.map((user) => user._id) },
      date: today
    }).select('user freeMainQuestionCount questionCount');
    const usageByUser = new Map(
      usageRows.map((usage) => [usage.user.toString(), usage])
    );

    const enhancedUsers = users.map((user) => {
      const usage = usageByUser.get(user._id.toString());
      const used = usage?.freeMainQuestionCount || 0;
      return {
        ...user,
        effectiveSubscriptionTier: subscriptionService.getEffectiveTier(user),
        aiUsageToday: {
          used,
          limit: AI_DAILY_LIMIT,
          remaining: Math.max(0, AI_DAILY_LIMIT - used),
          totalQuestions: usage?.questionCount || 0
        }
      };
    });

    reply.send({
      users: enhancedUsers,
      total,
      page: safePage,
      pages: Math.ceil(total / safeLimit)
    });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

const toggleBlockUser = async (req, reply) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return reply.code(404).send({ message: 'User not found' });

    user.isBlocked = !user.isBlocked;
    // Also toggle lock for consistency if we want single status, but keeping separate for now per plan
    await user.save();

    reply.send({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}`, user });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

const toggleLockUser = async (req, reply) => {
  try {
    const { reason } = req.body || {};
    const user = await User.findById(req.params.id);
    if (!user) return reply.code(404).send({ message: 'User not found' });

    user.isLocked = !user.isLocked;
    if (user.isLocked) {
      user.lockReason = reason || 'Violation of community standards';
      // Invalidate sessions - logic would go here (e.g. increase token version)
      user.resetPasswordToken = undefined; // Force re-auth eventually
    } else {
      // When unlocking, reset all blocking states to ensure user can login
      user.lockReason = '';
      user.isBlocked = false; // Also reset isBlocked to ensure user can login
    }

    await user.save();

    await writeAuditLog(req, user.isLocked ? 'LOCK_USER' : 'UNLOCK_USER', {
      targetType: 'USER',
      targetId: user._id,
      targetLabel: user.displayName,
      metadata: { reason: user.lockReason || '' }
    });

    reply.send({ message: `User ${user.isLocked ? 'locked' : 'unlocked'}`, user });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

const getUserDetails = async (req, reply) => {
  try {
    const userService = require('../services/user.service');
    const user = await userService.getUserById(req.params.id);
    reply.send(user);
  } catch (error) {
    reply.code(404).send({ message: error.message });
  }
};

// Analytics
const getSystemStats = async (req, reply) => {
  try {
    const { days, month, year, startDate: qStartDate, endDate: qEndDate } = req.query;
    let filter = {};

    // Construct Date Filter
    if (qStartDate && qEndDate) {
      filter.createdAt = {
        $gte: moment(qStartDate).startOf('day').toDate(),
        $lte: moment(qEndDate).endOf('day').toDate()
      };
    } else if (month && year) {
      const start = moment().year(year).month(month - 1).startOf('month');
      const end = start.clone().endOf('month');
      filter.createdAt = { $gte: start.toDate(), $lte: end.toDate() };
    } else if (days) {
      const start = moment().subtract(days, 'days').startOf('day');
      filter.createdAt = { $gte: start.toDate() };
    }

    const today = getVietnamDateKey();
    const [totalUsers, totalRooms, totalRevenue, aiUsageToday] = await Promise.all([
      User.countDocuments(filter),
      Room.countDocuments(filter),
      Transaction.aggregate([
        { $match: { status: 'COMPLETED', ...filter } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      AIUsage.aggregate([
        { $match: { date: today } },
        {
          $group: {
            _id: null,
            questions: { $sum: { $ifNull: ['$freeMainQuestionCount', 0] } },
            activeUsers: {
              $sum: {
                $cond: [
                  { $gt: [{ $ifNull: ['$freeMainQuestionCount', 0] }, 0] },
                  1,
                  0
                ]
              }
            },
            usersAtLimit: {
              $sum: {
                $cond: [
                  { $gte: [{ $ifNull: ['$freeMainQuestionCount', 0] }, AI_DAILY_LIMIT] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ])
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
    let growthFilter = {};
    if (Object.keys(filter).length > 0) {
      // If filter exists, count users in that filter
      growthFilter = filter;
    } else {
      // Default to last 7 days
      growthFilter = { createdAt: { $gte: moment().subtract(7, 'days').toDate() } };
    }

    const newUsers = await User.countDocuments(growthFilter);

    reply.send({
      totalUsers,
      totalRooms,
      revenue,
      newUsersLast7Days: newUsers,
      aiToday: aiUsageToday[0] || { questions: 0, activeUsers: 0, usersAtLimit: 0 }
    });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

// Room Management
const getAllRooms = async (req, reply) => {
  try {
    const { page = 1, limit = 12, search, filter, status = 'active' } = req.query;
    const query = {};

    if (status === 'active') query.isActive = true;
    if (status === 'closed') query.isActive = false;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } }
        // Add owner name search if needed (requires population filter or aggregate)
      ];
    }

    // Simple filter mock
    if (filter === 'reported') {
      // query.reports = { $gt: 0 }; 
    }

    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const [rooms, total] = await Promise.all([
      Room.find(query)
        .populate('owner', 'displayName avatar')
        .sort('-createdAt')
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      Room.countDocuments(query)
    ]);

    // Fetch report counts in one aggregation instead of one query per room.
    const roomIds = rooms.map((room) => room._id);
    const reportCounts = roomIds.length
      ? await Report.aggregate([
          { $match: { room: { $in: roomIds }, status: 'PENDING' } },
          { $group: { _id: '$room', count: { $sum: 1 } } }
        ])
      : [];
    const reportCountByRoom = new Map(
      reportCounts.map((item) => [item._id.toString(), item.count])
    );

    const enhancedRooms = rooms.map((room) => {
      const reportCount = reportCountByRoom.get(room._id.toString()) || 0;
      return {
        ...room.toObject(),
        reportCount,
        isNSFW: reportCount > 5,
        isTrending: room.activeParticipants.length > 10
      };
    });

    reply.send({ rooms: enhancedRooms, total, page: safePage });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

const warnUser = async (req, reply) => {
  try {
    const { userId } = req.params;
    const { reason, expiryDate } = req.body;

    const user = await User.findById(userId);
    if (!user) return reply.code(404).send({ message: 'User not found' });

    user.warnings.push({
      reason,
      expiresAt: expiryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    await user.save();
    reply.send({ message: 'User warned successfully', user });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

// Revenue Management (Real Data with Timeframe filter)
const getRevenueStats = async (req, reply) => {
  try {
    const { timeframe = 'month', filterMonth, filterYear, startDate: queryStartDate, endDate: queryEndDate } = req.query; // day, week, month, year, all + custom filters

    let startDate;
    let endDateFilter;
    const now = moment();

    // The Admin overview and revenue screen both request the all-time snapshot.
    // Serve that common path with one faceted aggregation instead of roughly
    // twenty sequential database round-trips.
    if (
      timeframe === 'all' &&
      !filterMonth &&
      !filterYear &&
      !queryStartDate &&
      !queryEndDate
    ) {
      const startOfYear = moment().startOf('year').toDate();
      const startOfMonth = moment().startOf('month').toDate();
      const startOfWeek = moment().startOf('week').toDate();
      const chartStart = moment().subtract(11, 'months').startOf('month').toDate();

      const [aggregationResult, transactions, totalUsers] = await Promise.all([
        Transaction.aggregate([
          { $match: { status: 'COMPLETED' } },
          {
            $facet: {
              summary: [
                {
                  $group: {
                    _id: null,
                    all: { $sum: '$amount' },
                    year: {
                      $sum: { $cond: [{ $gte: ['$createdAt', startOfYear] }, '$amount', 0] }
                    },
                    month: {
                      $sum: { $cond: [{ $gte: ['$createdAt', startOfMonth] }, '$amount', 0] }
                    },
                    week: {
                      $sum: { $cond: [{ $gte: ['$createdAt', startOfWeek] }, '$amount', 0] }
                    }
                  }
                }
              ],
              tierRevenue: [
                { $match: { type: 'PREMIUM_SUBSCRIPTION' } },
                {
                  $lookup: {
                    from: 'pricingplans',
                    localField: 'plan',
                    foreignField: '_id',
                    as: 'planInfo'
                  }
                },
                { $unwind: { path: '$planInfo', preserveNullAndEmptyArrays: true } },
                {
                  $group: {
                    _id: '$planInfo.tier',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                  }
                }
              ],
              chart: [
                { $match: { createdAt: { $gte: chartStart } } },
                {
                  $group: {
                    _id: {
                      month: {
                        $dateToString: {
                          format: '%Y-%m',
                          date: '$createdAt',
                          timezone: 'Asia/Ho_Chi_Minh'
                        }
                      },
                      type: '$type'
                    },
                    total: { $sum: '$amount' }
                  }
                }
              ]
            }
          }
        ]),
        Transaction.find({ status: 'COMPLETED' })
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('user', 'displayName')
          .lean(),
        User.countDocuments()
      ]);

      const facets = aggregationResult[0] || {};
      const summary = facets.summary?.[0] || { all: 0, year: 0, month: 0, week: 0 };
      const tierRows = facets.tierRevenue || [];
      const tierRevenue = {
        MONTHLY: tierRows.find((item) => item._id === 'MONTHLY') || { total: 0, count: 0 },
        YEARLY: tierRows.find((item) => item._id === 'YEARLY') || { total: 0, count: 0 },
        LIFETIME: tierRows.find((item) => item._id === 'LIFETIME') || { total: 0, count: 0 }
      };
      const chartRows = facets.chart || [];
      const chartData = Array.from({ length: 12 }, (_, index) => {
        const date = moment().subtract(11 - index, 'months');
        const monthKey = date.format('YYYY-MM');
        const premium = chartRows.find(
          (item) => item._id.month === monthKey && item._id.type === 'PREMIUM_SUBSCRIPTION'
        )?.total || 0;
        const ad = chartRows.find(
          (item) => item._id.month === monthKey && item._id.type === 'AD_REVENUE'
        )?.total || 0;
        return { day: date.format('MM/YYYY'), premium, ad };
      });
      const formattedTransactions = transactions.map((transaction) => ({
        id: transaction.txnRef || transaction._id.toString().substring(0, 8),
        type: transaction.type,
        user: transaction.user?.displayName || 'Unknown',
        amount: transaction.amount,
        date: transaction.createdAt,
        status: transaction.status
      }));
      const totalRevenue = summary.all || 0;
      const premiumSales = Object.values(tierRevenue).reduce(
        (total, item) => total + (item.total || 0),
        0
      );

      return reply.send({
        summary,
        totalRevenue,
        premiumSales,
        adRevenue: chartRows
          .filter((item) => item._id.type === 'AD_REVENUE')
          .reduce((total, item) => total + item.total, 0),
        arpu: totalUsers > 0 ? Math.round(totalRevenue / totalUsers) : 0,
        tierRevenue,
        chartData,
        transactions: formattedTransactions
      });
    }
    // Custom date range filter (from date - to date)
    if (queryStartDate && queryEndDate) {
      startDate = moment(queryStartDate).startOf('day');
      endDateFilter = moment(queryEndDate).endOf('day');

      const matchStage = { status: 'COMPLETED', createdAt: { $gte: startDate.toDate(), $lte: endDateFilter.toDate() } };

      // Revenue by tier (MONTHLY, YEARLY, LIFETIME)
      const revenueByTier = await Transaction.aggregate([
        { $match: { ...matchStage, type: 'PREMIUM_SUBSCRIPTION' } },
        { $lookup: { from: 'pricingplans', localField: 'plan', foreignField: '_id', as: 'planInfo' } },
        { $unwind: { path: '$planInfo', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$planInfo.tier', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]);

      const tierRevenue = {
        MONTHLY: revenueByTier.find(t => t._id === 'MONTHLY') || { total: 0, count: 0 },
        YEARLY: revenueByTier.find(t => t._id === 'YEARLY') || { total: 0, count: 0 },
        LIFETIME: revenueByTier.find(t => t._id === 'LIFETIME') || { total: 0, count: 0 }
      };

      const totalFiltered = await Transaction.aggregate([
        { $match: matchStage },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      // Get chart data for date range
      const days = endDateFilter.diff(startDate, 'days') + 1;
      const chartData = [];
      for (let i = 0; i < Math.min(days, 31); i++) {
        const date = startDate.clone().add(i, 'days');
        const dayStart = date.clone().startOf('day').toDate();
        const dayEnd = date.clone().endOf('day').toDate();

        const [premiumData, adData] = await Promise.all([
          Transaction.aggregate([
            { $match: { status: 'COMPLETED', type: 'PREMIUM_SUBSCRIPTION', createdAt: { $gte: dayStart, $lte: dayEnd } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ]),
          Transaction.aggregate([
            { $match: { status: 'COMPLETED', type: 'AD_REVENUE', createdAt: { $gte: dayStart, $lte: dayEnd } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ])
        ]);

        chartData.push({
          day: date.format('DD/MM'),
          premium: premiumData[0]?.total || 0,
          ad: adData[0]?.total || 0
        });
      }

      // Get transactions in date range
      const transactions = await Transaction.find(matchStage)
        .populate('user', 'displayName email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const formattedTransactions = transactions.map(tx => ({
        id: tx._id.toString().slice(-6).toUpperCase(),
        date: tx.createdAt,
        type: tx.type,
        user: tx.user?.displayName || tx.user?.email || 'Unknown',
        amount: tx.amount,
        status: tx.status
      }));

      return reply.send({
        startDate: queryStartDate,
        endDate: queryEndDate,
        totalRevenue: totalFiltered[0]?.total || 0,
        tierRevenue,
        summary: { all: 0, year: 0, month: totalFiltered[0]?.total || 0, week: 0 },
        chartData,
        premiumSales: totalFiltered[0]?.total || 0,
        adRevenue: 0,
        arpu: 0,
        transactions: formattedTransactions
      });
    }

    // Custom month/year filter
    if (filterMonth && filterYear) {
      startDate = moment().year(parseInt(filterYear)).month(parseInt(filterMonth) - 1).startOf('month');
      const endDate = startDate.clone().endOf('month');

      // Use custom date range
      const matchStage = { status: 'COMPLETED', createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() } };

      // Revenue by tier (MONTHLY, YEARLY, LIFETIME)
      const revenueByTier = await Transaction.aggregate([
        { $match: { ...matchStage, type: 'PREMIUM_SUBSCRIPTION' } },
        { $lookup: { from: 'pricingplans', localField: 'plan', foreignField: '_id', as: 'planInfo' } },
        { $unwind: { path: '$planInfo', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$planInfo.tier', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]);

      const tierRevenue = {
        MONTHLY: revenueByTier.find(t => t._id === 'MONTHLY') || { total: 0, count: 0 },
        YEARLY: revenueByTier.find(t => t._id === 'YEARLY') || { total: 0, count: 0 },
        LIFETIME: revenueByTier.find(t => t._id === 'LIFETIME') || { total: 0, count: 0 }
      };

      const totalFiltered = await Transaction.aggregate([
        { $match: matchStage },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      return reply.send({
        filterMonth: parseInt(filterMonth),
        filterYear: parseInt(filterYear),
        totalRevenue: totalFiltered[0]?.total || 0,
        tierRevenue,
        summary: { all: 0, year: 0, month: totalFiltered[0]?.total || 0, week: 0 },
        chartData: [],
        premiumSales: totalFiltered[0]?.total || 0,
        adRevenue: 0,
        arpu: 0,
        transactions: []
      });
    }

    // Determine startDate based on timeframe for Charts & Detail views
    switch (timeframe) {
      case 'day':
        startDate = now.clone().startOf('day');
        break;
      case 'week':
        startDate = now.clone().startOf('week');
        break;
      case 'month':
        startDate = now.clone().startOf('month');
        break;
      case 'year':
        startDate = now.clone().startOf('year');
        break;
      case 'all':
      default:
        startDate = null; // No date filter
        break;
    }

    const matchStage = { status: 'COMPLETED' };
    if (startDate) {
      matchStage.createdAt = { $gte: startDate.toDate() };
    }

    // --- 1. Top Cards Aggregation (Always calculate All, Year, Month, Week) ---
    const startOfYear = moment().startOf('year').toDate();
    const startOfMonth = moment().startOf('month').toDate();
    const startOfWeek = moment().startOf('week').toDate();

    const [allTime, yearToDate, monthToDate, weekToDate] = await Promise.all([
      // All Time
      Transaction.aggregate([
        { $match: { status: 'COMPLETED' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // This Year
      Transaction.aggregate([
        { $match: { status: 'COMPLETED', createdAt: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // This Month
      Transaction.aggregate([
        { $match: { status: 'COMPLETED', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // This Week
      Transaction.aggregate([
        { $match: { status: 'COMPLETED', createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const summary = {
      all: allTime[0]?.total || 0,
      year: yearToDate[0]?.total || 0,
      month: monthToDate[0]?.total || 0,
      week: weekToDate[0]?.total || 0
    };

    // --- 2. Filtered Stats (For specific timeframe ARPU, Charts, Pie) ---
    // Total Revenue (Filtered)
    const totalRevResult = await Transaction.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = totalRevResult[0]?.total || 0;

    // Premium Sales (Filtered)
    const premiumRevResult = await Transaction.aggregate([
      { $match: { ...matchStage, type: 'PREMIUM_SUBSCRIPTION' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const premiumSales = premiumRevResult[0]?.total || 0;

    // Ad Revenue (Filtered) - Placeholder logic as per original
    const adRevenue = 0;

    // ARPU (Filtered)
    // For simplicity, using total users count.
    const totalUsers = await User.countDocuments();
    const arpu = totalUsers > 0 ? Math.round(totalRevenue / totalUsers) : 0;

    // --- Revenue by Tier (MONTHLY, YEARLY, LIFETIME) ---
    const revenueByTier = await Transaction.aggregate([
      { $match: { ...matchStage, type: 'PREMIUM_SUBSCRIPTION' } },
      { $lookup: { from: 'pricingplans', localField: 'plan', foreignField: '_id', as: 'planInfo' } },
      { $unwind: { path: '$planInfo', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$planInfo.tier', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const tierRevenue = {
      MONTHLY: revenueByTier.find(t => t._id === 'MONTHLY') || { total: 0, count: 0 },
      YEARLY: revenueByTier.find(t => t._id === 'YEARLY') || { total: 0, count: 0 },
      LIFETIME: revenueByTier.find(t => t._id === 'LIFETIME') || { total: 0, count: 0 }
    };

    // --- 3. Chart Data ---
    const chartData = [];

    if (timeframe === 'all') {
      // Group by Month (Last 12 months for visual limitation, or could be 'Year' if very long)
      // Let's show last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = moment().subtract(i, 'months');
        const start = date.clone().startOf('month').toDate();
        const end = date.clone().endOf('month').toDate();

        const monthStats = await Transaction.aggregate([
          { $match: { status: 'COMPLETED', createdAt: { $gte: start, $lte: end } } },
          { $group: { _id: '$type', total: { $sum: '$amount' } } }
        ]);
        const premium = monthStats.find(s => s._id === 'PREMIUM_SUBSCRIPTION')?.total || 0;
        chartData.push({ day: date.format('MM/YYYY'), premium, ad: 0 });
      }
    } else if (timeframe === 'year') {
      // Last 6-12 months
      for (let i = 11; i >= 0; i--) {
        const date = moment().subtract(i, 'months');
        const start = date.clone().startOf('month').toDate();
        const end = date.clone().endOf('month').toDate();

        const dayStats = await Transaction.aggregate([
          { $match: { status: 'COMPLETED', createdAt: { $gte: start, $lte: end } } },
          { $group: { _id: '$type', total: { $sum: '$amount' } } }
        ]);
        const premium = dayStats.find(s => s._id === 'PREMIUM_SUBSCRIPTION')?.total || 0;
        chartData.push({ day: date.format('MMM'), premium, ad: 0 });
      }
    } else if (timeframe === 'month') {
      // Last 4-5 weeks
      for (let i = 3; i >= 0; i--) {
        const weekEnd = moment().subtract(i, 'weeks').endOf('week');
        const weekStart = moment().subtract(i, 'weeks').startOf('week');

        const weekStats = await Transaction.aggregate([
          { $match: { status: 'COMPLETED', createdAt: { $gte: weekStart.toDate(), $lte: weekEnd.toDate() } } },
          { $group: { _id: '$type', total: { $sum: '$amount' } } }
        ]);
        const premium = weekStats.find(s => s._id === 'PREMIUM_SUBSCRIPTION')?.total || 0;
        chartData.push({ day: `Tuần ${4 - i}`, premium, ad: 0 });
      }
    } else if (timeframe === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = moment().subtract(i, 'days');
        const start = date.clone().startOf('day').toDate();
        const end = date.clone().endOf('day').toDate();

        const dayStats = await Transaction.aggregate([
          { $match: { status: 'COMPLETED', createdAt: { $gte: start, $lte: end } } },
          { $group: { _id: '$type', total: { $sum: '$amount' } } }
        ]);
        const premium = dayStats.find(s => s._id === 'PREMIUM_SUBSCRIPTION')?.total || 0;
        chartData.push({ day: date.format('DD/MM'), premium, ad: 0 });
      }
    } else {
      // Day: Last 8 blocks
      for (let i = 7; i >= 0; i--) {
        const blockEnd = moment().subtract(i * 3, 'hours');
        const blockStart = blockEnd.clone().subtract(3, 'hours');

        const blockStats = await Transaction.aggregate([
          { $match: { status: 'COMPLETED', createdAt: { $gte: blockStart.toDate(), $lte: blockEnd.toDate() } } },
          { $group: { _id: '$type', total: { $sum: '$amount' } } }
        ]);
        const premium = blockStats.find(s => s._id === 'PREMIUM_SUBSCRIPTION')?.total || 0;
        chartData.push({ day: blockEnd.format('HH:mm'), premium, ad: 0 });
      }
    }

    // --- 4. Recent Transactions (filtered) ---
    const listQuery = { status: 'COMPLETED' };
    if (startDate) listQuery.createdAt = { $gte: startDate.toDate() };

    const transactions = await Transaction.find(listQuery)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'displayName');

    const formattedTxns = transactions.map(tx => ({
      id: tx.txnRef || tx._id.toString().substring(0, 8),
      type: tx.type,
      user: tx.user?.displayName || 'Unknown',
      amount: tx.amount,
      date: tx.createdAt,
      status: tx.status
    }));

    reply.send({
      summary,
      totalRevenue,
      premiumSales,
      adRevenue,
      arpu,
      tierRevenue,
      chartData,
      transactions: formattedTxns
    });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

// Ad Management
const getAdStats = async (req, reply) => {
  try {
    reply.send({
      views: 125000,
      ctr: 2.4,
      revenue: 15400000,
      activeCampaigns: 5,
      placements: [
        { id: 1, name: 'Homepage Banner', location: 'Top of Dashboard', type: 'Display', status: 'Active', ctr: 3.2 },
        { id: 2, name: 'Sidebar Skyscraper', location: 'Right Sidebar', type: 'Display', status: 'Paused', ctr: 1.8 }
      ]
    });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

// Analytics Reports (Real Data)
const getAnalytics = async (req, reply) => {
  try {
    const { type, days, month, year, startDate: qStart, endDate: qEnd } = req.query;
    const StudySession = require('../models/StudySession');

    // Determine Date Range
    let start = moment().subtract(6, 'days').startOf('day'); // Default 7 days
    let end = moment().endOf('day');

    if (qStart && qEnd) {
      start = moment(qStart).startOf('day');
      end = moment(qEnd).endOf('day');
    } else if (month && year) {
      start = moment().year(year).month(month - 1).startOf('month');
      end = start.clone().endOf('month');
    } else if (days) {
      start = moment().subtract(days - 1, 'days').startOf('day');
      end = moment().endOf('day');
    }

    const diffDays = end.diff(start, 'days') + 1;
    const getDaysArray = () => {
      const arr = [];
      for (let i = 0; i < diffDays; i++) {
        arr.push(start.clone().add(i, 'days'));
      }
      return arr;
    };

    if (type === 'growth') {
      const dates = getDaysArray();
      let newUsers = [];
      let labels = [];

      for (const date of dates) {
        const dStart = date.clone().startOf('day').toDate();
        const dEnd = date.clone().endOf('day').toDate();

        const count = await User.countDocuments({
          createdAt: { $gte: dStart, $lte: dEnd }
        });
        newUsers.push(count);
        labels.push(date.format('DD/MM'));
      }

      const totalNewUsers = await User.countDocuments({
        createdAt: { $gte: start.toDate(), $lte: end.toDate() }
      });

      const activeUsers = await User.countDocuments({
        lastStudyDate: { $gte: start.toDate(), $lte: end.toDate() }
      });

      const mau = await User.countDocuments({
        lastStudyDate: { $gte: start.clone().subtract(30, 'days').toDate(), $lte: end.toDate() }
      });

      return reply.send({
        newUsers,
        labels,
        totalNewUsers,
        activeUsers,
        mau
      });
    }

    if (type === 'study_hours') {
      const dates = getDaysArray();
      let studyHours = [];
      let labels = [];

      for (const date of dates) {
        const dStart = date.clone().startOf('day').toDate();
        const dEnd = date.clone().endOf('day').toDate();

        const dayStats = await StudySession.aggregate([
          { $match: { createdAt: { $gte: dStart, $lte: dEnd } } },
          { $group: { _id: null, totalMinutes: { $sum: '$duration' } } }
        ]);

        const minutes = dayStats[0]?.totalMinutes || 0;
        studyHours.push(Math.round(minutes / 60)); // hours
        labels.push(date.format('ddd'));
      }

      return reply.send({
        studyHours,
        labels: diffDays > 10 ? dates.map(d => d.format('DD/MM')) : labels
      });
    }

    if (type === 'engagement') {
      // Average Session Time (in period)
      const periodMatch = { createdAt: { $gte: start.toDate(), $lte: end.toDate() } };

      const allSessions = await StudySession.aggregate([
        { $match: periodMatch },
        { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
      ]);
      const avgMinutes = allSessions[0]?.avgDuration ? Math.round(allSessions[0].avgDuration) : 0;

      const anchorDate = end;

      const totalUsers = await User.countDocuments({});

      const activeUsersLast7Days = await User.countDocuments({
        lastStudyDate: { $gte: anchorDate.clone().subtract(7, 'days').toDate(), $lte: anchorDate.toDate() }
      });
      const activeUsersLast30Days = await User.countDocuments({
        lastStudyDate: { $gte: anchorDate.clone().subtract(30, 'days').toDate(), $lte: anchorDate.toDate() }
      });

      const returningUsers = await User.countDocuments({
        lastStudyDate: { $gte: anchorDate.clone().subtract(7, 'days').toDate(), $lte: anchorDate.toDate() },
        createdAt: { $lte: anchorDate.clone().subtract(7, 'days').toDate() }
      });

      const retentionRate = activeUsersLast30Days > 0 ? ((returningUsers / activeUsersLast30Days) * 100).toFixed(1) : 0;

      const retentionTrend = [];
      for (let i = 3; i >= 0; i--) {
        const chunkEnd = anchorDate.clone().subtract(i * 7, 'days');
        const chunkStart = chunkEnd.clone().subtract(7, 'days');

        const activeThisChunk = await User.countDocuments({
          lastStudyDate: { $gte: chunkStart.toDate(), $lt: chunkEnd.toDate() }
        });

        const prevChunkStart = chunkStart.clone().subtract(7, 'days');
        const activePrevChunk = await User.countDocuments({
          lastStudyDate: { $gte: prevChunkStart.toDate(), $lt: chunkStart.toDate() }
        });

        const chunkRetention = activePrevChunk > 0 ? Math.round((activeThisChunk / activePrevChunk) * 100) : 0;

        retentionTrend.push({
          week: `Tuần -${i}`,
          rate: Math.min(chunkRetention, 100),
          activeUsers: activeThisChunk
        });
      }

      return reply.send({
        avgSessionTime: `${avgMinutes}m`,
        retentionRate: parseFloat(retentionRate),
        totalUsers,
        activeUsersLast7Days,
        activeUsersLast30Days,
        returningUsers,
        retentionTrend,
        cohortData: []
      });
    }

    if (type === 'webcam_usage') {
      const dates = getDaysArray();
      const usageTrend = [];
      const periodMatch = { createdAt: { $gte: start.toDate(), $lte: end.toDate() } };

      for (const date of dates) {
        const dStart = date.clone().startOf('day').toDate();
        const dEnd = date.clone().endOf('day').toDate();

        const dayStats = await StudySession.aggregate([
          { $match: { createdAt: { $gte: dStart, $lte: dEnd } } },
          {
            $group: {
              _id: null,
              totalSessions: { $sum: 1 },
              totalMinutes: { $sum: '$duration' },
              uniqueUsers: { $addToSet: '$user' }
            }
          }
        ]);

        const stats = dayStats[0] || { totalSessions: 0, totalMinutes: 0, uniqueUsers: [] };

        usageTrend.push({
          date: date.format('DD/MM'),
          dayName: date.format('ddd'),
          sessions: stats.totalSessions,
          totalMinutes: stats.totalMinutes,
          totalHours: Math.round(stats.totalMinutes / 60 * 10) / 10,
          uniqueUsers: stats.uniqueUsers?.length || 0
        });
      }

      // Peak Hours in Period
      const peakHoursData = await StudySession.aggregate([
        { $match: periodMatch },
        { $project: { hour: { $hour: '$createdAt' }, duration: 1 } },
        { $group: { _id: '$hour', count: { $sum: 1 }, totalMinutes: { $sum: '$duration' } } },
        { $sort: { _id: 1 } }
      ]);

      const peakHours = Array.from({ length: 24 }, (_, i) => {
        const hourData = peakHoursData.find(h => h._id === i);
        return {
          hour: i,
          label: `${i.toString().padStart(2, '0')}:00`,
          sessions: hourData?.count || 0,
          minutes: hourData?.totalMinutes || 0
        };
      });

      const peakHour = peakHours.reduce((max, h) => h.sessions > max.sessions ? h : max, peakHours[0]);

      // Total Stats in Period
      const totalStats = await StudySession.aggregate([
        { $match: periodMatch },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            totalMinutes: { $sum: '$duration' },
            avgDuration: { $avg: '$duration' }
          }
        }
      ]);

      const totals = totalStats[0] || { totalSessions: 0, totalMinutes: 0, avgDuration: 0 };

      return reply.send({
        usageTrend,
        peakHours,
        peakHour: peakHour.label,
        totalSessionsLast7Days: totals.totalSessions,
        totalHoursLast7Days: Math.round(totals.totalMinutes / 60),
        avgSessionDuration: Math.round(totals.avgDuration || 0)
      });
    }

    if (type === 'technical') {
      const os = require('os');
      const cpuCount = Math.max(1, os.cpus().length);
      const serverCpu = Math.min(100, Math.round((os.loadavg()[0] / cpuCount) * 100));
      const serverRam = Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);
      return reply.send({
        serverCpu,
        serverRam,
        processMemoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        uptimeSeconds: Math.floor(process.uptime())
      });
    }

    reply.code(400).send({ message: 'Invalid analytics type' });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

const closeRoom = async (req, reply) => {
  try {
    const { id } = req.params;
    const result = await roomService.closeRoom(id, 'admin');

    if (global.io) {
      global.io.to(id).emit('room-closed', {
        roomId: id,
        reason: 'admin',
        message: 'Phòng đã được quản trị viên đóng.'
      });
    }

    await writeAuditLog(req, 'CLOSE_ROOM', {
      targetType: 'ROOM',
      targetId: id
    });

    reply.send({ message: 'Room closed successfully', ...result });
  } catch (error) {
    reply.code(error.message === 'Room not found' ? 404 : 500).send({ message: error.message });
  }
};

const updateUserSubscription = async (req, reply) => {
  try {
    const { id } = req.params;
    const { tier, expiry } = req.body || {};
    const allowedTiers = ['FREE', 'MONTHLY', 'YEARLY', 'LIFETIME'];

    if (!allowedTiers.includes(tier)) {
      return reply.code(400).send({ message: 'Gói thành viên không hợp lệ.' });
    }

    const user = await User.findById(id);
    if (!user) return reply.code(404).send({ message: 'User not found' });
    if (user.role === 'ADMIN') {
      return reply.code(400).send({ message: 'Tài khoản Admin không cần gán gói thành viên.' });
    }

    const now = new Date();
    user.subscriptionTier = tier;

    if (tier === 'FREE') {
      user.subscriptionStartDate = undefined;
      user.subscriptionExpiry = undefined;
    } else {
      user.subscriptionStartDate = user.subscriptionStartDate || now;
      if (tier === 'LIFETIME') {
        user.subscriptionExpiry = undefined;
      } else if (expiry) {
        const parsedExpiry = /^\d{4}-\d{2}-\d{2}$/.test(expiry)
          ? new Date(`${expiry}T23:59:59.999+07:00`)
          : new Date(expiry);
        if (Number.isNaN(parsedExpiry.getTime())) {
          return reply.code(400).send({ message: 'Ngày hết hạn không hợp lệ.' });
        }
        user.subscriptionExpiry = parsedExpiry;
      } else {
        const durationDays = tier === 'YEARLY' ? 365 : 30;
        user.subscriptionExpiry = new Date(now.getTime() + durationDays * 86400000);
      }
    }

    await user.save();
    await writeAuditLog(req, 'UPDATE_SUBSCRIPTION', {
      targetType: 'USER',
      targetId: user._id,
      targetLabel: user.displayName,
      metadata: {
        tier: user.subscriptionTier,
        expiry: user.subscriptionExpiry || null
      }
    });
    reply.send({
      message: 'Đã cập nhật gói thành viên.',
      user,
      effectiveTier: subscriptionService.getEffectiveTier(user)
    });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

const resetUserAIUsage = async (req, reply) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('_id displayName');
    if (!user) return reply.code(404).send({ message: 'User not found' });

    const today = getVietnamDateKey();
    await AIUsage.findOneAndUpdate(
      { user: id, date: today },
      {
        $set: { freeMainQuestionCount: 0 },
        $setOnInsert: { questionCount: 0, questions: [] }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await writeAuditLog(req, 'RESET_AI_USAGE', {
      targetType: 'USER',
      targetId: user._id,
      targetLabel: user.displayName
    });

    reply.send({ message: `Đã khôi phục 15 lượt AI hôm nay cho ${user.displayName}.` });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

const forceLeaveUserRooms = async (req, reply) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return reply.code(404).send({ message: 'User not found' });

    const roomIds = new Set();
    if (user.currentRoomId) roomIds.add(user.currentRoomId.toString());

    const roomsContainingUser = await Room.find({ activeParticipants: user._id }).select('_id');
    roomsContainingUser.forEach((room) => roomIds.add(room._id.toString()));

    for (const roomId of roomIds) {
      await roomService.leaveRoom(roomId, user._id);
    }

    await Room.updateMany(
      { activeParticipants: user._id },
      { $pull: { activeParticipants: user._id } }
    );

    const openSessions = await StudySession.find({ user: user._id, endTime: null });
    const endedAt = new Date();
    for (const session of openSessions) {
      session.endTime = endedAt;
      session.duration = Math.max(
        0,
        Math.floor((endedAt.getTime() - session.startTime.getTime()) / 60000)
      );
      session.isCompleted = true;
      await session.save();
    }

    await User.findByIdAndUpdate(user._id, {
      $set: { currentRoomId: null, currentSessionStartTime: null }
    });

    if (global.io) {
      const sockets = await global.io.fetchSockets();
      for (const userSocket of sockets) {
        if (userSocket.user?.id?.toString() !== user._id.toString()) continue;
        for (const socketRoomId of [...userSocket.rooms]) {
          if (socketRoomId !== userSocket.id) userSocket.leave(socketRoomId);
        }
        userSocket.emit('room-switched', {
          message: 'Quản trị viên đã kết thúc trạng thái phòng hiện tại của bạn.'
        });
      }
    }

    await writeAuditLog(req, 'FORCE_LEAVE_ROOMS', {
      targetType: 'USER',
      targetId: user._id,
      targetLabel: user.displayName,
      metadata: { roomsCleared: roomIds.size }
    });

    reply.send({
      message: `Đã giải phóng trạng thái phòng của ${user.displayName}.`,
      roomsCleared: roomIds.size
    });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

const getAuditLogs = async (req, reply) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const action = req.query.action;
    const query = action ? { action } : {};

    const [logs, total] = await Promise.all([
      AdminAuditLog.find(query)
        .populate('admin', 'displayName email avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AdminAuditLog.countDocuments(query)
    ]);

    reply.send({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

const broadcastNotification = async (req, reply) => {
  try {
    const { title, message } = req.body || {};
    if (!title?.trim() || !message?.trim()) {
      return reply.code(400).send({ message: 'Tiêu đề và nội dung thông báo là bắt buộc.' });
    }
    if (title.trim().length > 120 || message.trim().length > 1000) {
      return reply.code(400).send({ message: 'Thông báo vượt quá độ dài cho phép.' });
    }

    const users = await User.find({
      isLocked: { $ne: true },
      isBlocked: { $ne: true }
    }).select('_id');

    if (users.length > 0) {
      await Notification.insertMany(
        users.map((user) => ({
          user: user._id,
          type: 'SYSTEM',
          title: title.trim(),
          message: message.trim(),
          data: { broadcast: true, sentBy: req.user._id }
        })),
        { ordered: false }
      );
    }

    if (global.io) {
      const sockets = await global.io.fetchSockets();
      sockets.forEach((socket) => {
        socket.emit('notification', {
          type: 'SYSTEM',
          title: title.trim(),
          message: message.trim()
        });
      });
    }

    await writeAuditLog(req, 'BROADCAST_NOTIFICATION', {
      targetType: 'SYSTEM',
      targetLabel: title.trim(),
      metadata: { recipients: users.length }
    });

    reply.send({
      message: `Đã gửi thông báo đến ${users.length} tài khoản.`,
      recipients: users.length
    });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

const getAdminRoomDetails = async (req, reply) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id)
      .populate('owner', 'displayName avatar email')
      .populate('category', 'name')
      .populate('activeParticipants', 'displayName avatar email');

    if (!room) return reply.code(404).send({ message: 'Room not found' });

    const StudySession = require('../models/StudySession');
    const [totalSessions, reports] = await Promise.all([
      StudySession.countDocuments({ room: id }),
      Report.find({ room: id })
        .sort('-createdAt')
        .limit(100)
        .populate('submitter targetUser resolvedBy', 'displayName avatar'),
    ]);

    reply.send({
      ...room.toObject(),
      totalSessions,
      reports
    });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

const createAdminRoom = async (req, reply) => {
  try {
    const {
      name,
      categoryId,
      timerMode = 'POMODORO_25_5',
      roomType = 'SILENT',
      maxParticipants = 50
    } = req.body || {};

    if (!name || !name.trim()) {
      return reply.code(400).send({ message: 'Tên phòng là bắt buộc.' });
    }

    const allowedRoomTypes = ['SILENT', 'DISCUSSION', 'VIDEO'];
    const allowedTimerModes = ['POMODORO_25_5', 'POMODORO_50_10', 'POMODORO_90_15'];
    if (!allowedRoomTypes.includes(roomType)) {
      return reply.code(400).send({ message: 'Loại phòng không hợp lệ.' });
    }
    if (!allowedTimerModes.includes(timerMode)) {
      return reply.code(400).send({ message: 'Chế độ Pomodoro không hợp lệ.' });
    }

    // Check if category exists if provided
    if (categoryId) {
      const categoryExists = await RoomCategory.findById(categoryId);
      if (!categoryExists) return reply.code(400).send({ message: 'Invalid Category ID' });
    }

    const room = await Room.create({
      name: name.trim(),
      category: categoryId || null,
      isAdminRoom: true,
      owner: null, // Admin room has no user owner
      maxParticipants: Math.min(999, Math.max(2, Number(maxParticipants) || 50)),
      timerMode,
      roomType,
      isPublic: true,
      isActive: true
    });

    await writeAuditLog(req, 'CREATE_ADMIN_ROOM', {
      targetType: 'ROOM',
      targetId: room._id,
      targetLabel: room.name,
      metadata: { roomType, timerMode, maxParticipants: room.maxParticipants }
    });

    reply.code(201).send(room);
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

const getRoomCategories = async (req, reply) => {
  try {
    const categories = await RoomCategory.find().sort('name');
    reply.send(categories);
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

const createRoomCategory = async (req, reply) => {
  try {
    const { name, description } = req.body;
    const category = await RoomCategory.create({ name, description });
    await writeAuditLog(req, 'CREATE_ROOM_CATEGORY', {
      targetType: 'CATEGORY',
      targetId: category._id,
      targetLabel: category.name
    });
    reply.code(201).send(category);
  } catch (error) {
    reply.code(400).send({ message: error.message });
  }
};

// System Config Management
const getSystemConfig = async (req, reply) => {
  try {
    const configs = await SystemConfig.find();
    // Convert to key-value object for easier frontend use
    const configObj = {};
    configs.forEach(c => { configObj[c.key] = c.value; });
    reply.send(configObj);
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

const updateSystemConfig = async (req, reply) => {
  try {
    const updates = req.body; // { key: value, ... }
    const results = [];
    for (const [key, value] of Object.entries(updates)) {
      const config = await SystemConfig.setValue(key, value);
      results.push(config);
    }
    reply.send({ message: 'Config updated', configs: results });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

// RoomCategory Update & Delete
const updateRoomCategory = async (req, reply) => {
  try {
    const { id } = req.params;
    const category = await RoomCategory.findByIdAndUpdate(id, req.body, { new: true });
    if (!category) return reply.code(404).send({ message: 'Category not found' });
    reply.send(category);
  } catch (error) {
    reply.code(400).send({ message: error.message });
  }
};

const deleteRoomCategory = async (req, reply) => {
  try {
    const { id } = req.params;
    const roomsUsingCategory = await Room.countDocuments({ category: id });
    if (roomsUsingCategory > 0) {
      return reply.code(409).send({
        message: `Không thể xóa: danh mục đang được ${roomsUsingCategory} phòng sử dụng.`
      });
    }
    const category = await RoomCategory.findByIdAndDelete(id);
    if (!category) return reply.code(404).send({ message: 'Category not found' });
    await writeAuditLog(req, 'DELETE_ROOM_CATEGORY', {
      targetType: 'CATEGORY',
      targetId: category._id,
      targetLabel: category.name
    });
    reply.send({ message: 'Category deleted' });
  } catch (error) {
    reply.code(400).send({ message: error.message });
  }
};

// Transaction History (Pagination)
const getAllTransactions = async (req, reply) => {
  try {
    const { page = 1, limit = 20, search, status, type } = req.query;
    const query = {};

    if (search) {
      // Search by Transaction Ref or User Name (need lookup for user name search, simplified to txnRef for now)
      // Or if user search is needed, we need aggregate or find user first.
      query.txnRef = { $regex: search, $options: 'i' };
    }

    if (status) query.status = status;
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .populate('user', 'displayName email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    reply.send({
      transactions: transactions.map(tx => ({
        id: tx.txnRef,
        _id: tx._id,
        user: tx.user,
        amount: tx.amount,
        type: tx.type,
        status: tx.status,
        date: tx.createdAt,
        description: tx.description
      })),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  toggleBlockUser,
  getSystemStats,
  getAllRooms,
  closeRoom,
  getUserDetails,
  warnUser,
  getRevenueStats,
  getAllTransactions, // Export new function
  getAdStats,
  getAnalytics,
  createAdminRoom,
  getRoomCategories,
  createRoomCategory,
  updateRoomCategory,
  deleteRoomCategory,
  getAdminRoomDetails,
  getSystemConfig,
  updateSystemConfig,
  toggleLockUser,
  updateUserSubscription,
  forceLeaveUserRooms,
  resetUserAIUsage,
  getAuditLogs,
  broadcastNotification
};
