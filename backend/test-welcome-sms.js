import dotenv from "dotenv";
import prisma from "./src/config/prisma.js";
import { sendSMS } from "./src/services/sms.service.js";
import { generateSMSToken } from "./src/utils/token.js";

dotenv.config();

const testPhone = "255768067832";
const guestName = "Test Guest";

async function testWelcomeSMS() {
  try {
    console.log("Testing Welcome SMS with Token...\n");

    // Step 1: Get available events
    console.log("Step 1: Fetching available events...");
    const events = await prisma.event.findMany({
      where: {
        eventDate: {
          gte: new Date(),
        },
      },
      take: 5,
    });

    if (events.length === 0) {
      console.log("❌ No upcoming events found. Creating a test event...");
      
      const testEvent = await prisma.event.create({
        data: {
          name: "Test Event for SMS",
          eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          venue: "Test Venue",
          eventReference: "TEST-" + Date.now(),
          expectedGuests: 100,
          contributionAmount: 50000,
          status: "PENDING",
        },
      });
      
      console.log("✅ Created test event:", testEvent.name);
      events.push(testEvent);
    }

    console.log(`✅ Found ${events.length} events:`);
    events.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.name} (${event.eventDate.toISOString().split('T')[0]}) at ${event.venue}`);
    });

    // Step 2: Select the first event
    const selectedEvent = events[0];
    console.log(`\nStep 2: Selected event: ${selectedEvent.name}\n`);

    // Step 3: Check if guest already exists
    console.log("Step 3: Checking if guest exists...");
    let guest = await prisma.guest.findFirst({
      where: {
        phone: testPhone,
        eventId: selectedEvent.id,
      },
    });

    if (!guest) {
      console.log("Guest not found, creating new guest...");
      guest = await prisma.guest.create({
        data: {
          name: guestName,
          phone: testPhone,
          eventId: selectedEvent.id,
          category: "VIP",
        },
      });
      console.log(`✅ Created guest: ${guest.name}\n`);
    } else {
      console.log(`✅ Guest already exists: ${guest.name}\n`);
    }

    // Step 4: Generate SMS token
    console.log("Step 4: Generating SMS token...");
    const smsToken = generateSMSToken();
    console.log(`✅ Generated token: ${smsToken}\n`);

    // Step 5: Format event date in Swahili
    const eventDate = new Date(selectedEvent.eventDate).toLocaleDateString("sw-TZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Step 6: Create Swahili welcome message
    console.log("Step 5: Creating Swahili welcome message...");
    const message =
      `Karibu ${guest.name}!\n\n` +
      `Tunafurahi kukukaribisha kwenye ${selectedEvent.name}.\n\n` +
      `Namba yako ya Karibu (Welcome Token) ni:\n` +
      `${smsToken}\n\n` +
      `Tafadhali tunza namba hii vizuri - utahitaji kuingia na kupata taarifa za tukio.\n\n` +
      `Tunatumai kuona wewe katika ${selectedEvent.venue} tarehe ${eventDate}.\n\n` +
      `Kwa maswali yoyote, tafadhali wasiliana nasi.`;

    console.log("Message:");
    console.log("---");
    console.log(message);
    console.log("---\n");

    // Step 7: Send SMS
    console.log("Step 6: Sending SMS via RafikiSMS...");
    const result = await sendSMS({
      to: testPhone,
      message,
      eventId: selectedEvent.id,
      guestId: guest.id,
      type: "INVITATION",
    });

    if (result.success) {
      console.log("\n✅ Welcome SMS sent successfully!");
      console.log("Notification ID:", result.notificationId);
      console.log("Provider Ref:", result.providerRef);
    } else {
      console.log("\n❌ Failed to send SMS");
      console.log("Error:", result.error);
      console.log("Error details:", JSON.stringify(result, null, 2));
    }

    // Cleanup: Delete test guest (optional - comment out if you want to keep it)
    // console.log("\nCleaning up test data...");
    // await prisma.guest.delete({
    //   where: { id: guest.id },
    // });
    // console.log("✅ Test guest deleted");

  } catch (error) {
    console.error("\n❌ Test failed with error:", error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testWelcomeSMS();
