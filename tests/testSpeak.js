/**
 * Simple test script for the speak command
 */
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000';

// Test data
const testCases = [
  {
    name: 'Basic text',
    data: {
      text: 'Hello, this is a test of the TTS server.'
    },
  },
  {
    name: 'With voice',
    data: {
      text: 'This is spoken with a different voice.',
      voice: 'Matthew'
    },
  },
  {
    name: 'With pitch',
    data: {
      text: 'This is spoken with a higher pitch.',
      voice: 'Joanna',
      pitch: 120
    },
  },
  {
    name: 'With blocking',
    data: {
      text: 'This request will block until playback is complete.',
      voice: 'Joanna',
      block: true
    }
  }
];

/**
 * Run the test cases
 */
async function runTests() {
  console.log('Starting TTS server tests...\n');

  for (const test of testCases) {
    console.log(`Test: ${test.name}`);
    console.log(`Data: ${JSON.stringify(test.data)}`);

    try {
      // Call the speak endpoint
      const response = await axios.post(`${API_URL}/speak`, test.data);

      console.log('Response:');
      console.log(JSON.stringify(response.data, null, 2));

      // If the speech was added to the queue, store the ID
      if (response.data.success && response.data.id) {
        console.log(`Speech clip ID: ${response.data.id}`);
        console.log(`Duration: ${response.data.duration} seconds`);

        // Wait a moment to let the server process
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test the delete endpoint with the ID
        console.log(`Testing delete for ID: ${response.data.id}`);
        const deleteResponse = await axios.post(`${API_URL}/delete`, { id: response.data.id });
        console.log('Delete response:');
        console.log(JSON.stringify(deleteResponse.data, null, 2));
      }
    } catch (error) {
      console.error('Error:', error.response ? error.response.data : error.message);
      console.log(error);
    }

    console.log('\n---\n');
  }

  // Test isPlaying endpoint
  console.log('Testing isPlaying endpoint:');
  try {
    const response = await axios.get(`${API_URL}/isPlaying`);
    console.log('Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }

  console.log('\nTests completed.');
}

// Run the tests
runTests().catch(console.error);
