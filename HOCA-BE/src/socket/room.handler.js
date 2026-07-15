const Room = require("../models/Room");
const User = require("../models/User");
const Message = require("../models/Message");
const DiscussionSession = require("../models/DiscussionSession");
const { joinRoom, leaveRoom } = require("../services/room.service");
const subscriptionService = require("../services/subscription.service");
const { checkAndUnlockBadges } = require("../services/badge.service");
const aiService = require("../services/ai.service");

// Timer State Management
// roomId -> { timeout: NodeJS.Timeout, status, startTime, duration, mode, endTime }
const roomTimers = {};

// FREE User Daily Time Tracking - userId -> { checkInterval, roomId, socketId, lastCheck }
const freeUserTimeTrackers = {};

const TIMER_MODES = {
  POMODORO_25_5: { focus: 25, break: 5 },
  POMODORO_50_10: { focus: 50, break: 10 },
  POMODORO_90_15: { focus: 90, break: 15 },
  COUNT_UP: { focus: 0, break: 0 }, // handled differently
};

const registerRoomHandlers = (io, socket) => {
  const userId = socket.user.id;

  const isJoined = (roomId) => Boolean(roomId && socket.rooms.has(String(roomId)));
  const canManageRoom = async (roomId) => {
    if (!isJoined(roomId)) return false;
    if (socket.user.role === "ADMIN") return true;
    const [room, session] = await Promise.all([
      Room.findById(roomId).select("owner"),
      DiscussionSession.findOne({ room: roomId }).select("coHosts"),
    ]);
    if (!room) return false;
    return String(room.owner || "") === String(userId) ||
      Boolean(session?.coHosts?.some((id) => String(id) === String(userId)));
  };

  // Helper: Clear FREE user time tracker
  const clearFreeUserTracker = (uid) => {
    if (freeUserTimeTrackers[uid]) {
      clearInterval(freeUserTimeTrackers[uid].checkInterval);
      delete freeUserTimeTrackers[uid];
    }
  };

  // Helper: Start FREE user daily time tracker
  // Checks every minute if user has exceeded daily limit
  const startFreeUserTimeTracker = async (uid, roomId, socketId) => {
    // Clear existing tracker
    clearFreeUserTracker(uid);

    const tierLimits = subscriptionService.getTierLimits("FREE");
    const dailyLimitMinutes = tierLimits.dailyStudyMinutes;
    const warningMinutes = tierLimits.warningBeforeKickMinutes;

    // Check every 30 seconds
    const checkInterval = setInterval(async () => {
      try {
        const user = await User.findById(uid);
        if (!user) {
          clearFreeUserTracker(uid);
          return;
        }

        const timeStatus = subscriptionService.getDailyStudyTimeStatus(user);

        // Send remaining time to client
        io.to(socketId).emit("time-status", {
          remainingMinutes: timeStatus.remainingMinutes,
          dailyLimitMinutes,
          shouldWarn: timeStatus.shouldWarn,
        });

        // Warning (5 minutes before limit)
        if (timeStatus.shouldWarn && !freeUserTimeTrackers[uid]?.warningSent) {
          io.to(socketId).emit("session-warning", {
            message: `Bạn còn ${timeStatus.remainingMinutes} phút trong giới hạn ${dailyLimitMinutes / 60} giờ/ngày. Nâng cấp HOCA+ để học không giới hạn!`,
            remainingMinutes: timeStatus.remainingMinutes,
          });

          io.to(socketId).emit("chat-message", {
            userId: "system",
            displayName: "System",
            message: `⚠️ Còn ${timeStatus.remainingMinutes} phút! Bạn sắp hết giới hạn học miễn phí hôm nay. Nâng cấp HOCA+ để học không giới hạn.`,
            timestamp: new Date().toISOString(),
          });

          if (freeUserTimeTrackers[uid]) {
            freeUserTimeTrackers[uid].warningSent = true;
          }
        }

        // Time's up - kick user
        if (timeStatus.shouldKick) {
          // Force leave room
          try {
            await leaveRoom(roomId, uid);
          } catch (e) {
            console.error("Error leaving room on daily limit:", e);
          }

          // Notify the user
          io.to(socketId).emit("session-expired", {
            message: `Bạn đã sử dụng hết ${dailyLimitMinutes / 60} giờ học miễn phí hôm nay. Nâng cấp HOCA+ để học không giới hạn!`,
            reason: "DAILY_LIMIT_REACHED",
          });

          // Emit leave to others
          io.to(roomId).emit("user-left", {
            userId: uid,
            socketId,
            reason: "daily_limit",
          });

          // Force disconnect from room
          const targetSocket = io.sockets.sockets.get(socketId);
          if (targetSocket) {
            targetSocket.leave(roomId);
          }

          // Clear tracker
          clearFreeUserTracker(uid);

          console.log(
            `FREE user ${uid} kicked from room ${roomId} - daily limit reached`,
          );
        }
      } catch (err) {
        console.error("Error in FREE user time tracker:", err);
      }
    }, 30000); // Check every 30 seconds

    freeUserTimeTrackers[uid] = {
      checkInterval,
      roomId,
      socketId,
      startTime: Date.now(),
      warningSent: false,
    };

    console.log(`Started daily time tracker for FREE user ${uid}`);
  };

  // Helper to switch phases
  const runTimerPhase = (roomId, phase, modeKey) => {
    const config = TIMER_MODES[modeKey] || TIMER_MODES["POMODORO_25_5"];
    const duration = phase === "FOCUS" ? config.focus : config.break;

    if (!duration) return; // Should not happen for valid modes logic

    const startTime = Date.now();
    const endTime = startTime + duration * 60 * 1000;

    // Update State
    if (roomTimers[roomId]) {
      clearTimeout(roomTimers[roomId].timeout);
    }

    roomTimers[roomId] = {
      status: phase, // 'FOCUS' or 'BREAK'
      startTime,
      duration,
      mode: modeKey,
      endTime,
      timeout: setTimeout(
        () => {
          // Phase Complete! Switch!
          const nextPhase = phase === "FOCUS" ? "BREAK" : "FOCUS";
          runTimerPhase(roomId, nextPhase, modeKey);
        },
        duration * 60 * 1000,
      ),
    };

    // Broadcast Update
    io.to(roomId).emit("timer-update", {
      status: phase,
      startTime,
      duration,
      mode: modeKey,
      serverTime: Date.now(),
    });

    // Optional: Notify Chat
    const message =
      phase === "FOCUS"
        ? "🔔 Focus Time Started! Good luck!"
        : "☕ Break Time! Relax for a bit.";

    io.to(roomId).emit("chat-message", {
      userId: "system",
      displayName: "System",
      message,
      timestamp: new Date().toISOString(),
    });
  };

  socket.on("join-room", async ({ roomId, password }) => {
    try {
      if (!roomId) throw new Error("Room ID is required");

      console.log(
        `[JOIN] User ${userId} (${socket.user.displayName}) attempting to join room ${roomId}`,
      );

      const result = await joinRoom(roomId, userId, password);

      if (result.previousRoomId) {
        const previousRoomId = result.previousRoomId;
        const previousRoomSockets = await io.in(previousRoomId).fetchSockets();

        for (const participantSocket of previousRoomSockets) {
          if (participantSocket.user?.id?.toString() !== userId.toString()) continue;
          participantSocket.leave(previousRoomId);
          if (participantSocket.id !== socket.id) {
            participantSocket.emit("room-switched", {
              roomId: previousRoomId,
              message: "Tài khoản của bạn đã chuyển sang một phòng học khác.",
            });
          }
        }

        io.to(previousRoomId).emit("user-left", {
          userId,
          userName: socket.user.displayName,
        });
      }

      socket.join(roomId);

      console.log(`[JOIN] User ${userId} successfully joined room ${roomId}`);
      console.log(
        `[JOIN] Sockets now in room:`,
        await io.in(roomId).allSockets(),
      );

      // Get all sockets in this room to build online users list
      const socketsInRoom = await io.in(roomId).fetchSockets();
      const onlineUsers = socketsInRoom.map((s) => ({
        userId: s.user?.id,
        userName: s.user?.displayName || "User",
        avatar: s.user?.avatar,
        socketId: s.id,
      }));

      // Broadcast to others that new user joined
      socket.to(roomId).emit("user-joined", {
        userId,
        userName: socket.user.displayName,
        socketId: socket.id,
        userInfo: {
          displayName: socket.user.displayName,
          avatar: socket.user.avatar,
          subscriptionTier: socket.user.subscriptionTier,
          rank: socket.user.rank,
        },
      });

      // Send current online users list to the joining user
      socket.emit("room-users", onlineUsers);

      // Broadcast updated users list to everyone in room
      io.to(roomId).emit("room-users", onlineUsers);

      // Send room info to the joining user (includes owner for close button)
      const room = await Room.findById(roomId).populate(
        "owner",
        "_id displayName",
      );
      const user = await User.findById(userId);

      if (room) {
        // Check mic permission for this user in this room
        const micPermission = user
          ? subscriptionService.checkMicPermission(user, room)
          : { canUseMic: false, hideMicIcon: true };

        socket.emit("room-info", {
          roomId: room._id,
          name: room.name,
          ownerId: room.owner?._id?.toString(),
          ownerName: room.owner?.displayName,
          maxParticipants: room.maxParticipants,
          isPublic: room.isPublic,
          timerMode: room.timerMode,
          // NEW: Room type and mic permission info
          roomType: room.roomType,
          micPermission: {
            canUseMic: micPermission.canUseMic,
            hideMicIcon: micPermission.hideMicIcon || false,
            showUpgrade: micPermission.showUpgrade || false,
            reason: micPermission.reason,
          },
        });
      }

      // Start FREE user daily time tracker if applicable
      const tier = socket.user.subscriptionTier || "FREE";
      if (tier === "FREE" && socket.user.role !== "ADMIN") {
        await startFreeUserTimeTracker(userId, roomId, socket.id);

        const tierLimits = subscriptionService.getTierLimits("FREE");

        // Send session info to client
        socket.emit("session-info", {
          tier: "FREE",
          dailyLimitMinutes: tierLimits.dailyStudyMinutes,
          remainingMinutes: result.remainingMinutes,
          warningBeforeMinutes: tierLimits.warningBeforeKickMinutes,
          startTime: Date.now(),
        });
      }

      // Sync Timer - if timer exists, sync it; if not, auto-start!
      if (roomTimers[roomId]) {
        const { status, startTime, duration, mode } = roomTimers[roomId];
        socket.emit("timer-sync", {
          status,
          startTime,
          duration,
          mode,
          serverTime: Date.now(),
        });
      } else {
        // Auto-start timer for the room with default mode
        const roomForTimer = await Room.findById(roomId);
        const mode = roomForTimer?.timerMode || "POMODORO_25_5";
        runTimerPhase(roomId, "FOCUS", mode);
        console.log(`Auto-started timer for room ${roomId} with mode ${mode}`);
      }

      console.log(
        `User ${userId} (${tier}) joined room ${roomId}, roomType: ${room?.roomType}`,
      );
    } catch (error) {
      console.error(
        `[JOIN ERROR] User ${userId} failed to join room ${roomId}:`,
        error.message,
      );
      socket.emit("error", { message: error.message });
    }
  });

  socket.on("leave-room", async ({ roomId }) => {
    // Clear FREE user tracker when leaving
    clearFreeUserTracker(userId);
    await handleLeave(roomId);
  });

  // Ghost Mode for Admin (Silent Join)
  socket.on("admin-join-room", async ({ roomId }) => {
    try {
      if (socket.user.role !== "ADMIN") throw new Error("Unauthorized");

      socket.join(roomId);
      console.log(`Admin ${socket.user.id} spectating room ${roomId}`);

      if (roomTimers[roomId]) {
        const { status, startTime, duration, mode } = roomTimers[roomId];
        socket.emit("timer-sync", {
          status,
          startTime,
          duration,
          mode,
          serverTime: Date.now(),
        });
      }
    } catch (error) {
      socket.emit("error", { message: error.message });
    }
  });

  socket.on("disconnecting", () => {
    // Clear FREE user tracker on disconnect
    clearFreeUserTracker(userId);

    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      if (roomId === socket.id) return;

      // Give the client a short reconnect window. Without this check, a slow
      // cleanup from the old socket can remove the participant after the new
      // socket has already rejoined the room.
      const reconnectGraceTimer = setTimeout(async () => {
        try {
          const currentSockets = await io.in(roomId).fetchSockets();
          const hasReconnected = currentSockets.some(
            (candidate) => String(candidate.user?.id) === String(userId),
          );
          if (!hasReconnected) await handleLeave(roomId);
        } catch (error) {
          console.error("Reconnect cleanup error:", error.message);
        }
      }, 3000);
      reconnectGraceTimer.unref?.();
    });
  });

  const handleLeave = async (roomId) => {
    try {
      console.log(
        `[LEAVE] User ${userId} (${socket.user.displayName}) leaving room ${roomId}`,
      );

      await leaveRoom(roomId, userId);
      socket.leave(roomId);

      console.log(`[LEAVE] Socket ${socket.id} left room ${roomId}`);

      // Notify others that user left
      socket.to(roomId).emit("user-left", {
        userId,
        userName: socket.user.displayName,
        socketId: socket.id,
      });

      // Update online users list for remaining users AFTER socket left
      const socketsInRoom = await io.in(roomId).fetchSockets();
      const onlineUsers = socketsInRoom.map((s) => ({
        userId: s.user?.id,
        userName: s.user?.displayName || "User",
        socketId: s.id,
      }));

      console.log(
        `[LEAVE] Remaining users in room ${roomId}:`,
        onlineUsers.length,
      );

      // Broadcast updated user list to remaining users only
      io.to(roomId).emit("room-users", onlineUsers);

      // Check and unlock badges after leaving room (study time was recorded)
      try {
        const result = await checkAndUnlockBadges(userId, io);
        if (result.newBadges && result.newBadges.length > 0) {
          console.log(
            `User ${userId} unlocked ${result.newBadges.length} new badge(s)`,
          );
        }
      } catch (badgeErr) {
        console.error("Error checking badges on leave:", badgeErr);
      }

      // Note: We do NOT stop the timer if users leave.
      // It continues running as long as the server is up (or until explicit stop).
    } catch (err) {
      console.error(err);
    }
  };

  // Timer Controls
  socket.on("timer-start", async ({ roomId }) => {
    // Determine mode from DB
    try {
      if (!(await canManageRoom(roomId))) {
        return socket.emit("error", { message: "Bạn không có quyền điều khiển bộ đếm của phòng." });
      }
      const room = await Room.findById(roomId);
      if (!room) return;

      // Default or Custom mode
      const mode = room.timerMode || "POMODORO_25_5";

      // Start Loop
      runTimerPhase(roomId, "FOCUS", mode);
    } catch (e) {
      console.error("Failed to start timer", e);
    }
  });

  // Explicit Stop (Optional, maybe for closing room)
  socket.on("timer-stop", async ({ roomId }) => {
    if (!(await canManageRoom(roomId))) {
      return socket.emit("error", { message: "Bạn không có quyền điều khiển bộ đếm của phòng." });
    }
    if (roomTimers[roomId]) {
      clearTimeout(roomTimers[roomId].timeout);
      delete roomTimers[roomId];
      io.to(roomId).emit("timer-update", { status: "IDLE" });
    }
  });

  // Change timer mode - syncs to all users in room
  socket.on("timer-mode-change", async ({ roomId, mode }) => {
    if (!(await canManageRoom(roomId))) {
      return socket.emit("error", { message: "Bạn không có quyền đổi chế độ của phòng." });
    }
    // Validate mode
    const validModes = ["POMODORO_25_5", "POMODORO_50_10", "POMODORO_90_15"];
    if (!validModes.includes(mode)) {
      mode = "POMODORO_25_5";
    }

    console.log(
      `User ${socket.user.displayName} changed timer mode to ${mode} in room ${roomId}`,
    );

    // Restart timer with new mode (resets to FOCUS phase with new duration)
    runTimerPhase(roomId, "FOCUS", mode);

    // Notify room
    io.to(roomId).emit("chat-message", {
      userId: "system",
      displayName: "System",
      message: `🔄 ${socket.user.displayName} đã đổi chế độ Pomodoro thành ${mode.replace("POMODORO_", "").replace("_", "/")}`,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("signal", ({ roomId, signal, to }) => {
    if (!isJoined(roomId) || !to) return;
    const target = io.sockets.sockets.get(to);
    if (!target?.rooms?.has(String(roomId))) return;
    io.to(to).emit("signal", {
      signal,
      from: socket.id,
      userInfo: {
        userId: socket.user.id,
        displayName: socket.user.displayName,
        avatar: socket.user.avatar,
        rank: socket.user.rank,
      },
    });
  });

  socket.on(
    "chat-message",
    async ({
      roomId,
      message,
      content,
      type = "TEXT",
      stickerId,
      mentions = [],
    }) => {
      if (!roomId || !socket.rooms.has(String(roomId))) {
        socket.emit("chat-error", {
          message: "Bạn phải tham gia phòng trước khi gửi tin nhắn.",
        });
        return;
      }

      // ✅ DEBUG: Log incoming message
      console.log(
        `[CHAT] User ${socket.user.displayName} (${userId}) sent message in room ${roomId}: "${message || content}"`,
      );

      // ✅ CHANGED: Allow ALL users to chat (FREE + PREMIUM + ADMIN)
      // Chat is now available for everyone!
      // const tier = socket.user.subscriptionTier || "FREE";
      // const canChat = tier !== "FREE" || socket.user.role === "ADMIN";

      // if (!canChat) {
      //   socket.emit("chat-error", {
      //     message:
      //       "Tính năng chat chỉ dành cho gói HOCA+ Tháng trở lên. Nâng cấp ngay!",
      //   });
      //   return;
      // }

      // Enforce chat ban (violation escalation)
      try {
        const { isChatBanned } = require("../services/moderation.service");
        const freshUser = await User.findById(userId).select("chatBannedUntil");
        if (isChatBanned(freshUser)) {
          const until = new Date(freshUser.chatBannedUntil).toLocaleString(
            "vi-VN",
          );
          socket.emit("chat-error", {
            message: `Bạn đang bị tạm khóa chat do vi phạm quy tắc. Mở lại sau: ${until}`,
          });
          return;
        }
      } catch (e) {
        console.error("Chat ban check error:", e.message);
      }

      const displayName = socket.user.displayName || "User";
      let msgContent = content || message; // Fallback

      // Lọc từ ngữ thô tục: che bằng dấu * và cảnh báo người gửi (chỉ với tin nhắn text)
      if (type === "TEXT" && msgContent) {
        const {
          containsProfanity,
          cleanText,
        } = require("../services/profanity.service");
        if (containsProfanity(msgContent)) {
          msgContent = cleanText(msgContent);
          socket.emit("chat-warning", {
            message:
              "⚠️ Tin nhắn của bạn chứa từ ngữ không phù hợp và đã được che. Vui lòng giữ văn minh theo quy tắc cộng đồng.",
          });
        }
      }

      try {
        // Save to DB for history
        const savedMessage = await Message.create({
          room: roomId,
          sender: userId,
          content: msgContent,
          type,
          stickerId,
          mentions,
        });

        // ✅ DEBUG: Log before broadcast
        console.log(
          `[CHAT] Broadcasting message ${savedMessage._id} to room ${roomId}`,
        );
        console.log(
          `[CHAT] Sockets in room:`,
          await io.in(roomId).allSockets(),
        );

        io.to(roomId).emit("chat-message", {
          _id: savedMessage._id,
          userId,
          displayName,
          avatar: socket.user.avatar,
          message: msgContent, // Maintain 'message' field for frontend compatibility
          content: msgContent,
          type,
          stickerId,
          mentions,
          timestamp: savedMessage.createdAt,
        });

        // ✅ DEBUG: Confirm broadcast
        console.log(`[CHAT] Message broadcasted successfully`);

        // AI Bot Auto-Reply Logic
        if (
          (mentions && mentions.includes("HOCA_AI_BOT")) ||
          (msgContent && msgContent.toLowerCase().includes("@hoca ai"))
        ) {
          io.to(roomId).emit("ai-thinking", { isThinking: true });

          (async () => {
            try {
              const question = msgContent.replace(/@HOCA AI/gi, "").trim();
              if (!question) return;

              const aiResult = await aiService.askAI(
                question,
                socket.user,
                [],
                "ROOM",
              );

              io.to(roomId).emit("chat-message", {
                _id: "ai_" + Date.now(),
                userId: "HOCA_AI_BOT",
                displayName: "HOCA AI",
                avatar: "/ai-mascot.png", // Uses the mascot image
                message: aiResult.response,
                content: aiResult.response,
                type: "TEXT",
                timestamp: new Date().toISOString(),
              });
            } catch (aiErr) {
              const isLimitError =
                aiErr.code === "ROOM_AI_PREMIUM_REQUIRED" ||
                aiErr.code === "AI_DAILY_LIMIT_REACHED" ||
                aiErr.message.includes("hết lượt") ||
                aiErr.message.includes("Nâng cấp");
              if (isLimitError) {
                socket.emit("chat-message", {
                  userId: "HOCA_AI_BOT",
                  displayName: "HOCA AI",
                  message: `😿 ${aiErr.message}`,
                  content: `😿 ${aiErr.message}`,
                  type: "SYSTEM",
                  timestamp: new Date().toISOString(),
                });
              }
              console.error("AI Bot Error:", aiErr.message);
            } finally {
              io.to(roomId).emit("ai-thinking", { isThinking: false });
            }
          })();
        }
      } catch (error) {
        console.error("Chat persistence error:", error);
        // Still emit even if save fails? Maybe better to warn.
        socket.emit("error", { message: "Failed to send message" });
      }
    },
  );

  // Media State Broadcast (camera/mic on/off)
  // Includes mic permission check for HOCA+ feature
  socket.on("media-state-update", async ({ roomId, isCameraOn, isMicOn }) => {
    try {
      if (!isJoined(roomId)) {
        return socket.emit("error", { message: "Bạn chưa tham gia phòng này." });
      }
      const room = await Room.findById(roomId);
      const user = await User.findById(userId);
      if (!room || !user) throw new Error("Room or user not found");
      if (isCameraOn && room.roomType !== "VIDEO") {
        return socket.emit("media-blocked", { message: "Camera chỉ khả dụng trong Phòng Camera." });
      }
      // If user is trying to turn on mic, check permission
      if (isMicOn) {
        {
          const permission = subscriptionService.checkMicPermission(user, room);

          if (permission.canUseMic && room.roomType === "DISCUSSION") {
            const session = await DiscussionSession.findOne({ room: roomId });
            const uid = String(user._id);
            const canManage =
              String(room.owner || "") === uid ||
              user.role === "ADMIN" ||
              session?.coHosts?.some((id) => String(id) === uid);
            const isSpeaker = String(session?.activeSpeaker?.user || "") === uid;
            if (!canManage && !isSpeaker) {
              permission.canUseMic = false;
              permission.reason =
                "Hãy giơ tay và chờ chủ phòng mời bạn phát biểu.";
            }
          }

          if (!permission.canUseMic) {
            // Block mic activation and notify user
            socket.emit("mic-blocked", {
              message: permission.reason,
              showUpgrade: permission.showUpgrade || false,
              roomType: room.roomType,
            });

            // Don't broadcast mic-on to others
            socket.to(roomId).emit("media-state-update", {
              socketId: socket.id,
              userId: socket.user.id,
              isCameraOn,
              isMicOn: false, // Force mic off in broadcast
            });
            return;
          }
        }
      }

      // Permission granted or mic is being turned off - broadcast normally
      socket.to(roomId).emit("media-state-update", {
        socketId: socket.id,
        userId: socket.user.id,
        isCameraOn,
        isMicOn,
      });
    } catch (error) {
      console.error("Error in media-state-update:", error);
      socket.emit("media-blocked", { message: "Không thể xác minh quyền camera/micro." });
    }
  });

  // Request mic permission - client can call this to check before enabling mic
  socket.on("request-mic-permission", async ({ roomId }) => {
    try {
      if (!isJoined(roomId)) {
        return socket.emit("mic-permission-result", {
          canUseMic: false,
          reason: "Bạn chưa tham gia phòng này.",
        });
      }
      const room = await Room.findById(roomId);
      const user = await User.findById(userId);

      if (!room || !user) {
        socket.emit("mic-permission-result", {
          canUseMic: false,
          reason: "Room or user not found",
        });
        return;
      }

      const permission = subscriptionService.checkMicPermission(user, room);
      if (permission.canUseMic && room.roomType === "DISCUSSION") {
        const session = await DiscussionSession.findOne({ room: roomId });
        const uid = String(user._id);
        const canManage =
          String(room.owner || "") === uid ||
          user.role === "ADMIN" ||
          session?.coHosts?.some((id) => String(id) === uid);
        const isSpeaker = String(session?.activeSpeaker?.user || "") === uid;
        if (!canManage && !isSpeaker) {
          permission.canUseMic = false;
          permission.reason =
            "Hãy giơ tay và chờ chủ phòng mời bạn phát biểu.";
        }
      }
      const tier = subscriptionService.getEffectiveTier(user);

      socket.emit("mic-permission-result", {
        canUseMic: permission.canUseMic,
        reason: permission.reason,
        showUpgrade: permission.showUpgrade || false,
        hideMicIcon: permission.hideMicIcon || false,
        roomType: room.roomType,
        userTier: tier,
      });
    } catch (error) {
      socket.emit("mic-permission-result", {
        canUseMic: false,
        reason: "Error checking permission",
      });
    }
  });

  // Discussion workspace data is persisted through the REST API. This event
  // only tells other connected members to fetch the latest saved session.
  socket.on("discussion-session-updated", ({ roomId }) => {
    if (!roomId || !socket.rooms.has(String(roomId))) return;
    socket.to(String(roomId)).emit("discussion-session-refresh", { roomId });
  });

  // ============ Chủ phòng mời thành viên ra khỏi phòng (KICK) ============
  socket.on("kick-user", async ({ roomId, targetUserId }) => {
    try {
      if (!roomId || !targetUserId) {
        throw new Error("Thiếu thông tin phòng hoặc người dùng");
      }

      const room = await Room.findById(roomId);
      if (!room) throw new Error("Không tìm thấy phòng");

      // Chỉ chủ phòng (hoặc admin) mới được kick
      const session = await DiscussionSession.findOne({ room: roomId }).select("coHosts");
      const isOwner = room.owner?.toString() === userId;
      const isCoHost = session?.coHosts?.some((id) => String(id) === String(userId));
      const isAdmin = socket.user.role === "ADMIN";
      if (!isOwner && !isCoHost && !isAdmin) {
        throw new Error("Chỉ chủ phòng mới có quyền mời thành viên ra ngoài");
      }

      // Không thể tự kick chính mình
      if (targetUserId === userId) {
        throw new Error("Bạn không thể tự mời chính mình ra ngoài");
      }

      // Tìm tất cả socket của người bị kick trong phòng này
      const socketsInRoom = await io.in(roomId).fetchSockets();
      const targetSockets = socketsInRoom.filter(
        (s) => s.user?.id === targetUserId,
      );

      // Cập nhật trạng thái rời phòng trong DB
      try {
        await leaveRoom(roomId, targetUserId);
      } catch (e) {
        console.error("Lỗi khi cập nhật leaveRoom lúc kick:", e.message);
      }

      // Thông báo cho người bị kick và buộc rời phòng
      for (const ts of targetSockets) {
        io.to(ts.id).emit("kicked", {
          roomId,
          message: "Bạn đã bị chủ phòng mời ra khỏi phòng học.",
        });
        ts.leave(roomId);
      }

      // Thông báo cho mọi người còn lại
      io.to(roomId).emit("user-left", {
        userId: targetUserId,
        reason: "kicked",
      });

      // Cập nhật lại danh sách online
      const remaining = await io.in(roomId).fetchSockets();
      const onlineUsers = remaining.map((s) => ({
        userId: s.user?.id,
        userName: s.user?.displayName || "User",
        avatar: s.user?.avatar,
        socketId: s.id,
      }));
      io.to(roomId).emit("room-users", onlineUsers);

      // Tin nhắn hệ thống trong chat
      io.to(roomId).emit("chat-message", {
        userId: "system",
        displayName: "System",
        message: "👮 Một thành viên đã bị chủ phòng mời ra khỏi phòng.",
        type: "SYSTEM",
        timestamp: new Date().toISOString(),
      });

      console.log(
        `[KICK] Owner ${userId} kicked user ${targetUserId} from room ${roomId}`,
      );
    } catch (error) {
      socket.emit("error", { message: error.message });
    }
  });
};

module.exports = registerRoomHandlers;
