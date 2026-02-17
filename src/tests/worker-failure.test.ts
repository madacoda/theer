import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { startTicketWorker } from '../workers/ticket-worker';
import { AI_FAILURE_DRAFT, triageTicketAI } from '../utils/ai';
import prisma from '../infra/db';
import { initRabbitMQ, TICKET_QUEUE } from '../infra/rabbitmq';

// Mock everything 
jest.mock('../infra/db', () => ({
  __esModule: true,
  default: {
    ticket: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    ticketCategory: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../infra/rabbitmq', () => ({
  __esModule: true,
  initRabbitMQ: jest.fn(),
  TICKET_QUEUE: 'test-queue',
}));

jest.mock('../utils/ai', () => ({
  __esModule: true,
  triageTicketAI: jest.fn(),
  AI_FAILURE_DRAFT: 'AI_TRIAGE_FAILED_HUMAN_INTERVENTION_REQUIRED',
}));

const mockedPrisma = prisma as any;
const mockedAI = triageTicketAI as jest.Mock;
const mockedRabbit = initRabbitMQ as jest.Mock;

describe('TicketWorker Failure Handling', () => {
  let channelMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    channelMock = {
      consume: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn(),
    };
    mockedRabbit.mockResolvedValue({ channel: channelMock });
  });

  it('should set is_ai_triage_failed to true when AI returns fallback draft', async () => {
    // 1. Setup mocks
    const mockTicket = {
      id: 123,
      title: 'Problem',
      content: 'Help',
      ai_metadata: {},
      is_ai_triage_failed: true,
    };
    mockedPrisma.ticket.findUnique.mockResolvedValue(mockTicket);
    mockedPrisma.ticketCategory.findFirst.mockResolvedValue({ id: 1, title: 'Technical' });
    
    // Simulate AI Failure (returning fallback)
    mockedAI.mockResolvedValue({
      category: 'Technical',
      sentiment_score: 5,
      urgency: 'Low',
      draft: AI_FAILURE_DRAFT,
    });

    // 2. Start worker and capture the callback
    await startTicketWorker();
    const consumeCallback = channelMock.consume.mock.calls[0][1];

    // 3. Simulate a message
    const msg = {
      content: Buffer.from(JSON.stringify({ ticketId: 123 })),
    };
    await consumeCallback(msg);

    // 4. Verify DB update
    expect(mockedPrisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 123 },
      data: expect.objectContaining({
        is_ai_triage_failed: true, // MUST BE TRUE
        ai_draft: AI_FAILURE_DRAFT,
      })
    }));
  });

  it('should set is_ai_triage_failed to false when AI returns a real draft', async () => {
    // 1. Setup mocks
    const mockTicket = { id: 123, title: 'Problem', content: 'Help' };
    mockedPrisma.ticket.findUnique.mockResolvedValue(mockTicket);
    mockedPrisma.ticketCategory.findFirst.mockResolvedValue({ id: 1, title: 'Technical' });
    
    // Simulate AI Success
    mockedAI.mockResolvedValue({
      category: 'Technical',
      sentiment_score: 8,
      urgency: 'Medium',
      draft: 'We have analyzed your technical issue and our engineering team is already working on a permanent fix for you.', 
    });

    // 2. Start worker
    await startTicketWorker();
    const consumeCallback = channelMock.consume.mock.calls[0][1];

    // 3. Simulate message
    const msg = { content: Buffer.from(JSON.stringify({ ticketId: 123 })) };
    await consumeCallback(msg);

    // 4. Verify DB update
    expect(mockedPrisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 123 },
      data: expect.objectContaining({
        is_ai_triage_failed: false, // MUST BE FALSE on real response
        ai_draft: 'We will fix your problem!',
      })
    }));
  });
});
