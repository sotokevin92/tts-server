/**
 * Command handler for the pause command
 */
class PauseCommand {
  constructor(playerService, eventService) {
    this.playerService = playerService;
    this.eventService = eventService;
  }

  /**
   * Execute the pause command
   * @returns {Promise<Object>} Result of the command
   */
  async execute() {
    try {
      // Pause the current playback
      const wasPaused = await this.playerService.pause();
      
      if (wasPaused) {
        return { success: true, message: 'Playback paused' };
      } else {
        return { success: false, message: 'No active playback to pause' };
      }
    } catch (error) {
      await this.eventService.sendEvent('onError', { 
        error: error.message, 
        command: 'pause' 
      });
      throw error;
    }
  }
}

module.exports = PauseCommand;