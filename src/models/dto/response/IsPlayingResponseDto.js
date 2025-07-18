/**
 * DTO for isPlaying query response
 */
class IsPlayingResponseDto {
  /**
   * @param {boolean} isPlaying - Whether audio is currently playing
   */
  constructor(isPlaying) {
    this.isPlaying = isPlaying;
  }

  /**
   * Create a response
   * @param {boolean} isPlaying - Whether audio is currently playing
   * @returns {IsPlayingResponseDto} The created DTO
   */
  static create(isPlaying) {
    return new IsPlayingResponseDto(isPlaying);
  }
}

module.exports = IsPlayingResponseDto;