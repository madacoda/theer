import amqp from 'amqplib';
import dotenv from 'dotenv';
import { logger } from './logger';

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
      logger.info('🐇 Connected to RabbitMQ');
    }
    
    if (!channel) {
      channel = await connection.createChannel();
      await channel.assertQueue(TICKET_QUEUE, { durable: true });
    }
    
    return { connection, channel };
  } catch (error) {
    logger.error('❌ RabbitMQ Connection Error:', error);
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
    logger.info(`✉️ Job enqueued to ${queue}`);
  } catch (error) {
    logger.error('❌ Failed to enqueue job:', error);
    throw error;
  }
}
