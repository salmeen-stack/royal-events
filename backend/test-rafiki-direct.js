import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const RAFIKI_BASE_URL = process.env.RAFIKI_BASE_URL || "https://api.rafikisms.com";
const RAFIKI_API_KEY = process.env.RAFIKI_API_KEY;
const RAFIKI_SENDER_ID = process.env.RAFIKI_SENDER_ID;

const testPhone = "255768067832";

async function testDirectSMS() {
  try {
    console.log("Testing direct RafikiSMS API call...");
    console.log("Base URL:", RAFIKI_BASE_URL);
    console.log("API Key:", RAFIKI_API_KEY ? "Set" : "Not set");
    console.log("Sender ID:", RAFIKI_SENDER_ID || "Not set");
    console.log("Phone:", testPhone);

    const response = await axios.post(
      `${RAFIKI_BASE_URL}/v1/vendor/send-sms`,
      {
        phone: testPhone,
        message: "Karibu! Token yako ni: TEST-1234",
        sender_id: RAFIKI_SENDER_ID,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-Key": RAFIKI_API_KEY,
        },
        timeout: 15000,
      }
    );

    console.log("\n✅ Success!");
    console.log("Response:", JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error("\n❌ Error:");
    console.error("Status:", error.response?.status);
    console.error("Status Text:", error.response?.statusText);
    console.error("Response Data:", JSON.stringify(error.response?.data, null, 2));
    console.error("Headers:", JSON.stringify(error.response?.headers, null, 2));
  }
}

testDirectSMS();
