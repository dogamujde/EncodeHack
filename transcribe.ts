import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.ASSEMBLYAI_API_KEY!;
const filePath = "./Erzurumda gldren samimi rportaj Eine selam yollad.mp3";

async function uploadAudio() {
  const file = fs.createReadStream(filePath);
  const response = await axios.post("https://api.assemblyai.com/v2/upload", file, {
    headers: { authorization: apiKey }
  });
  return response.data.upload_url;
}

async function requestTranscription(audioUrl: string) {
  const response = await axios.post("https://api.assemblyai.com/v2/transcript", {
    audio_url: audioUrl,
    speaker_labels: true,   // This is critical for speaker identification
    language_code: "tr", // Turkish
  }, {
    headers: { authorization: apiKey }
  });
  return response.data.id;
}

async function pollTranscript(id: string) {
  while (true) {
    const res = await axios.get(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: { authorization: apiKey }
    });

    if (res.data.status === "completed") {
      fs.writeFileSync("transcript.json", JSON.stringify(res.data, null, 2));
      console.log("✅ Transcript downloaded → transcript.json");
      break;
    } else if (res.data.status === "error") {
      console.error("❌ Transcription error:", res.data.error);
      break;
    } else {
      console.log("⏳ Waiting...");
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

async function main() {
  const audioUrl = await uploadAudio();
  const transcriptId = await requestTranscription(audioUrl);
  await pollTranscript(transcriptId);
}

main();