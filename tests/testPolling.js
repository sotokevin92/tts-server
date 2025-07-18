/**
 * Test script demonstrating how to wait for playback to end client-side
 * by polling the isPlaying endpoint with queueing support
 */
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000';
const POLLING_INTERVAL = 500; // 0.5 seconds

/**
 * Queue a text for speech synthesis and wait for specific clip to complete
 * by polling the isPlaying endpoint
 * @param {string} text - Text to synthesize
 * @param {string} [voice] - Voice ID to use
 * @param {number} [pitch] - Speech pitch
 * @param {boolean} [waitForCompletion=true] - Whether to wait for this clip to complete
 * @returns {Promise<string>} - Resolves with clip ID when queued or when playback is complete
 */
async function queueAndWaitForCompletion(text, voice, pitch, waitForCompletion = true) {
  console.log(`Queueing text: "${text}"`);
  
  try {
    // Step 1: Queue the text for speech synthesis
    const speakResponse = await axios.post(`${API_URL}/speak`, {
      text,
      voice,
      pitch
    });
    
    console.log('Speak response:');
    console.log(JSON.stringify(speakResponse.data, null, 2));
    
    if (!speakResponse.data.success) {
      throw new Error('Failed to queue text for speech synthesis');
    }
    
    const clipId = speakResponse.data.id;
    const estimatedDuration = speakResponse.data.duration;
    
    console.log(`Speech clip ID: ${clipId}`);
    console.log(`Estimated duration: ${estimatedDuration} seconds`);
    
    // If we don't need to wait for completion, return the clip ID immediately
    if (!waitForCompletion) {
      console.log('Clip queued successfully (not waiting for completion)');
      return clipId;
    }
    
    console.log('Waiting for this clip to start playing...');
    
    // Step 2: Wait for this specific clip to start playing
    let isOurClipPlaying = false;
    while (!isOurClipPlaying) {
      const playingResponse = await axios.get(`${API_URL}/isPlaying`);
      const isPlaying = playingResponse.data.isPlaying;
      const currentlyPlayingId = playingResponse.data.currentlyPlayingId;
      
      if (isPlaying && currentlyPlayingId === clipId) {
        isOurClipPlaying = true;
      } else {
        console.log(`Waiting for our clip to start... (currently playing: ${currentlyPlayingId || 'none'})`);
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
      }
    }
    
    console.log('Our clip started playing!');
    console.log('Polling isPlaying endpoint every 0.5 seconds until our clip ends...');
    
    // Step 3: Poll the isPlaying endpoint until our clip ends
    let pollCount = 0;
    while (isOurClipPlaying) {
      pollCount++;
      const playingResponse = await axios.get(`${API_URL}/isPlaying`);
      const isPlaying = playingResponse.data.isPlaying;
      const currentlyPlayingId = playingResponse.data.currentlyPlayingId;
      
      // Our clip is no longer playing if:
      // 1. Nothing is playing, or
      // 2. A different clip is playing
      if (!isPlaying || currentlyPlayingId !== clipId) {
        isOurClipPlaying = false;
      } else {
        process.stdout.write(`.`); // Show progress without newlines
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
      }
    }
    
    console.log('\nOur clip playback completed!');
    console.log(`Polled isPlaying endpoint ${pollCount} times`);
    
    return clipId;
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Run the test with queueing
 */
async function runTest() {
  console.log('Starting polling test with queueing...\n');
  
  try {
    // Queue the first clip and wait for it to complete
    console.log('=== Queueing first clip (will wait for completion) ===');
    const firstClipId = await queueAndWaitForCompletion(
      'This is the first clip. I will wait for this one to finish playing completely before continuing.',
      'Joanna',
      undefined,
      true // Wait for completion
    );
    
    console.log(`\n=== First clip (${firstClipId}) completed ===\n`);
    
    // Queue the second clip but don't wait for it
    console.log('=== Queueing second clip (will not wait for completion) ===');
    const secondClipId = await queueAndWaitForCompletion(
      'This is the second clip. It was queued but we did not wait for it to complete.',
      'Joanna',
      undefined,
      false // Don't wait for completion
    );
    
    console.log(`\n=== Second clip (${secondClipId}) queued successfully ===\n`);
    
    // Check current status
    console.log('=== Checking final status ===');
    const finalStatus = await axios.get(`${API_URL}/isPlaying`);
    console.log('Final status:', JSON.stringify(finalStatus.data, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
  
  console.log('\nTest completed.');
}

// Run the test
runTest().catch(console.error);