import { useEffect, useState } from "react";

const WASM_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_PATH = `${import.meta.env.BASE_URL}models/selfie_segmenter_landscape.tflite`;
const TARGET_WIDTH = 640;
const PROCESS_INTERVAL_MS = 90;

let segmenterPromise;

async function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const { FilesetResolver, ImageSegmenter } = await import(
        "@mediapipe/tasks-vision"
      );
      const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
      const segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_PATH,
        },
        runningMode: "VIDEO",
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      });
      const labels = segmenter.getLabels();
      const labelledPersonIndex = labels.findIndex((label) =>
        label.toLowerCase().includes("person"),
      );

      return {
        segmenter,
        // The bundled selfie segmenter normally exposes one foreground mask
        // at index 0. Some MediaPipe builds include background + person and
        // put person at index 1, so only trust index 1 when labels confirm it.
        personIndex: labelledPersonIndex >= 0 ? labelledPersonIndex : 0,
      };
    })().catch((error) => {
      segmenterPromise = undefined;
      throw error;
    });
  }

  return segmenterPromise;
}

function loadImage(url) {
  if (!url) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const image = new Image();
    // Presets are served from Unsplash. Anonymous CORS keeps the canvas
    // origin-clean so it can safely be exposed through captureStream().
    if (/^https?:\/\//i.test(url)) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Không đọc được ảnh nền đã chọn."));
    image.src = url;
  });
}

