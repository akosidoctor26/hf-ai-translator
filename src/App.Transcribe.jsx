import React, { useEffect, useRef, useState } from 'react';
import useMediaRecorder, { RECORDING_STATES } from './utils/useMediaRecorder';
import { MessageTypes } from './constants';

const App = () => {
  const audioRef = useRef();
  const worker = useRef();
  const [transcribedText, setTranscribedText] = useState('');
  const { status, startRecording, stopRecording, mediaBlob } = useMediaRecorder(
    {
      onStop: (ev, { mediaBlob }) => {
        audioRef.current.src = URL.createObjectURL(mediaBlob);
      },
    }
  );

  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(
        new URL('./workers/transcribe.worker.js', import.meta.url),
        { type: 'module' }
      );
    }

    const onMessageReceived = (e) => {
      console.log(e);
      setTranscribedText(e.data?.result?.text);
    };
    worker.current.addEventListener('message', onMessageReceived);

    return () =>
      worker.current.removeEventListener('message', onMessageReceived);
  }, []);

  const decodeAudio = async () => {
    const audioCtx = new AudioContext({ sampleRate: 16000 });
    const arrayBuffer = await mediaBlob.arrayBuffer();
    const decodedAudioData = await audioCtx.decodeAudioData(arrayBuffer);
    const audio = decodedAudioData.getChannelData(0);

    return audio;
  };

  const handleTranscribe = async () => {
    if (!mediaBlob) return;

    let audio = await decodeAudio(mediaBlob);
    const model_name = `openai/whisper-tiny.en`;

    worker.current.postMessage({
      type: MessageTypes.INFERENCE_REQUEST,
      audio,
      model_name,
    });
  };

  return (
    <div>
      <button
        onClick={
          status === RECORDING_STATES.INACTIVE ? startRecording : stopRecording
        }
      >
        {status === RECORDING_STATES.INACTIVE ? 'Record' : 'Stop'}
      </button>
      <audio ref={audioRef} controls></audio>
      {audioRef?.current?.src && (
        <button onClick={handleTranscribe}>Transcribe</button>
      )}
      <div>{transcribedText}</div>
    </div>
  );
};

export default App;
