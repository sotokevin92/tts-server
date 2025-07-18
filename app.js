const express = require('express');
const fs = require('fs');
const path = require('path');

const SpeakCommand = require('./src/commands/speakCommand');
const PauseCommand = require('./src/commands/pauseCommand');
const ResumeCommand = require('./src/commands/resumeCommand');
const SkipCommand = require('./src/commands/skipCommand');
const ClearCommand = require('./src/commands/clearCommand');
const DeleteCommand = require('./src/commands/deleteCommand');

const IsPlayingQuery = require('./src/queries/isPlayingQuery');

const PlayerService = require('./src/services/playerService');
const PollyService = require('./src/services/pollyService');
const EventService = require('./src/services/eventService');

let config;
try {
  const configPath = path.join(__dirname, 'config.json');
  const configData = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configData);
  console.log('Configuration loaded successfully');
} catch (error) {
  console.error('Error loading configuration:', error);
  config = {
    aws: { region: 'us-east-1' },
    voiceId: 'Joanna',
    port: 3000,
    maxQueueSize: 50,
    eventHooks: {},
    audioPlayer: {
      // Optional - system will use default player if not specified
      path: null,
      args: null
    }
  };
  console.log('Using default configuration');
}

try {
  const playerService = new PlayerService(config);
  const pollyService = new PollyService(config);
  const eventService = new EventService(config);

  const speakCommand = new SpeakCommand(playerService, pollyService, eventService);
  const pauseCommand = new PauseCommand(playerService, eventService);
  const resumeCommand = new ResumeCommand(playerService, eventService);
  const skipCommand = new SkipCommand(playerService, eventService);
  const clearCommand = new ClearCommand(playerService, eventService);
  const deleteCommand = new DeleteCommand(playerService, eventService);

  const isPlayingQuery = new IsPlayingQuery(playerService);

  const app = express();
  app.use(express.json());

  app.post('/speak', async (req, res) => {
    try {
      const result = await speakCommand.execute(req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/pause', async (req, res) => {
    try {
      const result = await pauseCommand.execute();
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/resume', async (req, res) => {
    try {
      const result = await resumeCommand.execute();
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/skip', async (req, res) => {
    try {
      const result = await skipCommand.execute();
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/clear', async (req, res) => {
    try {
      const result = await clearCommand.execute();
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/delete', async (req, res) => {
    try {
      const result = await deleteCommand.execute(req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/isPlaying', async (req, res) => {
    try {
      const result = await isPlayingQuery.execute();
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  const port = config.port || 3000;
  app.listen(port, () => {
    console.log(`TTS Server listening on port ${port}`);
    console.log(`API endpoints:`);
    console.log(`  POST /speak - Enqueue and speak text (optional 'block' parameter to wait for playback completion)`);
    console.log(`  POST /pause - Pause current playback`);
    console.log(`  POST /resume - Resume paused playback`);
    console.log(`  POST /skip - Skip current playback`);
    console.log(`  POST /clear - Clear queue and stop playback`);
    console.log(`  POST /delete - Delete a speech clip from the queue`);
    console.log(`  GET /isPlaying - Check if audio is playing`);
  });
} catch (error) {
  console.error('Failed to initialize server:', error.message);
  console.error('The audio module is mandatory. Please ensure it is installed correctly.');
  process.exit(1);
}
