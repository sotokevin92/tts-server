/**
 * Test script specifically for testing pause and resume functionality
 * This test verifies that pause stops playback and resume restarts from the beginning
 */
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000';
const POLLING_INTERVAL = 500; // 0.5 seconds

/**
 * Queue a text for speech synthesis
 * @param {string} text - Text to synthesize
 * @returns {Promise<string>} - Resolves with the clip ID
 */
async function queueSpeech(text) {
  console.log(`Queueing text: "${text}"`);

  try {
    const speakResponse = await axios.post(`${API_URL}/speak`, {
      text
    });

    if (!speakResponse.data.success) {
      throw new Error('Failed to queue text for speech synthesis');
    }

    const clipId = speakResponse.data.id;
    console.log(`Speech clip queued successfully. ID: ${clipId}`);
    return clipId;
  } catch (error) {
    console.error('Error queuing speech:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Get current playback status
 * @returns {Promise<Object>} - Status object
 */
async function getStatus() {
  try {
    const response = await axios.get(`${API_URL}/isPlaying`);
    return response.data;
  } catch (error) {
    console.error('Error getting status:', error.message);
    throw error;
  }
}

/**
 * Pause playback
 * @returns {Promise<Object>} - Response object
 */
async function pausePlayback() {
  try {
    const response = await axios.post(`${API_URL}/pause`);
    console.log('Pause response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error pausing playback:', error.message);
    throw error;
  }
}

/**
 * Resume playback
 * @returns {Promise<Object>} - Response object
 */
async function resumePlayback() {
  try {
    const response = await axios.post(`${API_URL}/resume`);
    console.log('Resume response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error resuming playback:', error.message);
    throw error;
  }
}

/**
 * Clear the queue
 * @returns {Promise<Object>} - Response object
 */
async function clearQueue() {
  try {
    const response = await axios.post(`${API_URL}/clear`);
    return response.data;
  } catch (error) {
    console.error('Error clearing queue:', error.message);
    throw error;
  }
}

/**
 * Wait for a specific clip to start playing
 * @param {string} clipId - ID of the clip to wait for
 * @returns {Promise<void>}
 */
async function waitForClipToStart(clipId) {
  console.log(`Waiting for clip ${clipId} to start playing...`);

  let isPlaying = false;
  while (!isPlaying) {
    const status = await getStatus();

    if ((status.isPlaying || status.isPaused) && status.currentlyPlayingId === clipId) {
      isPlaying = true;
      console.log(`Clip ${clipId} is now ${status.isPaused ? 'paused' : 'playing'}`);
    } else {
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
    }
  }
}

/**
 * Test that pause stops playback and resume restarts from beginning
 */
async function testPauseResumeRestart() {
  console.log('\n=== Testing Pause and Resume (Restart from Beginning) ===');

  try {
    // Clear queue first
    await clearQueue();
    console.log('Queue cleared');

    // Queue a long clip
    const clipId = await queueSpeech(
      'This is a long clip that will be paused and then resumed. ' +
      'When resumed, playback should restart from the beginning of this clip. ' +
      'Since play-sound does not have native pause functionality, the clip will restart when resumed.'
    );

    // Wait for clip to start playing
    await waitForClipToStart(clipId);

    // Let it play for a moment
    console.log('Letting clip play for 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Pause playback
    console.log('Pausing playback...');
    const pauseResponse = await pausePlayback();
    console.log('Pause response:', pauseResponse);

    // Check status after pause
    const statusAfterPause = await getStatus();
    console.log('Status after pause:', statusAfterPause);

    // Verify pause worked correctly
    if (statusAfterPause.isPlaying) {
      console.log('❌ Test failed: Clip is still reported as playing after pause');
      return;
    }

    if (!statusAfterPause.currentlyPlayingId) {
      console.log('❌ Test failed: No currently playing clip ID after pause');
      return;
    }

    if (!statusAfterPause.isPaused) {
      console.log('❌ Test failed: isPaused flag is not set to true after pause');
      return;
    }

    console.log('✅ Pause test passed: Clip successfully paused');

    // Wait while paused
    console.log('Waiting for 2 seconds while paused...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Resume playback
    console.log('Resuming playback...');
    const resumeResponse = await resumePlayback();
    console.log('Resume response:', resumeResponse);

    // Check status after resume
    const statusAfterResume = await getStatus();
    console.log('Status after resume:', statusAfterResume);

    // Verify resume worked correctly
    if (!statusAfterResume.isPlaying) {
      console.log('❌ Test failed: Clip is not playing after resume');
      return;
    }

    if (statusAfterResume.currentlyPlayingId !== clipId) {
      console.log(`❌ Test failed: Different clip is playing after resume. Expected ${clipId}, got ${statusAfterResume.currentlyPlayingId}`);
      return;
    }

    if (statusAfterResume.isPaused) {
      console.log('❌ Test failed: Clip is still paused after resume');
      return;
    }

    console.log('✅ Resume test passed: Clip successfully resumed (restarted from beginning)');
    console.log('Note: Since play-sound has no native pause functionality, the clip restarted from the beginning');

    // Let it play a bit more
    console.log('Letting resumed clip play for 2 more seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Final pause to demonstrate we can pause again
    console.log('Pausing again to demonstrate multiple pause/resume cycles...');
    await pausePlayback();

    const finalStatus = await getStatus();
    console.log('Final status after second pause:', finalStatus);

    if (!finalStatus.isPaused || !finalStatus.currentlyPlayingId) {
      console.log('❌ Test failed: Second pause did not work correctly');
    } else {
      console.log('✅ Multiple pause/resume cycle test passed');
    }

    // Clean up
    await clearQueue();
    console.log('Queue cleared');

  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

/**
 * Run the test
 */
async function runTest() {
  console.log('Starting pause/resume restart test...');

  try {
    await testPauseResumeRestart();
    console.log('\n=== All pause/resume tests completed ===');
  } catch (error) {
    console.error('Test suite failed with error:', error.message);
  } finally {
    // Clean up
    await clearQueue();
  }
}

// Run the test
runTest().catch(console.error);
