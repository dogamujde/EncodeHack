// public/audio-worklets/audio-processor.js
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const pcmData = new Int16Array(input[0].length);
      for (let i = 0; i < input[0].length; i++) {
        pcmData[i] = input[0][i] * 32767;
      }
      
      const base64 = this.toBase64(pcmData.buffer);
      this.port.postMessage({ audio_data: base64 });
    }
    return true;
  }

  toBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

registerProcessor('audio-processor', AudioProcessor); 