/**
 * Model representing a speech clip in the queue
 */
class SpeechClip {
  /**
   * @param {string} id - Unique ID of the speech clip
   * @param {Buffer} audioBuffer - Audio buffer containing the speech
   * @param {number} duration - Duration of the speech clip in seconds
   * @param {Object} metadata - Additional metadata about the speech clip
   * @param {string} metadata.text - Original text of the speech
   * @param {string} metadata.voice - Voice ID used for synthesis
   * @param {number} metadata.pitch - Pitch used for synthesis
   */
  constructor(id, audioBuffer, duration, metadata) {
    this.id = id;
    this.audioBuffer = audioBuffer;
    this.duration = duration;
    this.metadata = metadata || {};
  }
}

module.exports = SpeechClip;