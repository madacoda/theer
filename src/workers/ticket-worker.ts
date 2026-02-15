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

    let ticketId: number | undefined;
    try {
      const content = JSON.parse(msg.content.toString());
      ticketId = content.ticketId;
      
      if (!ticketId) {
        channel.ack(msg);
        return;
      }

      console.log(`📥 Processing ticket triage for ID: ${ticketId}`);

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        console.error(`❌ Ticket ${ticketId} not found`);
        channel.ack(msg);
        return;
      }

      // 1. Check retry count from metadata
      const metadata = (ticket.ai_metadata as any) || {};
      const retryCount = (metadata.retry_count || 0) + 1;

      if (retryCount > 3) {
        console.error(`❌ Max retries reached for ticket ${ticketId}`);
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { 
            status: 'failed_triage',
            ai_metadata: { ...metadata, last_error: 'Max retries exceeded' }
          },
        });
        channel.ack(msg);
        return;
      }

      // 2. Track AI Start
      const startTime = Date.now();

      // 3. Call AI for triage
      const aiResult = await triageTicketAI(ticket.title, ticket.content || '');
      
      const processingTime = Date.now() - startTime;
      console.log(`🧠 AI Triage completed for Ticket: ${ticketId} in ${processingTime}ms`);

      // 4. Find or create the category suggested by AI
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

      // 5. Update ticket in database with detailed audit metadata
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          sentiment_score: aiResult.sentiment_score,
          urgency: aiResult.urgency,
          ai_draft: aiResult.draft,
          category_id: categoryId,
          status: 'processed',
          ai_metadata: {
            ...metadata,
            processing_time_ms: processingTime,
            ai_suggested_category: aiResult.category,
            retries: retryCount,
            last_triage_at: new Date().toISOString(),
          },
        },
      });

      console.log(`✅ Ticket ${ticketId} updated with AI results`);
      channel.ack(msg);
    } catch (error) {
      console.error(`❌ Worker error for ticket ${ticketId}:`, error);
      
      // If we have a ticketId, we should probably update its retry count in the DB
      if (ticketId) {
        try {
          const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
          if (ticket) {
            const metadata = (ticket.ai_metadata as any) || {};
            await prisma.ticket.update({
              where: { id: ticketId },
              data: {
                ai_metadata: {
                  ...metadata,
                  retry_count: (metadata.retry_count || 0) + 1,
                  last_error: error instanceof Error ? error.message : String(error)
                }
              }
            });
          }
        } catch (dbError) {
          console.error('Failed to update retry count in DB', dbError);
        }
      }

      // Re-queue the message
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
