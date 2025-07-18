/**
 * DTO for speak command request
 */
class SpeakRequestDto {
  /**
   * @param {string} text - Text to speak
   * @param {string} [voice] - Voice ID to use (defaults to config value)
   * @param {number} [pitch] - Speech pitch (defaults to normal pitch)
   * @param {boolean} [block] - Whether to block until playback is complete
   */
  constructor(text, voice, pitch, block) {
    this.text = text;
    this.voice = voice;
    this.pitch = pitch;
    this.block = !!block; // Convert to boolean
  }

  /**
   * Validate the DTO
   * @throws {Error} If validation fails
   */
  validate() {
    if (!this.text) {
      throw new Error('Text is required');
    }
  }

  /**
   * Create a DTO from request body
   * @param {Object} body - Request body
   * @returns {SpeakRequestDto} The created DTO
   */
  static fromRequestBody(body) {
    return new SpeakRequestDto(
      body.text,
      body.voice,
      body.pitch,
      body.block
    );
  }
}

module.exports = SpeakRequestDto;
