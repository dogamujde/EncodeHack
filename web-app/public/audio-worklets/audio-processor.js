// public/audio-worklets/audio-processor.js

class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0]; // Using the first channel for mono
      if (channelData) {
        // Post the raw Float32Array data's buffer.
        // The buffer is transferred, not copied, for performance.
        this.port.postMessage(channelData.buffer, [channelData.buffer]);
      }
    }
    return true; // Keep processor alive
  }
}

registerProcessor('audio-processor', AudioProcessor); 