# TTS Server

A standalone application/server that provides a local HTTP API for controlling speech synthesis via Amazon Polly.

The idea behind this project is to provide something similar to Speaker.bot, but without direct integration to streaming platforms.

I wanted to focus on the undocumented bits that supercharge Streamer.bot (ie: wait until playback finishes, provide duration, etc).

## Features

- Local HTTP API
- Playback queue
- Event hooks via HTTP

## Requirements

- Node.js 18 or later
- AWS IAM credentials for Amazon Polly

## Installation

```bash
npm install
```

Edit `config.json`:

```json
{
  "aws": {
    "accessKeyId": "YOUR_ACCESS_KEY",
    "secretAccessKey": "YOUR_SECRET_KEY",
    "region": "AWS_REGION"
  },
  "voiceId": "Joanna",
  "port": 3000,
  "maxQueueSize": 50,
  "eventHooks": {
    "onStart": "http://localhost:4000/hook/start",
    "onEnd": "http://localhost:4000/hook/end",
    "onError": "http://localhost:4000/hook/error"
  }
}
```

## Running the Application

Start the server:

```bash
npm start
```

The server will start on the configured port (default: 3000).

## API Endpoints

| Method | Endpoint   | Description                                     |
| ------ | ---------- |-------------------------------------------------|
| POST   | /speak     | `{ "text": "Hello!" }` → Cue and speak          |
| POST   | /pause     | Pause current playback                          |
| POST   | /resume    | Resume paused playback                          |
| POST   | /skip      | Skip current playback and move to next in queue |
| POST   | /clear     | Clear queue and stop playback                   |
| POST   | /delete    | `{ "id": "uuid" }` → Delete a speech clip       |
| GET    | /isPlaying | Returns `{ "playing": true/false }`             |

### Waiting for Playback Completion

There are two ways to wait for playback to complete:

1. **Server-side blocking**: Add `"block": true` to the `/speak` request. The server will hold the response until playback is complete.

```json
{
  "text": "Hello world",
  "block": true
}
```

2. **Client-side polling**: Queue the speech and poll the `/isPlaying` endpoint until playback is complete.

```javascript
// Queue the speech
await axios.post('/speak', { text: 'Hello world' });

// Poll until playback is complete
let isPlaying = true;
while (isPlaying) {
  const response = await axios.get('/isPlaying');
  isPlaying = response.data.playing;
  if (isPlaying) {
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait 0.5 seconds
  }
}
console.log('Playback completed!');
```

See the test scripts in the `tests` directory for complete examples.

## Test Scripts

The project includes test scripts to demonstrate how to use the API:

```bash
# Test basic speech synthesis and API endpoints
npm run test:speak

# Test client-side polling to wait for playback completion
npm run test:polling
```

The `test:polling` script demonstrates how to queue a file for playback and poll the `/isPlaying` endpoint every 0.5 seconds to wait for playback to end. This is useful when you need more control over the waiting process than the server-side blocking approach provides.

## Building for Windows

To build a standalone Windows executable:

```bash
npm run build
```

This will create `ttsbot.exe` in the project directory.

## Architecture

This project attempts to exemplify the use of the Command Query Responsibility Segregation (CQRS) pattern:

- **Commands**: Change state (speak, pause, resume, skip, clear)
- **Queries**: Read state (isPlaying)
- **Services**: Provide core functionality (player, Polly, event hooks)

## Project Structure

```
/tts-server
  |- app.js                    # Main server
  |- config.json               # Configuration
  |- src/
      |- commands/             # Command handlers
          |- speakCommand.js
          |- pauseCommand.js
          |- resumeCommand.js
          |- skipCommand.js
          |- clearCommand.js
      |- queries/              # Query handlers
          |- isPlayingQuery.js
      |- services/             # Services
          |- playerService.js  # Playback & queue manager
          |- pollyService.js   # AWS Polly integration
          |- eventService.js   # Event hooks
```

## Audio Playback

This application uses the `play-sound` library for audio playback, which:

- Is compatible with Node.js 18 on Windows
- Works well when packaged with pkg as a standalone executable
- Uses external system audio players (Windows Media Player on Windows)
- Handles MP3 files directly without requiring native compilation

The audio playback process:
1. Saves audio buffers from Amazon Polly as MP3 files (temporary)
2. Plays the files using the system's audio player
3. Deletes the temporary files once played.

Note: pause and resume functionality is implemented by stopping and restarting playback, which means resuming will start from the beginning of the current speech clip.

## Security Considerations

- Do not hardcode credentials - use config.json
- This server is intended for local network use only
- Queue size is limited to prevent overflows
- Temporary audio files are stored in the system's temp directory and cleaned up after use
