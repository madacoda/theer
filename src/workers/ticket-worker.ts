import prisma from '../infra/db';
import { initRabbitMQ, TICKET_QUEUE } from '../infra/rabbitmq';
import { triageTicketAI } from '../utils/ai';

/**
 * Start the Ticket AI Worker
 */
export async function startTicketWorker() {
  console.log('🤖 Starting AI Ticket Worker...');
  
  const { channel } = await initRabbitMQ();
  
  channel.consume(TICKET_QUEUE, async (msg) => {
    if (!msg) return;

    try {
      const { ticketId } = JSON.parse(msg.content.toString());
      console.log(`📥 Processing ticket triage for ID: ${ticketId}`);

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        console.error(`❌ Ticket ${ticketId} not found`);
        channel.ack(msg);
        return;
      }

      // Call AI for triage
      const aiResult = await triageTicketAI(ticket.title, ticket.content || '');
      console.log(`🧠 AI Triage completed for Ticket: ${ticketId}`);

      // 1. Find or create the category suggested by AI
      let categoryId = ticket.category_id;
      if (aiResult.category) {
        let category = await prisma.ticketCategory.findFirst({
          where: { title: { equals: aiResult.category, mode: 'insensitive' } },
        });

        if (!category) {
          category = await prisma.ticketCategory.create({
            data: { title: aiResult.category },
          });
        }
        categoryId = category.id;
      }

      // 2. Update ticket in database
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          sentiment_score: aiResult.sentiment_score,
          urgency: aiResult.urgency,
          ai_draft: aiResult.draft,
          category_id: categoryId,
          status: 'processed',
        },
      });

      console.log(`✅ Ticket ${ticketId} updated with AI results`);
      channel.ack(msg);
    } catch (error) {
      console.error('❌ Worker error:', error);
      // Optional: Nack with requeue if temporary error
      channel.nack(msg, false, true); 
    }
  }, { noAck: false });
}

// If this file is run directly
if (import.meta.main) {
  startTicketWorker().catch(error => {
    console.error('🚨 Fatal Worker Error:', error);
    process.exit(1);
  });
}
