// The full list of languages in FLORES-200 is available here:
// https://github.com/facebookresearch/flores/blob/main/flores200/README.md#languages-in-flores-200

import { LANGUAGES } from '../constants';

export default function LanguageSelector({ type, onChange, defaultLanguage }) {
  return (
    <div className="language-selector">
      <label>{type}: </label>
      <select onChange={onChange} defaultValue={defaultLanguage}>
        {Object.entries(LANGUAGES).map(([key, value]) => {
          return (
            <option key={key} value={value}>
              {key}
            </option>
          );
        })}
      </select>
    </div>
  );
}
