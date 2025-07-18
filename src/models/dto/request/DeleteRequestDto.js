/**
 * DTO for delete command request
 */
class DeleteRequestDto {
  /**
   * @param {string} id - ID of the speech clip to delete
   */
  constructor(id) {
    this.id = id;
  }

  /**
   * Validate the DTO
   * @throws {Error} If validation fails
   */
  validate() {
    if (!this.id) {
      throw new Error('Speech ID is required');
    }
  }

  /**
   * Create a DTO from request body
   * @param {Object} body - Request body
   * @returns {DeleteRequestDto} The created DTO
   */
  static fromRequestBody(body) {
    return new DeleteRequestDto(body.id);
  }
}

module.exports = DeleteRequestDto;