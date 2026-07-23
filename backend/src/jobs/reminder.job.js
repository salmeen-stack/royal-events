  
import cron from "node-cron";
import prisma from "../config/prisma.js";
import { sendContributionReminderSMS, sendEventReminderSMS } from "../services/sms.service.js";
import { sendWhatsAppEventReminder } from "../services/whatsapp.service.js";

// ==========================================
// CALCULATE DAYS UNTIL EVENT
// ==========================================

const getDaysUntilEvent = (eventDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const event = new Date(eventDate);
  event.setHours(0, 0, 0, 0);
  const diffTime = event.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ==========================================
// CONTRIBUTION REMINDER JOB
// Runs every day at 9:00 AM
// ==========================================

export const startContributionReminderJob = () => {
  cron.schedule("0 9 * * *", async () => {
    console.log("🔔 Running contribution reminder job...");

    try {
      // Get all active events with pending contributions
      const activeEvents = await prisma.event.findMany({
        where: {
          status: "ACTIVE",
          contributionDeadline: {
            gte: new Date(),
          },
        },
      });

      for (const event of activeEvents) {
        const pendingContributions = await prisma.contribution.findMany({
          where: {
            eventId: event.id,
            status: { in: ["PENDING", "PARTIAL"] },
          },
          include: { guest: true },
        });

        for (const contribution of pendingContributions) {
          await sendContributionReminderSMS({
            guest: contribution.guest,
            event,
            contributionLink: contribution.contributionLink,
            balanceAmount: contribution.balanceAmount,
          });

          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        if (pendingContributions.length > 0) {
          await prisma.reminder.create({
            data: {
              eventId: event.id,
              type: "CONTRIBUTION_REMINDER",
              scheduledAt: new Date(),
              sentAt: new Date(),
              status: "SENT",
              message: `Auto contribution reminder sent to ${pendingContributions.length} guests.`,
            },
          });

          console.log(
            `✅ Contribution reminders sent for event: ${event.name} - ${pendingContributions.length} guests`
          );
        }
      }

    } catch (error) {
      console.error("❌ Contribution reminder job error:", error);
    }
  });

  console.log("✅ Contribution reminder job scheduled - runs daily at 9:00 AM");
};

// ==========================================
// EVENT REMINDER JOB
// Runs every day at 8:00 AM
// Sends reminders 7 days, 1 day, and on event day
// ==========================================

export const startEventReminderJob = () => {
  cron.schedule("0 8 * * *", async () => {
    console.log("🔔 Running event reminder job...");

    try {
      const activeEvents = await prisma.event.findMany({
        where: {
          status: "ACTIVE",
          eventDate: {
            gte: new Date(),
          },
        },
      });

      for (const event of activeEvents) {
        const daysUntilEvent = getDaysUntilEvent(event.eventDate);

        // Only send on specific days
        if (![7, 1, 0].includes(daysUntilEvent)) continue;

        // Get all guests with sent invitations
        const invitations = await prisma.invitation.findMany({
          where: {
            eventId: event.id,
            status: { in: ["SENT", "DELIVERED"] },
          },
          include: { guest: true },
        });

        if (invitations.length === 0) continue;

        let successCount = 0;

        for (const invitation of invitations) {
          let result;

          if (
            invitation.channel === "WHATSAPP" ||
            invitation.channel === "BOTH"
          ) {
            result = await sendWhatsAppEventReminder({
              guest: invitation.guest,
              event,
              daysUntilEvent,
            });
          } else {
            result = await sendEventReminderSMS({
              guest: invitation.guest,
              event,
              daysUntilEvent,
            });
          }

          if (result.success) successCount++;

          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        await prisma.reminder.create({
          data: {
            eventId: event.id,
            type: "EVENT_REMINDER",
            scheduledAt: new Date(),
            sentAt: new Date(),
            status: "SENT",
            message: `Auto event reminder sent to ${successCount} guests. ${daysUntilEvent} days until event.`,
          },
        });

        console.log(
          `✅ Event reminders sent for: ${event.name} - ${successCount} guests - ${daysUntilEvent} days to go`
        );
      }

    } catch (error) {
      console.error("❌ Event reminder job error:", error);
    }
  });

  console.log("✅ Event reminder job scheduled - runs daily at 8:00 AM");
};

// ==========================================
// OVERDUE CONTRIBUTION JOB
// Runs every day at 10:00 AM
// Marks contributions as OVERDUE after deadline
// ==========================================

export const startOverdueContributionJob = () => {
  cron.schedule("0 10 * * *", async () => {
    console.log("🔔 Running overdue contribution job...");

    try {
      const now = new Date();

      // Find events with passed contribution deadline
      const eventsWithDeadline = await prisma.event.findMany({
        where: {
          status: "ACTIVE",
          contributionDeadline: {
            lt: now,
          },
        },
      });

      for (const event of eventsWithDeadline) {
        const updatedCount = await prisma.contribution.updateMany({
          where: {
            eventId: event.id,
            status: "PENDING",
          },
          data: {
            status: "OVERDUE",
          },
        });

        if (updatedCount.count > 0) {
          console.log(
            `✅ Marked ${updatedCount.count} contributions as OVERDUE for event: ${event.name}`
          );
        }
      }

    } catch (error) {
      console.error("❌ Overdue contribution job error:", error);
    }
  });

  console.log("✅ Overdue contribution job scheduled - runs daily at 10:00 AM");
};

// ==========================================
// EVENT STATUS UPDATE JOB
// Runs every day at midnight
// Marks events as COMPLETED after event date
// ==========================================

export const startEventStatusUpdateJob = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("🔔 Running event status update job...");

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const updatedEvents = await prisma.event.updateMany({
        where: {
          status: "ACTIVE",
          eventDate: {
            lt: yesterday,
          },
        },
        data: {
          status: "COMPLETED",
        },
      });

      if (updatedEvents.count > 0) {
        console.log(`✅ Marked ${updatedEvents.count} events as COMPLETED`);
      }

    } catch (error) {
      console.error("❌ Event status update job error:", error);
    }
  });

  console.log("✅ Event status update job scheduled - runs daily at midnight");
};

// ==========================================
// START ALL JOBS
// ==========================================

export const startAllJobs = () => {
  console.log("==========================================");
  console.log("🔔 Starting background jobs...");
  console.log("==========================================");

  startContributionReminderJob();
  startEventReminderJob();
  startOverdueContributionJob();
  startEventStatusUpdateJob();

  console.log("==========================================");
  console.log("✅ All background jobs started");
  console.log("==========================================");
};