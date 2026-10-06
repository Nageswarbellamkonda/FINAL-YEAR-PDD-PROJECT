import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

let isSpeakingActive = false;
let currentUtterance = null;

/**
 * Universal Text-to-Speech Engine for NyayaMitra
 * Seamlessly supports Native Android (Google TTS engine) and Web (SpeechSynthesis)
 */
export async function speakSpeech(text, { lang = 'en', rate = 0.95, pitch = 1.0, onStart, onEnd, onError } = {}) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    if (onEnd) onEnd();
    return { success: false, reason: 'empty_text' };
  }

  // Sanitize text: remove [FIR_READY] metadata, markdown asterisks, hashes
  const cleanText = text
    .split('[FIR_READY]')[0]
    .replace(/[*#_`]/g, '')
    .trim();

  if (!cleanText) {
    if (onEnd) onEnd();
    return { success: false, reason: 'empty_clean_text' };
  }

  // Stop previous speech to prevent overlapping voices
  await stopSpeech();

  isSpeakingActive = true;
  if (onStart) {
    try { onStart(); } catch (e) { console.warn('[TTS] onStart callback error:', e); }
  }

  const isNative = Capacitor.isNativePlatform();
  const targetLang = lang === 'te' ? 'te-IN' : 'en-IN';

  // 1. Try Native Android TTS first if running on native device
  if (isNative) {
    try {
      console.log(`[TTS] Speaking via Native Android TTS in ${targetLang}...`);
      await TextToSpeech.speak({
        text: cleanText,
        lang: targetLang,
        rate: rate,
        pitch: pitch,
        volume: 1.0,
        category: 'ambient',
      });
      isSpeakingActive = false;
      if (onEnd) onEnd();
      return { success: true, engine: 'native' };
    } catch (nativeErr) {
      console.warn('[TTS] Native TTS failed, attempting browser SpeechSynthesis fallback:', nativeErr);
      // Fall through to browser fallback below
    }
  }

  // 2. Browser SpeechSynthesis fallback (for Web preview or if native speech encountered error)
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return new Promise((resolve) => {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = targetLang;
        utterance.rate = rate;
        utterance.pitch = pitch;

        // Try selecting an appropriate voice if available
        const voices = window.speechSynthesis.getVoices() || [];
        if (voices.length > 0) {
          const matchedVoice = lang === 'te'
            ? voices.find(v => v.lang?.toLowerCase().includes('te')) || voices.find(v => v.lang?.toLowerCase().includes('hi')) || voices[0]
            : voices.find(v => v.lang?.toLowerCase().includes('en-in')) || voices.find(v => v.name?.toLowerCase().includes('female')) || voices[0];
          if (matchedVoice) utterance.voice = matchedVoice;
        }

        utterance.onend = () => {
          isSpeakingActive = false;
          currentUtterance = null;
          if (onEnd) onEnd();
          resolve({ success: true, engine: 'browser' });
        };

        utterance.onerror = (err) => {
          console.warn('[TTS] Browser SpeechSynthesis error:', err);
          isSpeakingActive = false;
          currentUtterance = null;
          if (onError) onError(err);
          resolve({ success: false, error: err, engine: 'browser' });
        };

        currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (synthErr) {
        console.warn('[TTS] SpeechSynthesis initialization error:', synthErr);
        isSpeakingActive = false;
        currentUtterance = null;
        if (onError) onError(synthErr);
        resolve({ success: false, error: synthErr });
      }
    });
  }

  // Neither native nor browser synthesis is available
  isSpeakingActive = false;
  if (onError) onError(new Error('TTS not supported on this platform'));
  return { success: false, reason: 'unsupported' };
}

/**
 * Immediately cancels and halts any active speech output
 */
export async function stopSpeech() {
  isSpeakingActive = false;
  currentUtterance = null;

  // Stop native TTS
  if (Capacitor.isNativePlatform()) {
    try {
      await TextToSpeech.stop();
    } catch (e) {
      console.warn('[TTS] Native stop error:', e);
    }
  }

  // Stop browser speech synthesis
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('[TTS] Browser cancel error:', e);
    }
  }
}

/**
 * Returns whether speech output is currently active
 */
export function isSpeaking() {
  return isSpeakingActive;
}
