const { v4: uuidv4 } = require('uuid');
const SpeechClip = require('../models/SpeechClip');

let player;
try {
  // Initialize with player options
  const playerOptions = {};

  // Check if specific player is configured
  if (config.audioPlayer) {
    // Use specific player path if provided
    playerOptions.player = config.audioPlayer.path;
    console.log(`Using custom audio player: ${config.audioPlayer.path}`);
  }

  player = require('play-sound')(playerOptions);
  console.log('Audio playback module loaded successfully');
} catch (error) {
  console.error('Audio playback module not available. This module is required for the server to function:', error.message);
  throw new Error('Audio playback module not available. This module is required for the server to function.');
}

class PlayerService {
  constructor(config) {
    this.config = config;
    this.queue = [];
    this.currentlyPlaying = null;
    this.isPaused = false;
    this.maxQueueSize = config.maxQueueSize || 50;
    this.audioProcess = null;
    this.fs = require('fs');
    this.path = require('path');
    this.os = require('os');
    this.completionCallbacks = new Map();

    this.tempDir = this.path.join(this.os.tmpdir(), 'tts-server');
    try {
      if (!this.fs.existsSync(this.tempDir)) {
        this.fs.mkdirSync(this.tempDir, { recursive: true });
      }
    } catch (error) {
      console.warn('Could not create temp directory:', error.message);
    }
  }

  async enqueue(audioBuffer, duration, metadata) {
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error(`Queue is full (max size: ${this.maxQueueSize})`);
    }

    const id = uuidv4();
    const speechClip = new SpeechClip(id, audioBuffer, duration, metadata);

    this.queue.push(speechClip);

    const wasIdle = !this.currentlyPlaying && !this.isPaused;
    if (wasIdle) {
      this._startPlayback();
    }

