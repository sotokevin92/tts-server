/**
 * Command handler for the resume command
 */
class ResumeCommand {
  constructor(playerService, eventService) {
    this.playerService = playerService;
    this.eventService = eventService;
  }

  /**
   * Execute the resume command
   * @returns {Promise<Object>} Result of the command
   */
  async execute() {
    try {
      // Resume the current playback
      const wasResumed = await this.playerService.resume();
      
      if (wasResumed) {
        return { success: true, message: 'Playback resumed' };
      } else {
        return { success: false, message: 'No paused playback to resume' };
      }
    } catch (error) {
      await this.eventService.sendEvent('onError', { 
        error: error.message, 
        command: 'resume' 
      });
      throw error;
    }
  }
}

module.exports = ResumeCommand;