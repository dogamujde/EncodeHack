import fs from "fs";

type Utterance = {
  speaker: string;
  start: number;
  end: number;
  text: string;
};

const transcript = JSON.parse(fs.readFileSync("./transcript.json", "utf-8"));

// Assume data.utterances contains each speaking segment
const utterances: Utterance[] = transcript.utterances;

const speakerStats: Record<string, { totalDuration: number; wordCount: number }> = {};

for (const utt of utterances) {
  const duration = (utt.end - utt.start) / 1000; // ms → s
  const words = utt.text.trim().split(/\s+/).length;

  if (!speakerStats[utt.speaker]) {
    speakerStats[utt.speaker] = { totalDuration: 0, wordCount: 0 };
  }

  speakerStats[utt.speaker].totalDuration += duration;
  speakerStats[utt.speaker].wordCount += words;
}

console.log("🎤 Speaking Duration and Rates:");
for (const [speaker, stats] of Object.entries(speakerStats)) {
  const wpm = stats.wordCount / (stats.totalDuration / 60);
  console.log(`🧑‍💼 Speaker ${speaker}: ${stats.totalDuration.toFixed(1)} seconds, ${stats.wordCount} words, ${wpm.toFixed(1)} WPM`);
}