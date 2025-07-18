/**
 * Service for interacting with Amazon Polly
 */
class PollyService {
  constructor(config) {
    this.config = config;
    const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
    const getMp3Duration = require('get-mp3-duration');
    this.pollyClient = new PollyClient({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey
      }
    });
    this.SynthesizeSpeechCommand = SynthesizeSpeechCommand;
    this.getMp3Duration = getMp3Duration;
  }

  /**
   * Synthesize speech from text using Amazon Polly
   * @param {string} text - Text to synthesize
   * @param {string} [voice] - Voice ID to use (defaults to config value)
   * @param {number} [pitch] - Speech pitch (defaults to normal pitch)
   * @returns {Promise<{audioBuffer: Buffer, duration: number}>} Audio buffer and duration
   */
  async synthesizeSpeech(text, voice, pitch) {
    try {
      // Use provided voice or fall back to config or default
      const voiceId = voice || this.config.voiceId || 'Joanna';

      // Prepare the command parameters
      const params = {
        OutputFormat: 'mp3',
        VoiceId: voiceId
      };

      // If pitch is provided, use SSML to adjust pitch
      if (pitch) {
        params.TextType = 'ssml';
        params.Text = `<speak><prosody pitch="${pitch}%">${text}</prosody></speak>`;
      } else {
        params.TextType = 'text';
        params.Text = text;
      }

      // Create and send the command
      const command = new this.SynthesizeSpeechCommand(params);
      const response = await this.pollyClient.send(command);

      // Convert AudioStream to Buffer
      const chunks = [];
      for await (const chunk of response.AudioStream) {
        chunks.push(chunk);
      }
      const audioBuffer = Buffer.concat(chunks);

      // Get actual duration from MP3 buffer
      const durationInMs = this.getMp3Duration(audioBuffer);
      const duration = durationInMs / 1000; // Convert to seconds

      console.log(`Synthesizing speech: "${text}" with voice ${voiceId}${pitch ? ` and pitch ${pitch}` : ''}`);
      console.log(`Actual audio duration: ${duration.toFixed(2)} seconds`);

      return {
        audioBuffer: audioBuffer,
        duration: duration
      };
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      throw new Error(`Failed to synthesize speech: ${error.message}`);
    }
  }
}

module.exports = PollyService;
