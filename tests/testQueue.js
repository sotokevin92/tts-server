/**
 * Test script for comprehensive queue management operations:
 * - Delete currently playing clip
 * - Delete queued clip not yet playing
 * - Delete nonexistent clip
 * - Empty queue, pause, queue, unpause
 * - Pause and unpause during playback
 */
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000';
const POLLING_INTERVAL = 500; // 0.5 seconds

/**
 * Queue a text for speech synthesis
 * @param {string} text - Text to synthesize
 * @param {string} [voice] - Voice ID to use
 * @param {number} [pitch] - Speech pitch
 * @returns {Promise<string>} - Resolves with the clip ID
 */
async function queueSpeech(text, voice, pitch) {
  console.log(`Queueing text: "${text}"`);

  try {
    const speakResponse = await axios.post(`${API_URL}/speak`, {
      text,
      voice,
      pitch
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
 * Check the current playback status
 * @returns {Promise<Object>} - Playback status
 */
async function getPlaybackStatus() {
  try {
    const response = await axios.get(`${API_URL}/isPlaying`);
    return response.data;
  } catch (error) {
    console.error('Error getting playback status:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Wait for a specific speech clip to start playing
 * @param {string} clipId - ID of the clip to wait for
 * @returns {Promise<void>}
 */
async function waitForClipToStart(clipId) {
  console.log(`Waiting for clip ${clipId} to start playing...`);

  let isOurClipPlaying = false;
  while (!isOurClipPlaying) {
    const status = await getPlaybackStatus();

    // Clip is playing if either it's actively playing OR it's paused but it's our clip
    if ((status.isPlaying && status.currentlyPlayingId === clipId) || 
        (status.isPaused && status.currentlyPlayingId === clipId)) {
      isOurClipPlaying = true;
    } else {
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
    }
  }

  console.log(`Clip ${clipId} is now playing or paused`);
}

/**
 * Wait for a speech clip to finish playing
 * @param {string} clipId - ID of the clip to wait for
 * @returns {Promise<void>}
 */
async function waitForClipToFinish(clipId) {
  console.log(`Waiting for clip ${clipId} to finish playing...`);

  let isClipDone = false;
  while (!isClipDone) {
    const status = await getPlaybackStatus();

    // Clip is done if:
    // 1. Nothing is playing or paused, OR
    // 2. A different clip is playing or paused
    if (((!status.isPlaying && !status.isPaused) || status.currentlyPlayingId !== clipId)) {
      isClipDone = true;
    } else {
      process.stdout.write('.');
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
    }
  }

  console.log(`\nClip ${clipId} has finished playing`);
}

/**
 * Delete a clip from the queue
 * @param {string} clipId - ID of the clip to delete
 * @returns {Promise<boolean>} - True if successful
 */
async function deleteClip(clipId) {
  try {
    const response = await axios.post(`${API_URL}/delete`, { id: clipId });
    console.log(`Delete clip ${clipId} response:`, response.data);
    return response.data.success;
  } catch (error) {
    console.error('Error deleting clip:', error.response ? error.response.data : error.message);
    return false;
  }
}

/**
 * Pause playback
 * @returns {Promise<boolean>} - True if successful
 */
async function pausePlayback() {
  try {
    const response = await axios.post(`${API_URL}/pause`);
    console.log('Pause response:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('Error pausing playback:', error.response ? error.response.data : error.message);
    return false;
  }
}

/**
 * Resume playback
 * @returns {Promise<boolean>} - True if successful
 */
async function resumePlayback() {
  try {
    const response = await axios.post(`${API_URL}/resume`);
    console.log('Resume response:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('Error resuming playback:', error.response ? error.response.data : error.message);
    return false;
  }
}

/**
 * Clear the queue
 * @returns {Promise<boolean>} - True if successful
 */
async function clearQueue() {
  try {
    const response = await axios.post(`${API_URL}/clear`);
    console.log('Clear queue response:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('Error clearing queue:', error.response ? error.response.data : error.message);
    return false;
  }
}

/**
 * Test deleting a currently playing clip
 */
async function testDeleteCurrentlyPlaying() {
  console.log('\n=== Testing Delete of Currently Playing Clip ===');

  try {
    // Clear any existing queue
    await clearQueue();

    // Queue a long speech clip
    const clipId = await queueSpeech(
      'This is a long speech that will be deleted while playing. ' + 
      'The playback should stop and move to the next item in the queue, if any.'
    );

    // Wait for it to start playing
    await waitForClipToStart(clipId);

    // Get status before deleting
    const beforeStatus = await getPlaybackStatus();
    console.log('Status before deleting:', beforeStatus);

    // Delete the currently playing clip
    console.log('Deleting currently playing clip...');
    const deleteResult = await deleteClip(clipId);
    console.log(`Delete result: ${deleteResult}`);

    // Get status after deleting
    const afterStatus = await getPlaybackStatus();
    console.log('Status after deleting:', afterStatus);

    // Verify that the clip is no longer playing
    if (!afterStatus.isPlaying || afterStatus.currentlyPlayingId !== clipId) {
      console.log('✅ Test passed: Currently playing clip was successfully deleted');
    } else {
      console.log('❌ Test failed: Clip is still playing after deletion');
    }
  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

/**
 * Test deleting a queued clip that's not yet playing
 */
async function testDeleteQueuedClip() {
  console.log('\n=== Testing Delete of Queued Clip (Not Yet Playing) ===');

  try {
    // Clear any existing queue
    await clearQueue();

    // Queue two clips
    const firstClipId = await queueSpeech('This is the first clip that will play completely.');
    const secondClipId = await queueSpeech('This is the second clip that will be deleted before it plays.');

    // Wait for the first clip to start playing
    await waitForClipToStart(firstClipId);

    // Delete the second clip while the first one is playing
    console.log(`Deleting queued clip ${secondClipId} while ${firstClipId} is playing...`);
    const deleteResult = await deleteClip(secondClipId);
    console.log(`Delete result: ${deleteResult}`);

    // Wait for the first clip to finish
    await waitForClipToFinish(firstClipId);

    // Check the status - should not be playing anything now since we deleted the second clip
    const status = await getPlaybackStatus();

    if (!status.isPlaying) {
      console.log('✅ Test passed: Queued clip was successfully deleted');
    } else {
      console.log(`❌ Test failed: Something is still playing: ${status.currentlyPlayingId}`);
    }
  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

/**
 * Test deleting a nonexistent clip
 */
async function testDeleteNonexistentClip() {
  console.log('\n=== Testing Delete of Nonexistent Clip ===');

  try {
    // Clear any existing queue
    await clearQueue();

    // Try to delete a nonexistent clip ID
    const fakeId = 'nonexistent-clip-id';
    console.log(`Attempting to delete nonexistent clip ${fakeId}...`);
    const deleteResult = await deleteClip(fakeId);

    if (!deleteResult) {
      console.log('✅ Test passed: Deleting nonexistent clip returned false');
    } else {
      console.log('❌ Test failed: Deleting nonexistent clip returned true');
    }
  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

/**
 * Test empty queue, queue, then playback sequence
 */
async function testEmptyQueuePauseQueueUnpause() {
  console.log('\n=== Testing Empty Queue, Queue, Playback Sequence ===');

  try {
    // Clear any existing queue
    await clearQueue();

    // Verify the queue is empty
    const initialStatus = await getPlaybackStatus();
    console.log('Initial status (should be empty):', initialStatus);

    if (initialStatus.isPlaying) {
      console.log('❌ Queue should be empty, but something is playing. Clearing again...');
      await clearQueue();
    }

    // Queue a clip
    console.log('Queueing a clip...');
    const clipId = await queueSpeech('This is a test clip that should start playing immediately.');

    // Wait a moment for playback to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check status - should be playing now
    const statusAfterQueue = await getPlaybackStatus();
    console.log('Status after queueing:', statusAfterQueue);

    if (statusAfterQueue.isPlaying && statusAfterQueue.currentlyPlayingId === clipId) {
      console.log('✅ Test passed: Clip started playing automatically');
    } else {
      console.log('❌ Test failed: Clip did not start playing automatically');
    }

    // Wait for clip to finish
    await waitForClipToFinish(clipId);
  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

/**
 * Test pause and unpause during playback
 */
async function testPauseUnpauseDuringPlayback() {
  console.log('\n=== Testing Pause and Unpause During Playback ===');
  console.log('Note: Since play-sound has no native pause functionality, the clip will restart from the beginning when resumed');

  try {
    // Clear any existing queue
    await clearQueue();

    // Queue a long speech clip
    const clipId = await queueSpeech(
      'This is a long speech that will be paused and then resumed. ' + 
      'The playback should stop when paused and restart from the beginning when resumed. ' +
      'This is a longer text to ensure we have enough time to pause and resume properly.'
    );

    // Wait for it to start playing
    await waitForClipToStart(clipId);

    // Let it play for a moment
    console.log('Letting clip play for 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Pause playback
    console.log('Pausing playback...');
    const pauseResult = await pausePlayback();
    console.log(`Pause result: ${pauseResult}`);

    if (!pauseResult) {
      console.log('❌ Failed to pause playback');
      return;
    }

    // Check status - should not be playing but should have a current clip and isPaused should be true
    const statusAfterPause = await getPlaybackStatus();
    console.log('Status after pause:', statusAfterPause);

    // Verify the pause worked correctly
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

    // Wait for a moment while paused
    console.log('Waiting for 2 seconds while paused...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Resume playback
    console.log('Resuming playback...');
    console.log('Note: This will restart the clip from the beginning since play-sound has no native pause capability');
    const resumeResult = await resumePlayback();
    console.log(`Resume result: ${resumeResult}`);

    if (!resumeResult) {
      console.log('❌ Failed to resume playback');
      return;
    }

    // Wait a moment for the resume to take effect
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check status - should be playing again
    const statusAfterResume = await getPlaybackStatus();
    console.log('Status after resume:', statusAfterResume);

    // Verify the resume worked correctly
    if (!statusAfterResume.isPlaying) {
      console.log('❌ Test failed: Clip is not playing after resume');
    } else if (statusAfterResume.currentlyPlayingId !== clipId) {
      console.log('❌ Test failed: Different clip is playing after resume');
    } else {
      console.log('✅ Test passed: Successfully paused and resumed playback (restarted from beginning)');
    }

    // Wait for clip to finish
    await waitForClipToFinish(clipId);
  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

/**
 * Test queue, pause, queue, wait for completion sequence
 */
async function testQueuePauseQueueSequence() {
  console.log('\n=== Testing Queue, Pause, Queue Sequence ===');

  try {
    // Clear any existing queue
    await clearQueue();

    // Queue first clip
    console.log('Queueing first clip...');
    const firstClipId = await queueSpeech('This is the first clip that will be paused.');

    // Wait for it to start playing
    await waitForClipToStart(firstClipId);

    // Let it play for a moment
    console.log('Letting clip play for 1 second...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Pause playback
    console.log('Pausing playback...');
    const pauseResult = await pausePlayback();
    console.log(`Pause result: ${pauseResult}`);

    // Check status - should be paused
    const statusAfterPause = await getPlaybackStatus();
    console.log('Status after pause:', statusAfterPause);

    if (!pauseResult || statusAfterPause.isPlaying) {
      console.log('❌ Test failed: Could not pause playback');
      return;
    }

    // Queue second clip while first is paused
    console.log('Queueing second clip while first is paused...');
    const secondClipId = await queueSpeech('This is the second clip that was queued while the first one was paused.');

    // Resume playback of first clip
    console.log('Resuming playback...');
    const resumeResult = await resumePlayback();
    console.log(`Resume result: ${resumeResult}`);

    if (!resumeResult) {
      console.log('❌ Test failed: Could not resume playback');
      return;
    }

    // Wait for first clip to finish
    console.log('Waiting for first clip to finish...');
    await waitForClipToFinish(firstClipId);

    // Check if second clip started playing
    const statusAfterFirstClip = await getPlaybackStatus();
    console.log('Status after first clip finished:', statusAfterFirstClip);

    if (!statusAfterFirstClip.isPlaying) {
      console.log('❌ Test failed: Second clip did not start playing');
      return;
    }

    if (statusAfterFirstClip.currentlyPlayingId !== secondClipId) {
      console.log(`❌ Test failed: Expected clip ${secondClipId} to be playing, but ${statusAfterFirstClip.currentlyPlayingId} is playing`);
      return;
    }

    console.log('✅ Test passed: Successfully handled queue, pause, queue sequence');

    // Wait for second clip to finish
    await waitForClipToFinish(secondClipId);
  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('Starting queue tests...');

  try {
    // Run each test in sequence
    await testDeleteCurrentlyPlaying();
    await testDeleteQueuedClip();
    await testDeleteNonexistentClip();
    await testEmptyQueuePauseQueueUnpause();
    await testPauseUnpauseDuringPlayback();
    await testQueuePauseQueueSequence();

    console.log('\n=== All tests completed ===');
  } catch (error) {
    console.error('Test suite failed with error:', error.message);
  } finally {
    // Clean up: clear the queue at the end
    console.log('Cleaning up: clearing queue...');
    await clearQueue();
  }
}

// Run all tests
runAllTests().catch(console.error);
