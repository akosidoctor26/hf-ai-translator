import { pipeline } from '@xenova/transformers';

/**
 * ---
 * pipeline is a factory that returns a specific type of Pipeline based on the task.
 * Checkout https://huggingface.co/docs/transformers/main_classes/pipelines to view all the Pipelines.
 * Documentation isn't that detailed, so read code directly https://github.com/xenova/transformers.js/blob/main/src/pipelines.js
 * Base Pipeline class has props: .task, .tokenizer, .processor, .model
 * ---
 * The API will initialize and load several files first before they execute the actual task.
 * The flow of events is like this:
 * 1. initialize
 * 2. progress
 * 3. done
 * 4. ready
 * 5. update
 * 6. complete
 *
 * Pipeline:
 * Event 1-3 is executed per file, so expect to see a lot of 1-2-3 events per file.
 * When all the files are loaded, progress prop is also 100, then next status is 4.
 * Events 1-4 happens in progress_callback, that's why you don't see it being returned anywhere here in the app. It's coming from the pipeline.
 *
 * Translation:
 * Once the pipeline is ready, then it will begin translation.
 * The optional callback_function is called to give partial data of the translated output.
 * The final return is a promise response
 *
 *
 */

class MyTranslationPipeline {
  static task = 'translation';
  static model = 'Xenova/nllb-200-distilled-600M';
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (!this.instance) {
      this.instance = pipeline(this.task, this.model, { progress_callback });
    }

    return this.instance;
  }
}

self.addEventListener('message', async (event) => {
  const { tgt_lang, src_lang, text } = event.data;
  let translator = await MyTranslationPipeline.getInstance((x) => {
    // this returns the pipeline based on the task given
    self.postMessage(x);
  });

  let output = await translator(text, {
    src_lang,
    tgt_lang,
    callback_function: (x) => {
      self.postMessage({
        status: 'update',
        // output after decode is a string
        output: translator.tokenizer.decode(x[0].output_token_ids, {
          // response are token ids that has to be decoded to strings using tokenizer
          skip_special_tokens: true,
        }),
      });
    },
  });

  console.log('output', output);
  self.postMessage({ status: 'complete', output });
});
