import { useRef, useEffect, useState } from 'react';

import LanguageSelector from './components/LanguageSelector';
import Progress from './components/Progress';

function App() {
  // Model loading
  const [ready, setReady] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [progressItems, setProgressItems] = useState([]);

  // Inputs and outputs
  const [input, setInput] = useState('I love walking my dog.');
  const [sourceLanguage, setSourceLanguage] = useState('eng_Latn');
  const [targetLanguage, setTargetLanguage] = useState('fra_Latn');
  const [output, setOutput] = useState('');

  const worker = useRef();

  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(new URL('./worker.js', import.meta.url), {
        type: 'module',
      });
    }

    const onMessageReceived = (e) => {
      const { status } = e.data;
      switch (status) {
        case 'initiate':
          setReady(false);
          setProgressItems((prev) => [...prev, e.data]);
          break;
        case 'progress':
          setProgressItems((prev) =>
            prev.map((item) => {
              if (item.file === e.data.file) {
                return { ...item, progress: e.data.progress };
              }
              return item;
            })
          );
          break;
        case 'done':
          setProgressItems((prev) =>
            prev.filter((item) => item.file !== e.data.file)
          );
          break;
        case 'ready':
          setReady(true);
          break;
        case 'update':
          setOutput(e.data.output);
          break;
        case 'complete':
          setDisabled(false);
          break;

        default:
          break;
      }
    };

    worker.current.addEventListener('message', onMessageReceived);

    return () =>
      worker.current.removeEventListener('message', onMessageReceived);
  });

  const translate = () => {
    setDisabled(true);
    worker.current.postMessage({
      text: input,
      src_lang: sourceLanguage,
      tgt_lang: targetLanguage,
    });
  };

  return (
    <>
      <h1>Transformers.js</h1>
      <h2>ML-powered multilingual translation in React!</h2>

      <div className="container">
        <div className="language-container">
          <LanguageSelector
            type={'Source'}
            defaultLanguage={'eng_Latn'}
            onChange={(e) => setSourceLanguage(e.target.value)}
          />

          <LanguageSelector
            type={'Target'}
            defaultLanguage={'fra_Latn'}
            onChange={(e) => setSourceLanguage(e.target.value)}
          />
        </div>

        <div className="textbox-container">
          <textarea
            value={input}
            rows={3}
            onChange={(e) => setInput(e.target.value)}
          ></textarea>
          <textarea
            value={output}
            rows={3}
            onChange={(e) => setOutput(e.target.value)}
          ></textarea>
        </div>
      </div>

      <button disabled={disabled} onClick={translate}>
        Translate
      </button>

      <div className="progress-bars-container">
        {ready === false && <label>Loading models... (only run once)</label>}
        {progressItems.map((data) => (
          <div key={data.file}>
            <Progress text={data.file} percentage={data.progress} />
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
