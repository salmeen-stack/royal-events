import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

// Helper function to generate random dates
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper function to generate reference numbers
const generateRef = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

const sampleData = async () => {
  console.log("🌱 Seeding sample data...");

  try {
    // ==========================================
    // USERS
    // ==========================================
    console.log("Creating users...");
    
    const staffUser = await prisma.user.create({
      data: {
        id: uuidv4(),
        name: "John Staff",
        email: "staff@royalevents.com",
        phone: "+254712345678",
        passwordHash: await bcrypt.hash("Staff@2026", 10),
        role: "STAFF",
        isActive: true,
      },
    });

    const eventOwnerUser = await prisma.user.create({
      data: {
        id: uuidv4(),
        name: "Jane Owner",
        email: "owner@royalevents.com",
        phone: "+254712345679",
        passwordHash: await bcrypt.hash("Owner@2026", 10),
        role: "EVENT_OWNER",
        isActive: true,
      },
    });

    console.log("✅ Users created");

    // ==========================================
    // EVENT OWNERS
    // ==========================================
    console.log("Creating event owners...");
    
    const eventOwner1 = await prisma.eventOwner.create({
      data: {
        id: uuidv4(),
        name: "Michael Kamau",
        email: "michael.kamau@email.com",
        phone: "+254711234567",
        address: "123 Nairobi West, Nairobi, Kenya",
        isActive: true,
      },
    });

    const eventOwner2 = await prisma.eventOwner.create({
      data: {
        id: uuidv4(),
        name: "Sarah Wanjiku",
        email: "sarah.wanjiku@email.com",
        phone: "+254722345678",
        address: "456 Mombasa Road, Nairobi, Kenya",
        isActive: true,
      },
    });

    console.log("✅ Event owners created");

    // ==========================================
    // EVENTS
    // ==========================================
    console.log("Creating events...");
    
    const eventDate1 = new Date();
    eventDate1.setDate(eventDate1.getDate() + 30); // 30 days from now
    
    const eventDate2 = new Date();
    eventDate2.setDate(eventDate2.getDate() + 45); // 45 days from now
    
    const eventDate3 = new Date();
    eventDate3.setDate(eventDate3.getDate() + 60); // 60 days from now

    const weddingEvent = await prisma.event.create({
      data: {
        id: uuidv4(),
        eventReference: generateRef("WED"),
        name: "Kamau & Wanjiku Wedding",
        type: "WEDDING",
        description: "Beautiful wedding ceremony for Michael Kamau and Sarah Wanjiku",
        eventDate: eventDate1,
        eventTime: "14:00",
        venue: "Safari Park Hotel",
        location: "Nairobi, Kenya",
        googleMapsUrl: "https://maps.google.com/safari-park-hotel",
        imageUrl: "https://example.com/wedding.jpg",
        contributionTarget: 500000,
        contributionDeadline: new Date(eventDate1.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before event
        paymentInstructions: "Pay via M-Pesa to 0712345678 or bank transfer to Account 123456789",
        eventProgram: "14:00 - Ceremony, 16:00 - Reception, 20:00 - Dinner",
        status: "ACTIVE",
        eventOwnerId: eventOwner1.id,
        createdById: staffUser.id,
      },
    });

    const birthdayEvent = await prisma.event.create({
      data: {
        id: uuidv4(),
        eventReference: generateRef("BTH"),
        name: "David's 30th Birthday Party",
        type: "BIRTHDAY",
        description: "Celebrating David's milestone 30th birthday",
        eventDate: eventDate2,
        eventTime: "18:00",
        venue: "The Boma Nairobi",
        location: "Nairobi, Kenya",
        googleMapsUrl: "https://maps.google.com/boma-nairobi",
        imageUrl: "https://example.com/birthday.jpg",
        contributionTarget: 200000,
        contributionDeadline: new Date(eventDate2.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days before event
        paymentInstructions: "Pay via M-Pesa to 0722345678",
        eventProgram: "18:00 - Arrival, 19:00 - Cake Cutting, 21:00 - Party",
        status: "ACTIVE",
        eventOwnerId: eventOwner2.id,
        createdById: staffUser.id,
      },
    });

    const fundraisingEvent = await prisma.event.create({
      data: {
        id: uuidv4(),
        eventReference: generateRef("FUN"),
        name: "Community School Fundraiser",
        type: "FUNDRAISING",
        description: "Fundraising for local community school renovation",
        eventDate: eventDate3,
        eventTime: "10:00",
        venue: "Community Hall",
        location: "Machakos, Kenya",
        googleMapsUrl: "https://maps.google.com/community-hall",
        imageUrl: "https://example.com/fundraiser.jpg",
        contributionTarget: 1000000,
        contributionDeadline: new Date(eventDate3.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days before event
        paymentInstructions: "Pay via M-Pesa to 0733456789 or bank transfer",
        eventProgram: "10:00 - Opening, 12:00 - Presentations, 14:00 - Lunch",
        status: "ACTIVE",
        eventOwnerId: eventOwner1.id,
        createdById: staffUser.id,
      },
    });

    console.log("✅ Events created");

    // ==========================================
    // GUESTS
    // ==========================================
    console.log("Creating guests...");
    
    const weddingGuests = [
      { name: "James Omondi", phone: "+254733456789", email: "james@email.com", category: "Family", expectedContribution: 50000 },
      { name: "Mary Atieno", phone: "+254744567890", email: "mary@email.com", category: "Family", expectedContribution: 50000 },
      { name: "Peter Njoroge", phone: "+254755678901", email: "peter@email.com", category: "Friend", expectedContribution: 30000 },
      { name: "Grace Wanjiru", phone: "+254766789012", email: "grace@email.com", category: "Friend", expectedContribution: 30000 },
      { name: "David Kipchoge", phone: "+254777890123", email: "david@email.com", category: "Colleague", expectedContribution: 20000 },
      { name: "Ruth Chebet", phone: "+254788901234", email: "ruth@email.com", category: "Colleague", expectedContribution: 20000 },
      { name: "Samuel Ochieng", phone: "+254799012345", email: "samuel@email.com", category: "Family", expectedContribution: 40000 },
      { name: "Esther Akinyi", phone: "+254710123456", email: "esther@email.com", category: "Friend", expectedContribution: 25000 },
    ];

    const birthdayGuests = [
      { name: "Brian Mutua", phone: "+254721234567", email: "brian@email.com", category: "Friend", expectedContribution: 15000 },
      { name: "Lucy Muthoni", phone: "+254732345678", email: "lucy@email.com", category: "Family", expectedContribution: 20000 },
      { name: "Kevin Otieno", phone: "+254743456789", email: "kevin@email.com", category: "Friend", expectedContribution: 15000 },
      { name: "Faith Njeri", phone: "+254754567890", email: "faith@email.com", category: "Colleague", expectedContribution: 10000 },
      { name: "Alex Mwangi", phone: "+254765678901", email: "alex@email.com", category: "Friend", expectedContribution: 15000 },
    ];

    const fundraiserGuests = [
      { name: "John Maina", phone: "+254776789012", email: "john.maina@email.com", category: "Donor", expectedContribution: 100000 },
      { name: "Hannah Wambui", phone: "+254787890123", email: "hannah@email.com", category: "Donor", expectedContribution: 150000 },
      { name: "George Kamotho", phone: "+254798901234", email: "george@email.com", category: "Business", expectedContribution: 200000 },
      { name: "Alice Nyambura", phone: "+254709012345", email: "alice@email.com", category: "Donor", expectedContribution: 75000 },
      { name: "Robert Kariuki", phone: "+254720123456", email: "robert@email.com", category: "Business", expectedContribution: 125000 },
    ];

    const createdWeddingGuests = await Promise.all(
      weddingGuests.map(guest =>
        prisma.guest.create({
          data: {
            id: uuidv4(),
            ...guest,
            eventId: weddingEvent.id,
            notes: "VIP guest",
          },
        })
      )
    );

    const createdBirthdayGuests = await Promise.all(
      birthdayGuests.map(guest =>
        prisma.guest.create({
          data: {
            id: uuidv4(),
            ...guest,
            eventId: birthdayEvent.id,
            notes: "Close friend",
          },
        })
      )
    );

    const createdFundraiserGuests = await Promise.all(
      fundraiserGuests.map(guest =>
        prisma.guest.create({
          data: {
            id: uuidv4(),
            ...guest,
            eventId: fundraisingEvent.id,
            notes: "Major donor",
          },
        })
      )
    );

    console.log("✅ Guests created");

    // ==========================================
    // CONTRIBUTIONS
    // ==========================================
    console.log("Creating contributions...");
    
    const createContributions = async (guests, eventId) => {
      return Promise.all(
        guests.map(guest =>
          prisma.contribution.create({
            data: {
              id: uuidv4(),
              expectedAmount: guest.expectedContribution,
              paidAmount: 0,
              balanceAmount: guest.expectedContribution,
              status: "PENDING",
              contributionLink: `https://royalevents.com/contribute/${uuidv4()}`,
              linkToken: uuidv4(),
              eventId: eventId,
              guestId: guest.id,
            },
          })
        )
      );
    };

    const weddingContributions = await createContributions(createdWeddingGuests, weddingEvent.id);
    const birthdayContributions = await createContributions(createdBirthdayGuests, birthdayEvent.id);
    const fundraiserContributions = await createContributions(createdFundraiserGuests, fundraisingEvent.id);

    console.log("✅ Contributions created");

    // ==========================================
    // INVITATIONS
    // ==========================================
    console.log("Creating invitations...");
    
    const createInvitations = async (guests, eventId) => {
      return Promise.all(
        guests.map(guest =>
          prisma.invitation.create({
            data: {
              id: uuidv4(),
              invitationRef: generateRef("INV"),
              qrToken: uuidv4(),
              smsToken: uuidv4().substring(0, 6).toUpperCase(),
              channel: "BOTH",
              status: "SENT",
              sentAt: new Date(),
              deliveredAt: new Date(),
              eventId: eventId,
              guestId: guest.id,
            },
          })
        )
      );
    };

    const weddingInvitations = await createInvitations(createdWeddingGuests, weddingEvent.id);
    const birthdayInvitations = await createInvitations(createdBirthdayGuests, birthdayEvent.id);
    const fundraiserInvitations = await createInvitations(createdFundraiserGuests, fundraisingEvent.id);

    console.log("✅ Invitations created");

    // ==========================================
    // TRANSACTIONS (some successful payments)
    // ==========================================
    console.log("Creating transactions...");
    
    // Add some successful transactions for wedding
    await prisma.transaction.create({
      data: {
        id: uuidv4(),
        transactionRef: generateRef("TXN"),
        snippeRef: "SNP-" + uuidv4().substring(0, 8),
        amount: 50000,
        paymentMethod: "MPESA",
        status: "SUCCESSFUL",
        paidAt: new Date(),
        eventId: weddingEvent.id,
        guestId: createdWeddingGuests[0].id,
        contributionId: weddingContributions[0].id,
      },
    });

    await prisma.transaction.create({
      data: {
        id: uuidv4(),
        transactionRef: generateRef("TXN"),
        snippeRef: "SNP-" + uuidv4().substring(0, 8),
        amount: 30000,
        paymentMethod: "MPESA",
        status: "SUCCESSFUL",
        paidAt: new Date(),
        eventId: weddingEvent.id,
        guestId: createdWeddingGuests[2].id,
        contributionId: weddingContributions[2].id,
      },
    });

    // Add successful transaction for fundraiser
    await prisma.transaction.create({
      data: {
        id: uuidv4(),
        transactionRef: generateRef("TXN"),
        snippeRef: "SNP-" + uuidv4().substring(0, 8),
        amount: 150000,
        paymentMethod: "BANK_TRANSFER",
        status: "SUCCESSFUL",
        paidAt: new Date(),
        eventId: fundraisingEvent.id,
        guestId: createdFundraiserGuests[1].id,
        contributionId: fundraiserContributions[1].id,
      },
    });

    // Update contribution amounts based on transactions
    await prisma.contribution.update({
      where: { id: weddingContributions[0].id },
      data: { paidAmount: 50000, balanceAmount: 0, status: "PAID" },
    });

    await prisma.contribution.update({
      where: { id: weddingContributions[2].id },
      data: { paidAmount: 30000, balanceAmount: 0, status: "PAID" },
    });

    await prisma.contribution.update({
      where: { id: fundraiserContributions[1].id },
      data: { paidAmount: 150000, balanceAmount: 0, status: "PAID" },
    });

    console.log("✅ Transactions created");

    // ==========================================
    // CHECK-INS (some guests checked in)
    // ==========================================
    console.log("Creating check-ins...");
    
    await prisma.checkIn.create({
      data: {
        id: uuidv4(),
        method: "QR_SCAN",
        checkedInAt: new Date(),
        notes: "Arrived on time",
        eventId: weddingEvent.id,
        guestId: createdWeddingGuests[0].id,
        invitationId: weddingInvitations[0].id,
        staffId: staffUser.id,
      },
    });

    await prisma.checkIn.create({
      data: {
        id: uuidv4(),
        method: "SMS_TOKEN",
        checkedInAt: new Date(),
        notes: "Used SMS token",
        eventId: weddingEvent.id,
        guestId: createdWeddingGuests[2].id,
        invitationId: weddingInvitations[2].id,
        staffId: staffUser.id,
      },
    });

    console.log("✅ Check-ins created");

    // ==========================================
    // NOTIFICATIONS
    // ==========================================
    console.log("Creating notifications...");
    
    await prisma.notification.create({
      data: {
        id: uuidv4(),
        type: "CONTRIBUTION_REQUEST",
        channel: "SMS",
        recipient: createdWeddingGuests[1].phone,
        message: "Please contribute to the wedding event",
        status: "SENT",
        sentAt: new Date(),
        deliveredAt: new Date(),
        eventId: weddingEvent.id,
        guestId: createdWeddingGuests[1].id,
      },
    });

    await prisma.notification.create({
      data: {
        id: uuidv4(),
        type: "EVENT_REMINDER",
        channel: "WHATSAPP",
        recipient: createdBirthdayGuests[0].phone,
        message: "Reminder: Birthday party is tomorrow!",
        status: "SENT",
        sentAt: new Date(),
        deliveredAt: new Date(),
        eventId: birthdayEvent.id,
        guestId: createdBirthdayGuests[0].id,
      },
    });

    console.log("✅ Notifications created");

    // ==========================================
    // REMINDERS
    // ==========================================
    console.log("Creating reminders...");
    
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 7);

    await prisma.reminder.create({
      data: {
        id: uuidv4(),
        type: "CONTRIBUTION_REMINDER",
        scheduledAt: reminderDate,
        status: "PENDING",
        message: "Send contribution reminders",
        eventId: weddingEvent.id,
      },
    });

    await prisma.reminder.create({
      data: {
        id: uuidv4(),
        type: "EVENT_REMINDER",
        scheduledAt: new Date(eventDate1.getTime() - 2 * 24 * 60 * 60 * 1000),
        status: "PENDING",
        message: "Send event reminder 2 days before",
        eventId: weddingEvent.id,
      },
    });

    console.log("✅ Reminders created");

    // ==========================================
    // PAYOUTS
    // ==========================================
    console.log("Creating payouts...");
    
    await prisma.payout.create({
      data: {
        id: uuidv4(),
        amount: 80000,
        fees: 2400,
        serviceFee: 4000,
        netAmount: 73600,
        status: "PENDING",
        notes: "Payout for wedding event contributions",
        eventId: weddingEvent.id,
      },
    });

    console.log("✅ Payouts created");

    // ==========================================
    // AUDIT LOGS
    // ==========================================
    console.log("Creating audit logs...");
    
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        action: "CREATE",
        module: "EVENT",
        details: { eventName: weddingEvent.name },
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0",
        userId: staffUser.id,
        eventId: weddingEvent.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        action: "UPDATE",
        module: "GUEST",
        details: { guestName: createdWeddingGuests[0].name },
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0",
        userId: staffUser.id,
      },
    });

    console.log("✅ Audit logs created");

    console.log("==========================================");
    console.log("✅ Sample data seeded successfully!");
    console.log("==========================================");
    console.log("📊 Summary:");
    console.log(`   - Users: 3 (including super admin)`);
    console.log(`   - Event Owners: 2`);
    console.log(`   - Events: 3 (Wedding, Birthday, Fundraiser)`);
    console.log(`   - Guests: 18`);
    console.log(`   - Contributions: 18`);
    console.log(`   - Invitations: 18`);
    console.log(`   - Transactions: 3`);
    console.log(`   - Check-ins: 2`);
    console.log(`   - Notifications: 2`);
    console.log(`   - Reminders: 2`);
    console.log(`   - Payouts: 1`);
    console.log(`   - Audit Logs: 2`);
    console.log("==========================================");

  } catch (error) {
    console.error("❌ Error seeding sample data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

sampleData();
