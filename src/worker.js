import { pipeline } from '@xenova/transformers';

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
    self.postMessage(x);
  });

  let output = await translator(text, {
    src_lang,
    tgt_lang,
    callback_function: (x) => {
      self.postMessage({
        status: 'update',
        output: translator.tokenizer.decode(x[0].output_token_ids, {
          skip_special_tokens: true,
        }),
      });
    },
  });

  self.postMessage({ status: 'complete', output });
});
