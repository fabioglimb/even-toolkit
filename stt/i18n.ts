/** Language mapping utilities for STT providers */

/** BCP 47 → ISO 639-1 short code */
export function toShortLang(bcp47: string): string {
  return bcp47.split('-')[0].toLowerCase();
}

/** Short code → BCP 47 (best guess) */
export function toWebSpeechLang(lang: string): string {
  const map: Record<string, string> = {
    en: 'en-US', it: 'it-IT', es: 'es-ES', fr: 'fr-FR',
    de: 'de-DE', pt: 'pt-BR', zh: 'zh-CN', ja: 'ja-JP',
    ko: 'ko-KR', ru: 'ru-RU', ar: 'ar-SA', hi: 'hi-IN',
  };
  if (lang.includes('-')) return lang;
  return map[lang.toLowerCase()] ?? `${lang}-${lang.toUpperCase()}`;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  soniox: boolean;
  webSpeech: boolean;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en-US', name: 'English', soniox: true, webSpeech: true },
  { code: 'it-IT', name: 'Italian', soniox: true, webSpeech: true },
  { code: 'es-ES', name: 'Spanish', soniox: true, webSpeech: true },
  { code: 'fr-FR', name: 'French', soniox: true, webSpeech: true },
  { code: 'de-DE', name: 'German', soniox: true, webSpeech: true },
  { code: 'pt-BR', name: 'Portuguese', soniox: true, webSpeech: true },
  { code: 'zh-CN', name: 'Chinese', soniox: true, webSpeech: true },
  { code: 'ja-JP', name: 'Japanese', soniox: true, webSpeech: true },
  { code: 'ko-KR', name: 'Korean', soniox: true, webSpeech: true },
  { code: 'ru-RU', name: 'Russian', soniox: true, webSpeech: true },
  { code: 'ar-SA', name: 'Arabic', soniox: true, webSpeech: true },
  { code: 'hi-IN', name: 'Hindi', soniox: true, webSpeech: true },
];