    return { id, wasIdle };
  }

  registerCompletionCallback(id, callback) {
    if (typeof callback === 'function') {
      this.completionCallbacks.set(id, callback);
    }
  }

  async deleteById(id) {
    if (this.currentlyPlaying && this.currentlyPlaying.id === id) {
      console.log(`Deleting currently playing clip: ${id}, isPaused: ${this.isPaused}`);
      return await this.skip(this.isPaused);
    }

    const initialLength = this.queue.length;
    this.queue = this.queue.filter(clip => clip.id !== id);

    const callback = this.completionCallbacks.get(id);
    if (callback) {
      this.completionCallbacks.delete(id);
      callback();
    }

    return initialLength > this.queue.length;
  }

  async findById(id) {
    if (this.currentlyPlaying && this.currentlyPlaying.id === id) {
      return this.currentlyPlaying;
    }

    return this.queue.find(clip => clip.id === id) || null;
  }

  async pause() {
    if (!this.currentlyPlaying) {
      console.log('Pause failed: No current clip playing');
      return false;
    }

    if (this.isPaused) {
      console.log('Pause failed: Playback is already paused');
      return false;
    }

    const clipBeingPaused = this.currentlyPlaying;
    console.log(`Pausing playback of clip ${clipBeingPaused.id}`);

    this.isPaused = true;

    // Note: play-sound doesn't have a native pause method
    // We'll need to stop the current playback and remember the clip
    if (this.audioProcess) {
      try {
        this.audioProcess.kill();
        this.audioProcess = null;
        console.log('Audio process terminated for pause');
      } catch (error) {
        console.error('Error pausing playback:', error);
        // Even if killing the process fails, we still consider it paused
        // since the isPaused flag is set
      }
    } else {
      console.log('No audio process to terminate, but marked as paused');
    }

    // This is crucial for resume to work properly
    this.currentlyPlaying = clipBeingPaused;

    return true;
  }

  // Note: Due to play-sound limitations, this will restart the audio from the beginning
  // rather than continuing from the pause point
  async resume() {
    if (!this.currentlyPlaying) {
      console.log('Resume failed: No current clip to resume');
      return false;
    }

    if (!this.isPaused) {
      console.log('Resume failed: Playback is not paused');
      return false;
    }

    const clipToResume = this.currentlyPlaying;
    console.log(`Resuming playback of clip ${clipToResume.id} (will restart from beginning)`);

    this.isPaused = false;

    // Note: play-sound doesn't have a native resume method
    // We'll restart playback from the beginning of the current clip
    if (player && clipToResume) {
      try {
        const filename = `${clipToResume.id}.mp3`;
        const filepath = this.path.join(this.tempDir, filename);

        if (!this.fs.existsSync(filepath)) {
          this.fs.writeFileSync(filepath, clipToResume.audioBuffer);
        }

        console.log(`Resuming playback from beginning: ${filepath}`);
        this.audioProcess = player.play(filepath, (err) => {
          if (err) {
            console.error('Error playing audio:', err);
          }

          try {
            this.fs.unlinkSync(filepath);
          } catch (unlinkErr) {
            console.error('Error removing temporary file:', unlinkErr);
          }

          const callback = this.completionCallbacks.get(clipToResume.id);
          if (callback) {
            this.completionCallbacks.delete(clipToResume.id);
            callback();
          }

          this.audioProcess = null;

          // This ensures that currentlyPlaying is maintained when paused
          if (!this.isPaused) {
            this.currentlyPlaying = null;

            if (this.queue.length > 0) {
              this._startPlayback();
            }
          }
        });
      } catch (error) {
        console.error('Error resuming playback:', error);
        return false;
      }
    }

    return true;
  }

  async skip(maintainPausedState = false) {
    if (this.currentlyPlaying) {
      const currentId = this.currentlyPlaying.id;
      console.log(`Skipping clip: ${currentId}, isPaused: ${this.isPaused}, maintainPausedState: ${maintainPausedState}`);

      const wasPaused = maintainPausedState && this.isPaused;

      if (this.audioProcess) {
        try {
          this.audioProcess.kill();
          this.audioProcess = null;
        } catch (error) {
          console.error('Error stopping playback:', error);
        }
      }

      const callback = this.completionCallbacks.get(currentId);
      if (callback) {
        this.completionCallbacks.delete(currentId);
        callback();
      }

      this.isPaused = false;

      this._playNext();

      if (wasPaused && this.currentlyPlaying) {
        this.isPaused = true;
        console.log(`Maintained paused state for next clip: ${this.currentlyPlaying.id}`);
      }

      return true;
    }
    return false;
  }

  async clear() {
    const ids = this.queue.map(clip => clip.id);
    if (this.currentlyPlaying) {
      ids.push(this.currentlyPlaying.id);
    }

    this.queue = [];

    if (this.audioProcess) {
      try {
        this.audioProcess.kill();
      } catch (error) {
        console.error('Error stopping playback:', error);
      } finally {
        this.audioProcess = null;
      }
    }

    this._cleanupTempFiles();

    this.currentlyPlaying = null;
    this.isPaused = false;

    for (const id of ids) {
      const callback = this.completionCallbacks.get(id);
      if (callback) {
        this.completionCallbacks.delete(id);
        callback();
      }
    }
  }

  _cleanupTempFiles() {
    try {
      const files = this.fs.readdirSync(this.tempDir);

      for (const file of files) {
        if (file.endsWith('.mp3')) {
          const filePath = this.path.join(this.tempDir, file);
          this.fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }

  async isPlaying() {
    const playing = !!this.currentlyPlaying && !this.isPaused;
    if (this.currentlyPlaying) {
      console.log(`isPlaying check: clipId=${this.currentlyPlaying.id}, isPaused=${this.isPaused}, isPlaying=${playing}`);
    }
    return playing;
  }

  _startPlayback() {
    if (this.queue.length > 0) {
      this.currentlyPlaying = this.queue.shift();
      this.isPaused = false;

      try {
        console.log('Starting audio playback');

        const filename = `${this.currentlyPlaying.id}.mp3`;
        const filepath = this.path.join(this.tempDir, filename);

        this.fs.writeFileSync(filepath, this.currentlyPlaying.audioBuffer);

        console.log(`Playing audio file: ${filepath}`);

        // Prepare player options
        const playOptions = {};

        // Add any player-specific arguments if configured
        if (this.config.audioPlayer && this.config.audioPlayer.args) {
          // Add player-specific command line arguments
          const playerName = this.config.audioPlayer.path.split('/').pop().split('\\').pop();
          playOptions[playerName] = this.config.audioPlayer.args;
          console.log(`Using custom arguments for ${playerName}:`, this.config.audioPlayer.args);
        }

        this.audioProcess = player.play(filepath, playOptions, (err) => {
          if (err) {
            console.error('Error playing audio:', err);
          }

          try {
            this.fs.unlinkSync(filepath);
          } catch (unlinkErr) {
            console.error('Error removing temporary file:', unlinkErr);
          }

          this._onPlaybackComplete();
        });
      } catch (error) {
        console.error('Error starting playback:', error);
        this._onPlaybackComplete();
      }
    } else {
      this.currentlyPlaying = null;
    }
  }

  _onPlaybackComplete() {
    if (this.audioProcess) {
      this.audioProcess = null;
    }

    if (this.currentlyPlaying) {
      const callback = this.completionCallbacks.get(this.currentlyPlaying.id);
      if (callback) {
        this.completionCallbacks.delete(this.currentlyPlaying.id);
        callback();
      }
    }

    this._playNext();
  }

  _playNext() {
    // This ensures that currentlyPlaying is maintained when paused
    if (!this.isPaused) {
      this.currentlyPlaying = null;

      if (this.queue.length > 0) {
        this._startPlayback();
      }
    }
  }
}

module.exports = PlayerService;
