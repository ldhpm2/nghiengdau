import { useEffect, useRef, useState, useCallback } from 'react';
import {
  FaceLandmarker,
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
} from '@mediapipe/tasks-vision';

export type HeadTilt = 'left' | 'right' | 'center';

export function useVision() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tilt, setTilt] = useState<HeadTilt>('center');
  const [fingersRaised, setFingersRaised] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    let active = true;

    const initModels = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
        );

        if (!active) return;

        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: 'CPU',
          },
          outputFaceBlendshapes: true,
          runningMode: 'VIDEO',
          numFaces: 1,
        });

        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
        });

        if (active) {
          setIsReady(true);
        }
      } catch (error: any) {
        console.error('Error initializing MediaPipe models:', error);
        if (active) {
          setInitError(error.message || 'Lỗi khởi tạo AI. Vui lòng tải lại trang.');
        }
      }
    };

    initModels();

    return () => {
      active = false;
      if (faceLandmarkerRef.current) faceLandmarkerRef.current.close();
      if (handLandmarkerRef.current) handLandmarkerRef.current.close();
    };
  }, []);

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setCameraError(null);
    } catch (err: any) {
      console.error('Error accessing webcam:', err);
      setCameraError(err.message || 'Không thể truy cập Camera. Vui lòng kiểm tra quyền truy cập.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    cancelAnimationFrame(requestRef.current);
  }, []);

  const detect = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !faceLandmarkerRef.current || !handLandmarkerRef.current) {
      requestRef.current = requestAnimationFrame(detect);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState >= 2 && ctx) {
      const startTimeMs = performance.now();

      // Ensure canvas matches video dimensions
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const drawingUtils = new DrawingUtils(ctx);

      // Detect Face
      const faceResults = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);
      if (faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
        const landmarks = faceResults.faceLandmarks[0];
        
        // Draw face mesh
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, {
          color: '#C0C0C070',
          lineWidth: 1,
        });

        // Calculate head tilt based on y-coordinate difference
        // Left eye index: 33 (user's left), Right eye index: 263 (user's right)
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        
        const yDiff = leftEye.y - rightEye.y;

        // If user tilts to THEIR left, their left eye drops (y increases) -> yDiff > 0.03
        // If user tilts to THEIR right, their right eye drops (y increases) -> yDiff < -0.03
        if (yDiff > 0.03) {
          setTilt('right'); // Người chơi nghiêng trái -> Chọn đáp án Phải (B) trên màn hình
        } else if (yDiff < -0.03) {
          setTilt('left'); // Người chơi nghiêng phải -> Chọn đáp án Trái (A) trên màn hình
        } else {
          setTilt('center');
        }
      } else {
        setTilt('center');
      }

      // Detect Hands
      const handResults = handLandmarkerRef.current.detectForVideo(video, startTimeMs);
      if (handResults.landmarks && handResults.landmarks.length > 0) {
        const landmarks = handResults.landmarks[0];
        
        drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 3,
        });
        drawingUtils.drawLandmarks(landmarks, { color: '#FF0000', lineWidth: 1 });

        // Count raised fingers
        // Finger tip indices: 8 (index), 12 (middle), 16 (ring), 20 (pinky)
        // Finger pip indices: 6, 10, 14, 18
        // Thumb tip: 4, Thumb ip: 3
        let count = 0;
        
        // Thumb (checking x coordinate relative to wrist)
        if (landmarks[4].x < landmarks[3].x) count++; // Assuming right hand for simplicity, can be refined

        // Other fingers (checking y coordinate)
        if (landmarks[8].y < landmarks[6].y) count++;
        if (landmarks[12].y < landmarks[10].y) count++;
        if (landmarks[16].y < landmarks[14].y) count++;
        if (landmarks[20].y < landmarks[18].y) count++;

        setFingersRaised(count);
      } else {
        setFingersRaised(0);
      }
    }

    requestRef.current = requestAnimationFrame(detect);
  }, []);

  useEffect(() => {
    if (isReady) {
      startCamera().then(() => {
        requestRef.current = requestAnimationFrame(detect);
      });
    }
    return () => {
      stopCamera();
    };
  }, [isReady, startCamera, stopCamera, detect]);

  return { videoRef, canvasRef, tilt, fingersRaised, isReady, cameraError, initError };
}