function drawImageCover(context, image, width, height) {
  const sourceWidth = image.videoWidth || image.naturalWidth || image.width;
  const sourceHeight = image.videoHeight || image.naturalHeight || image.height;
  if (!sourceWidth || !sourceHeight) return;

  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  context.drawImage(
    image,
    (width - drawWidth) / 2,
    (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
}

function paintPersonMask(mask, maskContext) {
  const values = mask.getAsFloat32Array();
  const imageData = maskContext.createImageData(mask.width, mask.height);

  for (let index = 0; index < values.length; index += 1) {
    const confidence = Math.min(1, Math.max(0, (values[index] - 0.2) / 0.65));
    const offset = index * 4;
    imageData.data[offset] = 255;
    imageData.data[offset + 1] = 255;
    imageData.data[offset + 2] = 255;
    imageData.data[offset + 3] = Math.round(confidence * 255);
  }

  maskContext.putImageData(imageData, 0, 0);
}

/**
 * Builds a processed camera stream whose video track can replace the raw
 * camera track in WebRTC. All segmentation happens locally in the browser.
 */
export default function useVirtualBackground({
  sourceStream,
  mode,
  backgroundImageUrl,
}) {
  const [processedStream, setProcessedStream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sourceStream || mode === "none") {
      setProcessedStream(null);
      setLoading(false);
      setError(null);
      return undefined;
    }

    if (mode === "image" && !backgroundImageUrl) {
      setProcessedStream(null);
      setLoading(false);
      setError("Hãy chọn một ảnh nền trước.");
      return undefined;
    }

    let cancelled = false;
    let animationFrame;
    let outputTrack;
    let inputVideo;
    let canvasStream;

    setProcessedStream(null);
    setLoading(true);
    setError(null);

    const start = async () => {
      const [{ segmenter, personIndex }, backgroundImage] = await Promise.all([
        getSegmenter(),
        mode === "image" ? loadImage(backgroundImageUrl) : null,
      ]);
      if (cancelled) return;

      inputVideo = document.createElement("video");
      inputVideo.muted = true;
      inputVideo.playsInline = true;
      inputVideo.autoplay = true;
      inputVideo.srcObject = sourceStream;
      await inputVideo.play();

      if (!inputVideo.videoWidth) {
        await new Promise((resolve) => {
          inputVideo.addEventListener("loadedmetadata", resolve, { once: true });
        });
      }
      if (cancelled) return;

      const aspectRatio =
        inputVideo.videoWidth && inputVideo.videoHeight
          ? inputVideo.videoWidth / inputVideo.videoHeight
          : 16 / 9;
      const width = Math.min(TARGET_WIDTH, inputVideo.videoWidth || TARGET_WIDTH);
      const height = Math.round(width / aspectRatio);

      const outputCanvas = document.createElement("canvas");
      const foregroundCanvas = document.createElement("canvas");
      const maskCanvas = document.createElement("canvas");
      outputCanvas.width = foregroundCanvas.width = width;
      outputCanvas.height = foregroundCanvas.height = height;

      const outputContext = outputCanvas.getContext("2d", {
        alpha: false,
      });
      const foregroundContext = foregroundCanvas.getContext("2d");
      let maskContext;
      let lastProcessedAt = 0;
      let processingFrame = false;
      let streamPublished = false;

      const publishProcessedStream = () => {
        if (streamPublished || cancelled) return;
        canvasStream = outputCanvas.captureStream(20);
        outputTrack = canvasStream.getVideoTracks()[0];
        outputTrack.enabled = sourceStream.getVideoTracks()[0]?.enabled ?? false;
        streamPublished = true;
        setProcessedStream(new MediaStream([outputTrack]));
        setLoading(false);
      };

      const drawRawCamera = () => {
        outputContext.save();
        outputContext.filter = "none";
        outputContext.globalCompositeOperation = "source-over";
        outputContext.drawImage(inputVideo, 0, 0, width, height);
        outputContext.restore();
      };

      // Never publish a blank canvas. The raw frame remains visible while the
      // first segmentation result is being prepared.
      drawRawCamera();

      const render = (timestamp) => {
        if (cancelled) return;
        animationFrame = window.requestAnimationFrame(render);
        if (
          timestamp - lastProcessedAt < PROCESS_INTERVAL_MS ||
          processingFrame ||
          inputVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
        ) {
          return;
        }
        lastProcessedAt = timestamp;
        processingFrame = true;

        try {
          segmenter.segmentForVideo(inputVideo, timestamp, (result) => {
            if (cancelled) {
              processingFrame = false;
              return;
            }
            const confidenceMasks = result.confidenceMasks || [];
            const personMask =
              confidenceMasks[personIndex] ||
              (confidenceMasks.length === 1 ? confidenceMasks[0] : null);

            outputContext.save();
            outputContext.clearRect(0, 0, width, height);

            // Draw background
            if (mode === "blur") {
              outputContext.filter = "blur(20px)";
              outputContext.drawImage(
                inputVideo,
                -20,
                -20,
                width + 40,
                height + 40,
              );
              outputContext.filter = "none";
            } else if (backgroundImage) {
              outputContext.fillStyle = "#171B2E";
              outputContext.fillRect(0, 0, width, height);
              drawImageCover(outputContext, backgroundImage, width, height);
            } else {
              outputContext.fillStyle = "#171B2E";
              outputContext.fillRect(0, 0, width, height);
            }
            outputContext.restore();

            // If no person mask was detected, show raw camera (fail-safe).
            if (!personMask) {
              drawRawCamera();
              publishProcessedStream();
              processingFrame = false;
              return;
            }

          if (
            maskCanvas.width !== personMask.width ||
            maskCanvas.height !== personMask.height
          ) {
            maskCanvas.width = personMask.width;
            maskCanvas.height = personMask.height;
            maskContext = maskCanvas.getContext("2d");
          }
            paintPersonMask(personMask, maskContext);

            foregroundContext.clearRect(0, 0, width, height);
            foregroundContext.globalCompositeOperation = "source-over";
            foregroundContext.drawImage(inputVideo, 0, 0, width, height);
            foregroundContext.globalCompositeOperation = "destination-in";
            foregroundContext.drawImage(maskCanvas, 0, 0, width, height);
            foregroundContext.globalCompositeOperation = "source-over";

            outputContext.drawImage(foregroundCanvas, 0, 0);
            publishProcessedStream();
            processingFrame = false;
          });
        } catch (frameError) {
          // A temporary MediaPipe/GPU error must not turn the camera black.
          console.warn("virtual background frame skipped:", frameError);
          drawRawCamera();
          publishProcessedStream();
          processingFrame = false;
        }
      };

      animationFrame = window.requestAnimationFrame(render);
    };

    start().catch((processingError) => {
      if (cancelled) return;
      console.error("virtual background error:", processingError);
      setProcessedStream(null);
      setLoading(false);
      setError(
        "Không thể khởi động phông nền ảo. Hãy kiểm tra kết nối rồi thử lại.",
      );
    });

    return () => {
      cancelled = true;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      if (canvasStream) canvasStream.getTracks().forEach((track) => track.stop());
      if (inputVideo) {
        inputVideo.pause();
        inputVideo.srcObject = null;
      }
    };
  }, [sourceStream, mode, backgroundImageUrl]);

  return { processedStream, loading, error };
}
