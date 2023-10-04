import { useRef, useState } from 'react';

export const RECORDING_STATES = {
  INACTIVE: 'inactive',
  RECORDING: 'recording',
  PAUSED: 'paused',
};

const mimeType = 'audio/mp4';
const useMediaRecorder = ({
  mediaStreamConstraints = { audio: true, video: false },
  mediaRecorderOptions = { type: mimeType },
  onStart = () => {},
  onResume = () => {},
  onPause = () => {},
  onStop: onCustomStop = () => {},
  onError: onCustomError = () => {},
} = {}) => {
  // Refs
  const mediaStream = useRef();
  const mediaRecorder = useRef();
  const mediaChunks = useRef([]);

  // States
  const [mediaBlob, setMediaBlob] = useState();
  const [status, setStatus] = useState(RECORDING_STATES.INACTIVE);

  //#region Event Handlers
  const onStop = (event) => {
    const mediaBlob = new Blob(mediaChunks.current, mediaRecorderOptions);
    setMediaBlob(mediaBlob);
    console.log(`Recording Status: ${status}`);

    onCustomStop(event, { mediaBlob });
  };

  const onError = (event) => {
    console.log(event.error.name);

    onCustomError(event);
  };

  const onDataAvailable = (ev) => {
    if (ev?.data && ev.data.size > 0) {
      mediaChunks.current?.push(ev.data);
    }
  };

  //#endregion

  const getMediaStream = async () => {
    // Get stream from media devices
    try {
      const tmpMediaStream = await navigator.mediaDevices.getUserMedia(
        mediaStreamConstraints
      );
      mediaStream.current = tmpMediaStream;
    } catch (error) {
      console.log(error.message);
    }
  };

  // #region Triggers
  const startRecording = async () => {
    if (!mediaStream.current) {
      await getMediaStream();
    }
    // setup MediaRecorder
    mediaRecorder.current = new MediaRecorder(
      mediaStream.current,
      mediaRecorderOptions
    );

    mediaRecorder.current.onstart = onStart;
    mediaRecorder.current.onPause = onPause;
    mediaRecorder.current.onResume = onResume;
    mediaRecorder.current.onstop = onStop;
    mediaRecorder.current.ondataavailable = onDataAvailable;
    mediaRecorder.current.onError = onError;
    mediaRecorder.current.start();
    setStatus(mediaRecorder?.current?.state);
    console.log(`Recording Status: ${mediaRecorder?.current?.state}`);
  };

  const stopRecording = async () => {
    mediaRecorder?.current?.stop();
    setStatus(mediaRecorder?.current?.state);
    mediaChunks.current = [];
  };

  const resumeRecording = async () => {
    if (mediaRecorder?.current?.state === RECORDING_STATES.PAUSED) {
      mediaRecorder?.current?.resume();
    }
  };

  const pauseRecording = async () => {
    if (mediaRecorder?.current?.state === RECORDING_STATES.RECORDING) {
      mediaRecorder?.current?.resume();
    }
  };

  // #endregion

  return {
    startRecording,
    stopRecording,
    resumeRecording,
    pauseRecording,
    mediaBlob,
    status,
  };
};

export default useMediaRecorder;
