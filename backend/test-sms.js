import dotenv from "dotenv";
import { generateOTP } from "./src/services/sms.service.js";

dotenv.config();

const testPhone = "255768067832";

console.log("Testing RafikiSMS OTP Generation...");
console.log("Phone:", testPhone);
console.log("API Key:", process.env.RAFIKI_API_KEY ? "Set" : "Not set");
console.log("Sender ID:", process.env.RAFIKI_SENDER_ID || "Not set");

async function testSMS() {
  try {
    const result = await generateOTP(testPhone);
    
    console.log("\nResult:", JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log("\n✅ OTP sent successfully!");
      console.log("Reference ID:", result.referenceId);
      console.log("Expires in:", result.expiresIn, "seconds");
    } else {
      console.log("\n❌ Failed to send OTP");
      console.log("Error:", result.error);
    }
  } catch (error) {
    console.error("\n❌ Test failed with error:", error.message);
  }
}

testSMS();
