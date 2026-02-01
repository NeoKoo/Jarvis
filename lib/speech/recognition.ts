/**
 * Speech Recognition using Web Speech API
 * Note: This API is browser-specific and works primarily in Chrome
 */

export type SpeechRecognitionEventCallback = (transcript: string, isFinal: boolean) => void;
export type SpeechRecognitionErrorCallback = (error: string) => void;

export class SpeechRecognitionManager {
  private recognition: any | null = null;
  private isListening: boolean = false;
  private onResultCallback: SpeechRecognitionEventCallback | null = null;
  private onErrorCallback: SpeechRecognitionErrorCallback | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Check for browser support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'zh-CN'; // Default to Chinese, can be changed

        this.recognition.onresult = (event: any) => {
          const lastResult = event.results[event.results.length - 1];
          const transcript = lastResult[0].transcript;
          const isFinal = lastResult.isFinal;

          if (this.onResultCallback) {
            this.onResultCallback(transcript, isFinal);
          }
        };

        this.recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);

          if (this.onErrorCallback) {
            this.onErrorCallback(event.error);
          }

          // Auto-restart on certain errors
          if (event.error === 'no-speech' || event.error === 'audio-capture') {
            if (this.isListening) {
              this.stop();
              this.start();
            }
          }
        };

        this.recognition.onend = () => {
          // Auto-restart if we're supposed to be listening
          if (this.isListening) {
            try {
              this.recognition.start();
            } catch (e) {
              console.error('Error restarting speech recognition:', e);
              this.isListening = false;
            }
          }
        };
      }
    }
  }

  /**
   * Check if speech recognition is supported
   */
  isSupported(): boolean {
    return this.recognition !== null;
  }

  /**
   * Start listening
   */
  start(): boolean {
    if (!this.recognition) {
      console.error('Speech recognition not supported');
      return false;
    }

    if (this.isListening) {
      return true;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      return false;
    }
  }

  /**
   * Stop listening
   */
  stop(): void {
    if (!this.recognition || !this.isListening) {
      return;
    }

    try {
      this.isListening = false;
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }

  /**
   * Set the language for recognition
   */
  setLanguage(lang: string): void {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  /**
   * Set callback for results
   */
  onResult(callback: SpeechRecognitionEventCallback): void {
    this.onResultCallback = callback;
  }

  /**
   * Set callback for errors
   */
  onError(callback: SpeechRecognitionErrorCallback): void {
    this.onErrorCallback = callback;
  }

  /**
   * Check if currently listening
   */
  isActive(): boolean {
    return this.isListening;
  }

  /**
   * Abort recognition immediately
   */
  abort(): void {
    if (!this.recognition) return;

    try {
      this.isListening = false;
      this.recognition.abort();
    } catch (error) {
      console.error('Error aborting speech recognition:', error);
    }
  }
}

// Export singleton instance
export const speechRecognition = new SpeechRecognitionManager();
