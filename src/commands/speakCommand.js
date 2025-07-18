const SpeakRequestDto = require('../models/dto/request/SpeakRequestDto');
const SpeakResponseDto = require('../models/dto/response/SpeakResponseDto');

class SpeakCommand {
  constructor(playerService, pollyService, eventService) {
    this.playerService = playerService;
    this.pollyService = pollyService;
    this.eventService = eventService;
  }

  async execute(requestBody) {
    try {
      const requestDto = SpeakRequestDto.fromRequestBody(requestBody);
      requestDto.validate();

      const { text, voice, pitch, block } = requestDto;

      const { audioBuffer, duration } = await this.pollyService.synthesizeSpeech(text, voice, pitch);

      const { id, wasIdle } = await this.playerService.enqueue(
        audioBuffer, 
        duration, 
        { text, voice, pitch }
      );

      if (wasIdle) {
        await this.eventService.sendEvent('onStart', { 
          id,
          text,
          voice,
          pitch
        });
      }

      if (block) {
        const playbackPromise = new Promise((resolve) => {
          this.playerService.registerCompletionCallback(id, resolve);
        });

        await playbackPromise;

        return SpeakResponseDto.success(id, duration, 'Text spoken and playback completed');
      }

      return SpeakResponseDto.success(id, duration);
    } catch (error) {
      await this.eventService.sendEvent('onError', { 
        error: error.message, 
        command: 'speak' 
      });

      return SpeakResponseDto.error(error.message);
    }
  }
}

module.exports = SpeakCommand;
