import 'dotenv/config';

const DAILY_API_KEY = process.env.DAILY_API_KEY;

async function checkRecordings() {
  if (!DAILY_API_KEY) {
    console.error('Error: DAILY_API_KEY is not set in your environment.');
    console.log('Please create a .env file and add your Daily.co API key.');
    return;
  }

  console.log('Fetching recent recordings from Daily.co...');

  try {
    const response = await fetch('https://api.daily.co/v1/recordings', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(errorBody)}`);
    }

    const result = await response.json() as { data: any[] };
    const recordings = result.data;

    if (recordings.length === 0) {
      console.log('No recordings found for your account.');
    } else {
      console.log(`Found ${recordings.length} recording(s). Here are the details:`);
      recordings.slice(0, 5).forEach((rec: any, index: number) => {
        console.log(`\n--- Recording ${index + 1} ---`);
        console.log(`  ID: ${rec.id}`);
        console.log(`  Room Name: ${rec.room_name}`);
        console.log(`  Status: ${rec.status}`);
        console.log(`  Duration: ${rec.duration} seconds`);
        console.log(`  Start Time: ${new Date(rec.start_ts * 1000).toLocaleString()}`);
        if (rec.status === 'finished') {
          console.log(`  Download Link: ${rec.share_token ? `https://meetingbot.daily.co/recordings/${rec.id}?t=${rec.share_token}` : 'N/A'}`);
        }
      });
    }
  } catch (error) {
    console.error('An error occurred while fetching recordings:', error);
  }
}

checkRecordings();
