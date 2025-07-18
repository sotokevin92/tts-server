/**
 * Command handler for the skip command
 */
class SkipCommand {
  constructor(playerService, eventService) {
    this.playerService = playerService;
    this.eventService = eventService;
  }

  /**
   * Execute the skip command
   * @returns {Promise<Object>} Result of the command
   */
  async execute() {
    try {
      // Skip the current playback and move to the next item in the queue
      const wasSkipped = await this.playerService.skip();
      
      if (wasSkipped) {
        return { success: true, message: 'Playback skipped' };
      } else {
        return { success: false, message: 'No active playback to skip' };
      }
    } catch (error) {
      await this.eventService.sendEvent('onError', { 
        error: error.message, 
        command: 'skip' 
      });
      throw error;
    }
  }
}

module.exports = SkipCommand;