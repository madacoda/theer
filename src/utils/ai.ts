import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface AIResult {
  category: string;
  sentiment_score: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  draft: string;
}

/**
 * Call Gemini AI to triage a ticket
 */
export async function triageTicketAI(title: string, content: string): Promise<AIResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are a professional support ticket triager.
      Analyze the following support ticket and provide a structured response.
      
      Ticket Title: ${title}
      Ticket Content: ${content}

      Return ONLY a JSON object with the following fields:
      - category: One of "Billing", "Technical", "Feature Request"
      - sentiment_score: A whole number between 1 (extremely frustrated) and 10 (extremely happy)
      - urgency: One of "High", "Medium", "Low"
      - draft: A polite, context-aware, and empathetic starting draft response for the support agent

      JSON Response:
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Clean up the response if it contains markdown formatting
    const jsonString = text.replace(/```json|```/g, '').trim();
    
    return JSON.parse(jsonString) as AIResult;
  } catch (error) {
    console.error('❌ AI Triage Error:', error);
    // Fallback default result
    return {
      category: 'Uncategorized',
      sentiment_score: 0,
      urgency: 'medium',
      draft: 'Thank you for your message. We have received your ticket and our team will get back to you shortly.',
    };
  }
}
