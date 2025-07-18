class IsPlayingQuery {
  constructor(playerService) {
    this.playerService = playerService;
  }

  async execute() {
    try {
      const isPlaying = await this.playerService.isPlaying();
      const currentlyPlayingId = this.playerService.currentlyPlaying ? 
        this.playerService.currentlyPlaying.id : null;
      const isPaused = this.playerService.isPaused;

      console.log(`Status check: isPlaying=${isPlaying}, currentlyPlayingId=${currentlyPlayingId || 'null'}, isPaused=${isPaused}`);

      return { 
        isPlaying,
        currentlyPlayingId,
        isPaused
      };
    } catch (error) {
      console.error('Error in isPlayingQuery:', error);
      throw error;
    }
  }
}

module.exports = IsPlayingQuery;
