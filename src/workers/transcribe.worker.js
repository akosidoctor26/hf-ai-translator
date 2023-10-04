import { pipeline } from '@xenova/transformers';
import { MessageTypes } from '../constants';

class TranscribePipeline {
  static task = 'automatic-speech-recognition';
  static model = 'openai/whisper-tiny.en';
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (!this.instance) {
      this.instance = pipeline(this.task, null, { progress_callback });
    }

    return this.instance;
  }
}

self.addEventListener('message', async (event) => {
  const { audio } = event.data;

  const finalResult = await transcribe(audio);

  self.postMessage({
    type: MessageTypes.RESULT,
    result: finalResult,
  });
});

async function transcribe(audio) {
  // send loading message

  let pipeline = null;
  try {
    pipeline = await TranscribePipeline.getInstance();
  } catch (error) {
    console.log(error.message);
  }

  // send loading message

  return await pipeline(audio, {
    top_k: 0,
    do_sample: false,
    chunk_length: 30,
    stride_length_s: 5,
    return_timestamps: true,
    // callback_function: (beams) => {
    //   const tokenIds = beams[0].output_token_ids;
    //   const result = pipeline.tokenizer.decode(tokenIds, {
    //     skip_special_token: true,
    //   });

    //   console.log('callback_function', result);
    // },
  });
}
