/**
 * Command handler for the delete command
 */
class DeleteCommand {
  constructor(playerService, eventService) {
    this.playerService = playerService;
    this.eventService = eventService;
  }

  /**
   * Execute the delete command
   * @param {Object} data - Command data
   * @param {string} data.id - ID of the speech clip to delete
   * @returns {Promise<Object>} Result of the command
   */
  async execute(data) {
    try {
      // Validate input
      if (!data || !data.id) {
        throw new Error('Speech ID is required');
      }

      // Find the speech clip first to check if it exists
      const speechClip = await this.playerService.findById(data.id);
      if (!speechClip) {
        return { success: false, message: `Speech clip with ID ${data.id} not found` };
      }

      // Delete the speech clip
      const wasDeleted = await this.playerService.deleteById(data.id);
      
      if (wasDeleted) {
        return { 
          success: true, 
          message: 'Speech clip deleted successfully', 
          id: data.id 
        };
      } else {
        return { 
          success: false, 
          message: `Failed to delete speech clip with ID ${data.id}` 
        };
      }
    } catch (error) {
      await this.eventService.sendEvent('onError', { 
        error: error.message, 
        command: 'delete' 
      });
      throw error;
    }
  }
}

module.exports = DeleteCommand;