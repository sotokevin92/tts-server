/**
 * DTO for speak command response
 */
class SpeakResponseDto {
  /**
   * @param {string} id - Unique ID of the speech clip
   * @param {number} duration - Duration of the speech clip in seconds
   * @param {boolean} success - Whether the operation was successful
   * @param {string} [message] - Optional message
   */
  constructor(id, duration, success, message) {
    this.id = id;
    this.duration = duration;
    this.success = success;
    this.message = message;
  }

  /**
   * Create a success response
   * @param {string} id - Unique ID of the speech clip
   * @param {number} duration - Duration of the speech clip in seconds
   * @param {string} [message] - Optional message
   * @returns {SpeakResponseDto} The created DTO
   */
  static success(id, duration, message = 'Text added to queue') {
    return new SpeakResponseDto(id, duration, true, message);
  }

  /**
   * Create an error response
   * @param {string} message - Error message
   * @returns {SpeakResponseDto} The created DTO
   */
  static error(message) {
    return new SpeakResponseDto(null, null, false, message);
  }
}

module.exports = SpeakResponseDto;