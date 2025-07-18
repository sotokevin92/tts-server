/**
 * DTO for delete command response
 */
class DeleteResponseDto {
  /**
   * @param {boolean} success - Whether the operation was successful
   * @param {string} message - Response message
   * @param {string} [id] - ID of the deleted speech clip
   */
  constructor(success, message, id) {
    this.success = success;
    this.message = message;
    this.id = id;
  }

  /**
   * Create a success response
   * @param {string} id - ID of the deleted speech clip
   * @param {string} [message] - Optional message
   * @returns {DeleteResponseDto} The created DTO
   */
  static success(id, message = 'Speech clip deleted successfully') {
    return new DeleteResponseDto(true, message, id);
  }

  /**
   * Create an error response
   * @param {string} message - Error message
   * @returns {DeleteResponseDto} The created DTO
   */
  static error(message) {
    return new DeleteResponseDto(false, message);
  }

  /**
   * Create a not found response
   * @param {string} id - ID that was not found
   * @returns {DeleteResponseDto} The created DTO
   */
  static notFound(id) {
    return new DeleteResponseDto(false, `Speech clip with ID ${id} not found`);
  }
}

module.exports = DeleteResponseDto;