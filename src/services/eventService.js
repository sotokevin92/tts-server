/**
 * Service for sending event hooks to external endpoints
 */
class EventService {
  constructor(config) {
    this.config = config;
    // In a real implementation, this would initialize the HTTP client
    // this.axios = require('axios');
  }

  /**
   * Send an event to the configured webhook
   * @param {string} eventType - Type of event (onStart, onEnd, onError)
   * @param {Object} data - Event data
   * @returns {Promise<void>}
   */
  async sendEvent(eventType, data) {
    try {
      const hookUrl = this.config.eventHooks?.[eventType];
      
      if (!hookUrl) {
        console.log(`No webhook configured for event type: ${eventType}`);
        return;
      }
      
      console.log(`Sending ${eventType} event to ${hookUrl}:`, data);
      
      // In a real implementation, this would send an HTTP request to the webhook
      // await this.axios.post(hookUrl, {
      //   event: eventType,
      //   timestamp: new Date().toISOString(),
      //   data
      // });
    } catch (error) {
      console.error(`Error sending ${eventType} event:`, error);
      // We don't throw here to avoid cascading failures
    }
  }
}

module.exports = EventService;