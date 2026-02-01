/**
 * Speech Synthesis using Web Speech API
 */

export interface SpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
}

export class SpeechSynthesisManager {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;

      // Load voices
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          this.voices = this.synth?.getVoices() || [];
        };
      }

      // Initial load
      this.voices = this.synth?.getVoices() || [];
    }
  }

  /**
   * Check if speech synthesis is supported
   */
  isSupported(): boolean {
    return this.synth !== null;
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  /**
   * Get Chinese voices
   */
  getChineseVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => voice.lang.startsWith('zh'));
  }

  /**
   * Get English voices
   */
  getEnglishVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => voice.lang.startsWith('en'));
  }

  /**
   * Speak text
   */
  speak(text: string, options: SpeechOptions = {}): boolean {
    if (!this.synth) {
      console.error('Speech synthesis not supported');
      return false;
    }

    // Cancel any current speech
    this.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Apply options
    utterance.lang = options.lang || 'zh-CN';
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    if (options.voice) {
      utterance.voice = options.voice;
    } else {
      // Try to find a Chinese voice by default
      const chineseVoices = this.getChineseVoices();
      if (chineseVoices.length > 0) {
        utterance.voice = chineseVoices[0];
      }
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      this.isSpeaking = false;
      this.currentUtterance = null;
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);

    return true;
  }

  /**
   * Pause speaking
   */
  pause(): void {
    if (this.synth && this.isSpeaking) {
      this.synth.pause();
    }
  }

  /**
   * Resume speaking
   */
  resume(): void {
    if (this.synth) {
      this.synth.resume();
    }
  }

  /**
   * Cancel speaking
   */
  cancel(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  /**
   * Check if currently speaking
   */
  isActive(): boolean {
    return this.isSpeaking;
  }

  /**
   * Check if paused
   */
  isPaused(): boolean {
    return this.synth ? this.synth.paused : false;
  }
}

// Export singleton instance
export const speechSynthesis = new SpeechSynthesisManager();
