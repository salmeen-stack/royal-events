  
import cron from "node-cron";
import prisma from "../config/prisma.js";
import { sendContributionReminderSMS, sendEventReminderSMS } from "../services/sms.service.js";
import { sendWhatsAppEventReminder, checkWhatsAppNumber, sendWhatsAppMessage } from "../services/whatsapp.service.js";

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
          // Check if guest phone is on WhatsApp
          try {
            const whatsappCheck = await checkWhatsAppNumber(contribution.guest.phone);
            
            if (whatsappCheck.isOnWhatsApp) {
              // Send via WhatsApp
              const eventDate = new Date(event.eventDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });

              const message =
                `Hello *${contribution.guest.name}*,\n\n` +
                `You have been invited to support:\n\n` +
                `📌 *${event.name}*\n\n` +
                `Please use the link below to make your contribution:\n` +
                `${contribution.contributionLink}\n\n` +
                `Thank you for your support. 🙏`;

              await sendWhatsAppMessage({
                to: contribution.guest.phone,
                message,
                eventId: event.id,
                guestId: contribution.guest.id,
                type: "CONTRIBUTION_REQUEST",
              });
            } else {
              // Fallback to SMS
              await sendContributionReminderSMS({
                guest: contribution.guest,
                event,
                contributionLink: contribution.contributionLink,
                balanceAmount: contribution.balanceAmount,
              });
            }
          } catch (error) {
            // WhatsApp check failed, fallback to SMS
            console.error("WhatsApp check failed for contribution reminder, using SMS:", error.message);
            await sendContributionReminderSMS({
              guest: contribution.guest,
              event,
              contributionLink: contribution.contributionLink,
              balanceAmount: contribution.balanceAmount,
            });
          }

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

          // Check if guest phone is on WhatsApp
          try {
            const whatsappCheck = await checkWhatsAppNumber(invitation.guest.phone);
            
            if (whatsappCheck.isOnWhatsApp) {
              // Send via WhatsApp
              result = await sendWhatsAppEventReminder({
                guest: invitation.guest,
                event,
                daysUntilEvent,
              });
            } else {
              // Fallback to SMS
              result = await sendEventReminderSMS({
                guest: invitation.guest,
                event,
                daysUntilEvent,
              });
            }
          } catch (error) {
            // WhatsApp check failed, fallback to SMS
            console.error("WhatsApp check failed for event reminder, using SMS:", error.message);
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
// PENDING REMINDER JOB
// Runs every minute to check for pending reminders
// ==========================================

export const startPendingReminderJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // Find pending reminders that are due (scheduledAt <= now)
      // Use a transaction to prevent duplicate processing
      const pendingReminders = await prisma.reminder.findMany({
        where: {
          status: "PENDING",
          scheduledAt: {
            lte: now,
          },
        },
        include: {
          event: true,
        },
      });

      if (pendingReminders.length === 0) return;

      for (const reminder of pendingReminders) {
        try {
          // Mark as PROCESSING immediately to prevent duplicate processing
          const updated = await prisma.reminder.updateMany({
            where: {
              id: reminder.id,
              status: "PENDING",
            },
            data: {
              status: "PROCESSING",
            },
          });

          // If another job already started processing this, skip it
          if (updated.count === 0) {
            console.log(`⏭️ Skipping reminder ${reminder.id} - already being processed`);
            continue;
          }

          console.log(`🔔 Processing reminder ${reminder.id} of type ${reminder.type}`);

          if (reminder.type === "EVENT_REMINDER") {
            const daysUntilEvent = getDaysUntilEvent(reminder.event.eventDate);
            
            // Get all guests for this event (both invitation and reminder-only)
            const guests = await prisma.guest.findMany({
              where: {
                eventId: reminder.event.id,
              },
            });

            let successCount = 0;
            let failedCount = 0;

            for (const guest of guests) {
              try {
                const result = await sendEventReminderSMS({
                  guest,
                  event: reminder.event,
                  daysUntilEvent,
                });
                if (result.success) {
                  successCount++;
                } else {
                  failedCount++;
                  console.error(`❌ Failed to send to ${guest.name}:`, result.error);
                }
                await new Promise((resolve) => setTimeout(resolve, 200));
              } catch (err) {
                failedCount++;
                console.error(`❌ Error sending to ${guest.name}:`, err.message);
              }
            }

            await prisma.reminder.update({
              where: { id: reminder.id },
              data: {
                status: "SENT",
                sentAt: new Date(),
                message: `Event reminder sent to ${successCount} guests, ${failedCount} failed.`,
              },
            });

            console.log(`✅ Sent reminder ${reminder.id} - ${successCount} successful, ${failedCount} failed`);

          } else if (reminder.type === "CONTRIBUTION_REMINDER") {
            const contributions = await prisma.contribution.findMany({
              where: {
                eventId: reminder.event.id,
                status: { in: ["PENDING", "PARTIAL"] },
              },
              include: { guest: true },
            });

            let successCount = 0;
            let failedCount = 0;

            for (const contribution of contributions) {
              try {
                const result = await sendContributionReminderSMS({
                  guest: contribution.guest,
                  event: reminder.event,
                  contributionLink: contribution.contributionLink,
                  balanceAmount: contribution.balanceAmount,
                });
                if (result.success) {
                  successCount++;
                } else {
                  failedCount++;
                  console.error(`❌ Failed to send to ${contribution.guest.name}:`, result.error);
                }
                await new Promise((resolve) => setTimeout(resolve, 200));
              } catch (err) {
                failedCount++;
                console.error(`❌ Error sending to ${contribution.guest.name}:`, err.message);
              }
            }

            await prisma.reminder.update({
              where: { id: reminder.id },
              data: {
                status: "SENT",
                sentAt: new Date(),
                message: `Contribution reminder sent to ${successCount} guests, ${failedCount} failed.`,
              },
            });

            console.log(`✅ Sent reminder ${reminder.id} - ${successCount} successful, ${failedCount} failed`);

          } else if (reminder.type === "CHECKIN_REMINDER") {
            // Get all checked-in guests
            const checkins = await prisma.checkin.findMany({
              where: {
                eventId: reminder.event.id,
              },
              include: { guest: true },
            });

            let successCount = 0;
            let failedCount = 0;

            for (const checkin of checkins) {
              try {
                // Send thank you SMS
                const result = await sendEventReminderSMS({
                  guest: checkin.guest,
                  event: reminder.event,
                  daysUntilEvent: 0,
                });
                if (result.success) {
                  successCount++;
                } else {
                  failedCount++;
                  console.error(`❌ Failed to send to ${checkin.guest.name}:`, result.error);
                }
                await new Promise((resolve) => setTimeout(resolve, 200));
              } catch (err) {
                failedCount++;
                console.error(`❌ Error sending to ${checkin.guest.name}:`, err.message);
              }
            }

            await prisma.reminder.update({
              where: { id: reminder.id },
              data: {
                status: "SENT",
                sentAt: new Date(),
                message: `Check-in reminder sent to ${successCount} guests, ${failedCount} failed.`,
              },
            });

            console.log(`✅ Sent reminder ${reminder.id} - ${successCount} successful, ${failedCount} failed`);
          }
        } catch (error) {
          console.error(`❌ Error processing reminder ${reminder.id}:`, error);
          // Only mark as failed if it's not a database connection error
          // Database errors should be retried on next run
          if (!error.message.includes('ETIMEDOUT') && !error.message.includes('WebSocket')) {
            try {
              await prisma.reminder.update({
                where: { id: reminder.id },
                data: {
                  status: "FAILED",
                  message: error.message,
                },
              });
            } catch (dbError) {
              console.error(`❌ Failed to mark reminder as failed:`, dbError.message);
            }
          } else {
            // Revert to PENDING for database connection errors so it can be retried
            try {
              await prisma.reminder.update({
                where: { id: reminder.id },
                data: {
                  status: "PENDING",
                },
              });
            } catch (dbError) {
              console.error(`❌ Failed to revert reminder to PENDING:`, dbError.message);
            }
          }
        }
      }
    } catch (error) {
      console.error("❌ Pending reminder job error:", error);
      // Don't crash the job on database errors, just log and continue
      if (error.message.includes('ETIMEDOUT') || error.message.includes('WebSocket')) {
        console.log("⚠️ Database connection timeout - will retry on next run");
      }
    }
  });

  console.log("✅ Pending reminder job scheduled - runs every minute");
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
  startPendingReminderJob();

  console.log("==========================================");
  console.log("✅ All background jobs started");
  console.log("==========================================");
};