import { useEffect, useRef, useState, useCallback } from "react";

/**
 * WebRTC mesh (P2P) hook for video rooms.
 * Uses the backend socket "signal" relay:
 *   client -> emit("signal", { to: <socketId>, signal })
 *   server -> emit("signal", { from: <socketId>, signal, userInfo })
 *
 * Strategy: the newcomer (who receives the existing "room-users" list)
 * initiates offers to everyone already in the room. Existing peers answer.
 */
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export default function useWebRTC(socket, roomId, enabled) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // socketId -> { stream, userInfo }
  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const peersRef = useRef({}); // socketId -> RTCPeerConnection
  const localStreamRef = useRef(null);
  const mySocketIdRef = useRef(null);

  const retryMedia = useCallback(() => {
    setMediaError(null);
    setRetryCount((c) => c + 1);
  }, []);

  // ---- Acquire local camera + mic ----
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError(
        "Trình duyệt không hỗ trợ camera/mic, hoặc trang không chạy trên HTTPS/localhost.",
      );
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        // Start with cam & mic OFF (tracks disabled) until user enables
        stream.getVideoTracks().forEach((t) => (t.enabled = false));
        stream.getAudioTracks().forEach((t) => (t.enabled = false));
        localStreamRef.current = stream;
        setLocalStream(stream);
        setMediaError(null);
      })
      .catch((err) => {
        console.error("getUserMedia error:", err);
        let msg = "Không truy cập được camera/mic.";
        if (err.name === "NotAllowedError" || err.name === "SecurityError") {
          msg =
            "Bạn đã chặn quyền camera/mic. Hãy bấm biểu tượng camera trên thanh địa chỉ, chọn 'Cho phép', rồi bấm Thử lại.";
        } else if (err.name === "NotFoundError") {
          msg = "Không tìm thấy camera/mic trên thiết bị này.";
        } else if (err.name === "NotReadableError") {
          msg =
            "Camera/mic đang được app khác sử dụng (Zoom, Meet...). Hãy đóng app đó rồi thử lại.";
        }
        setMediaError(msg);
      });

    return () => {
      cancelled = true;
      const s = localStreamRef.current;
      if (s) s.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, retryCount]);

  // ---- Create a peer connection for a given remote socket ----
  const createPeer = useCallback(
    (remoteSocketId, initiator, userInfo) => {
      if (peersRef.current[remoteSocketId]) {
        return peersRef.current[remoteSocketId];
      }

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peersRef.current[remoteSocketId] = pc;

      // Add local tracks
      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      // Remote track -> show video
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        setRemoteStreams((prev) => ({
          ...prev,
          [remoteSocketId]: {
            stream,
            userInfo: userInfo || prev[remoteSocketId]?.userInfo,
          },
        }));
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("signal", {
            roomId,
            to: remoteSocketId,
            signal: { type: "candidate", candidate: event.candidate },
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "closed" ||
          pc.connectionState === "disconnected"
        ) {
          removePeer(remoteSocketId);
        }
      };

      if (initiator) {
        pc.onnegotiationneeded = async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("signal", {
              roomId,
              to: remoteSocketId,
              signal: { type: "offer", sdp: pc.localDescription },
            });
          } catch (e) {
            console.error("negotiation error", e);
          }
        };
      }

      return pc;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [socket, roomId],
  );

  const removePeer = useCallback((remoteSocketId) => {
    const pc = peersRef.current[remoteSocketId];
    if (pc) {
      pc.close();
      delete peersRef.current[remoteSocketId];
    }
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[remoteSocketId];
      return next;
    });
  }, []);

  // ---- Socket signaling wiring ----
  useEffect(() => {
    if (!enabled || !socket || !localStream) return;

    // Capture my socket id
    mySocketIdRef.current = socket.id;

    // When I receive the list of users already in the room, I initiate to each
    const onRoomUsers = (users) => {
      users.forEach((u) => {
        if (!u.socketId || u.socketId === socket.id) return;
        if (!peersRef.current[u.socketId]) {
          createPeer(u.socketId, true, {
            displayName: u.userName || u.userInfo?.displayName,
          });
        }
      });
    };

    const onSignal = async ({ from, signal, userInfo }) => {
      if (!from) return;
      let pc = peersRef.current[from];

      if (signal.type === "offer") {
        if (!pc) pc = createPeer(from, false, userInfo);
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("signal", {
          roomId,
          to: from,
          signal: { type: "answer", sdp: pc.localDescription },
        });
      } else if (signal.type === "answer") {
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        }
      } else if (signal.type === "candidate") {
        if (pc && signal.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.error("addIceCandidate error", e);
          }
        }
      }
    };

    const onUserLeft = (data) => {
      if (data.socketId) removePeer(data.socketId);
    };

    socket.on("room-users", onRoomUsers);
    socket.on("signal", onSignal);
    socket.on("user-left", onUserLeft);

    return () => {
      socket.off("room-users", onRoomUsers);
      socket.off("signal", onSignal);
      socket.off("user-left", onUserLeft);
    };
  }, [enabled, socket, localStream, createPeer, removePeer, roomId]);

  // ---- Cleanup all peers on unmount ----
  useEffect(() => {
    return () => {
      Object.keys(peersRef.current).forEach((id) => {
        peersRef.current[id].close();
      });
      peersRef.current = {};
    };
  }, []);

  // ---- Controls ----
  const toggleCam = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !camOn;
    stream.getVideoTracks().forEach((t) => (t.enabled = next));
    setCamOn(next);
    socket?.emit("media-state-update", {
      roomId,
      isCameraOn: next,
      isMicOn: micOn,
    });
  }, [camOn, micOn, socket, roomId]);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !micOn;
    stream.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
    socket?.emit("media-state-update", {
      roomId,
      isCameraOn: camOn,
      isMicOn: next,
    });
  }, [camOn, micOn, socket, roomId]);

  // ---- Screen sharing ----
  const cameraTrackRef = useRef(null);

  const replaceVideoTrack = useCallback((newTrack) => {
    Object.values(peersRef.current).forEach((pc) => {
      const sender = pc
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");
      if (sender && newTrack) sender.replaceTrack(newTrack);
    });
  }, []);

  const stopScreenShare = useCallback(() => {
    const camTrack = cameraTrackRef.current;
    if (camTrack) {
      replaceVideoTrack(camTrack);
      camTrack.enabled = camOn;
    }
    cameraTrackRef.current = null;
    setSharing(false);
  }, [camOn, replaceVideoTrack]);

  const toggleScreenShare = useCallback(async () => {
    if (sharing) {
      stopScreenShare();
      return;
    }
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const screenTrack = display.getVideoTracks()[0];
      const stream = localStreamRef.current;
      cameraTrackRef.current = stream?.getVideoTracks()[0] || null;
      replaceVideoTrack(screenTrack);
      setSharing(true);
      screenTrack.onended = () => stopScreenShare();
    } catch (e) {
      console.error("screen share error", e);
    }
  }, [sharing, replaceVideoTrack, stopScreenShare]);

  return {
    localStream,
    remoteStreams,
    camOn,
    micOn,
    sharing,
    mediaError,
    toggleCam,
    toggleMic,
    toggleScreenShare,
    retryMedia,
  };
}
