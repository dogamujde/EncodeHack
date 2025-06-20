import axios from "axios";
import qs from "qs";
import dotenv from "dotenv";

dotenv.config();

async function getAccessToken() {
  const tokenEndpoint = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;

  const data = qs.stringify({
    grant_type: "client_credentials",
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default"
  });

  try {
    const response = await axios.post(tokenEndpoint, data, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
    console.log("\n✅ Access Token:");
    console.log(response.data.access_token);
  } catch (err: any) {
    console.error("❌ Token retrieval error:", err.response?.data || err.message);
  }
}

getAccessToken(); 