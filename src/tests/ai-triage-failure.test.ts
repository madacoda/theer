import { jest, describe, it, expect } from '@jest/globals';
import { AI_FAILURE_DRAFT, triageTicketAI } from '../utils/ai';
import { TicketResource } from '../api/resources/ticket-resource';

// Mock process.env
const originalEnv = process.env;

describe('AI Triage Failure Logic', () => {
  describe('AI Utility (triageTicketAI)', () => {
    it('should return AI_FAILURE_DRAFT when GEMINI_API_KEY is missing', async () => {
      // Simulate missing API key
      process.env.GEMINI_API_KEY = '';
      
      const result = await triageTicketAI('Test Title', 'Test Content');
      
      expect(result.draft).toBe(AI_FAILURE_DRAFT);
      expect(result.sentiment_score).toBe(5);
    });
  });

  describe('Ticket Resource Transformation', () => {
    it('should set is_ai_triage_failed to true if ai_draft matches AI_FAILURE_DRAFT', () => {
      const mockTicket = {
        id: 1,
        title: 'Broken App',
        content: 'Help me',
        status: 'processed',
        is_ai_triage_failed: false, // Even if DB says false
        ai_draft: AI_FAILURE_DRAFT,
        category: null,
        created_by: null,
        resolved_by: null,
        resolved_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = TicketResource.transform(mockTicket, true); // true for isAdmin
      
      expect(result.is_ai_triage_failed).toBe(true);
      expect(result.ai_draft).toBe('AI Triage Failed. Human intervention required. Please provide a response manually.');
    });

    it('should set is_ai_triage_failed to true if ai_draft is a generic placeholder', () => {
      const mockTicket = {
        title: 'Broken App',
        status: 'processed',
        is_ai_triage_failed: false, 
        ai_draft: 'Thank you for contacting us. We have received your ticket and our team will get back to you shortly.',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = TicketResource.transform(mockTicket, true);
      
      expect(result.is_ai_triage_failed).toBe(true);
      // It should also have been replaced with the official failure message for the UI
      expect(result.ai_draft).toBe('AI Triage Failed. Human intervention required. Please provide a response manually.');
    });

    it('should set is_ai_triage_failed to true if DB flag is true', () => {
      const mockTicket = {
        title: 'Broken App',
        status: 'processed',
        is_ai_triage_failed: true,
        ai_draft: 'Some real draft',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = TicketResource.transform(mockTicket, true);
      
      expect(result.is_ai_triage_failed).toBe(true);
    });

    it('should set is_ai_triage_failed to false only if DB is false AND draft is NOT failure constant', () => {
      const mockTicket = {
        title: 'Broken App',
        status: 'processed',
        is_ai_triage_failed: false,
        ai_draft: 'This is a context-aware draft that is long enough.',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = TicketResource.transform(mockTicket, true);
      
      expect(result.is_ai_triage_failed).toBe(false);
    });
  });
});
