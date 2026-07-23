import { useState, useCallback } from 'react';

// Simple language state hook - no context needed
let globalLang = localStorage.getItem('nyaya_lang') || 'en';
let listeners = [];

export function useLanguage() {
  const [lang, setLangState] = useState(globalLang);

  const setLang = useCallback((newLang) => {
    globalLang = newLang;
    localStorage.setItem('nyaya_lang', newLang);
    setLangState(newLang);
    listeners.forEach(fn => fn(newLang));
  }, []);

  return { lang, setLang };
}