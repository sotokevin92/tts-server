/**
 * Command handler for the clear command
 */
class ClearCommand {
  constructor(playerService, eventService) {
    this.playerService = playerService;
    this.eventService = eventService;
  }

  /**
   * Execute the clear command
   * @returns {Promise<Object>} Result of the command
   */
  async execute() {
    try {
      // Clear the queue and stop current playback
      await this.playerService.clear();
      
      return { success: true, message: 'Queue cleared and playback stopped' };
    } catch (error) {
      await this.eventService.sendEvent('onError', { 
        error: error.message, 
        command: 'clear' 
      });
      throw error;
    }
  }
}

module.exports = ClearCommand;