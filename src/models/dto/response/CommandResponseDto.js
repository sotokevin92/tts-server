/**
 * Generic DTO for command responses
 */
class CommandResponseDto {
  /**
   * @param {boolean} success - Whether the operation was successful
   * @param {string} message - Response message
   */
  constructor(success, message) {
    this.success = success;
    this.message = message;
  }

  /**
   * Create a success response
   * @param {string} message - Success message
   * @returns {CommandResponseDto} The created DTO
   */
  static success(message) {
    return new CommandResponseDto(true, message);
  }

  /**
   * Create an error response
   * @param {string} message - Error message
   * @returns {CommandResponseDto} The created DTO
   */
  static error(message) {
    return new CommandResponseDto(false, message);
  }
}

module.exports = CommandResponseDto;