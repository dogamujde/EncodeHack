export async function getRealtimeToken(apiKey: string): Promise<string> {
  const response = await fetch("https://api.assemblyai.com/v2/realtime/token", {
    method: "POST",
    headers: {
      "authorization": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ expires_in: 300 })
  });

  if (!response.ok) {
    throw new Error(`Failed to get token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.token;
} 