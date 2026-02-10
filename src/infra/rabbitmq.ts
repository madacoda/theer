import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
export const TICKET_QUEUE = 'triage-ticket';

let connection: any;
let channel: any;

/**
 * Initialize RabbitMQ connection and channel
 */
export async function initRabbitMQ() {
  try {
    if (!connection) {
      connection = await amqp.connect(RABBITMQ_URL);
      console.log('🐇 Connected to RabbitMQ');
    }
    
    if (!channel) {
      channel = await connection.createChannel();
      await channel.assertQueue(TICKET_QUEUE, { durable: true });
    }
    
    return { connection, channel };
  } catch (error) {
    console.error('❌ RabbitMQ Connection Error:', error);
    throw error;
  }
}

/**
 * Enqueue a job to RabbitMQ
 */
export async function enqueueJob(queue: string, data: any) {
  try {
    const { channel } = await initRabbitMQ();
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
      persistent: true,
    });
    console.log(`✉️ Job enqueued to ${queue}`);
  } catch (error) {
    console.error('❌ Failed to enqueue job:', error);
    throw error;
  }
}
