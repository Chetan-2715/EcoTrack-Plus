import { GoogleGenerativeAI } from "@google/generative-ai";

// Access the API key from environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("Gemini API key is missing. Make sure to set VITE_GEMINI_API_KEY in your .env file.");
  // Don't throw error, handle it gracefully
}

let model: any = null;

try {
  if (apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 250, // Reduced from 500 to save resources
      },
    });
  }
} catch (error) {
  console.error("Error initializing Gemini model:", error);
}

export const sendMessageToGemini = async (message: string) => {
  if (!model) {
    console.error("Gemini model not initialized. Please check your API key and connection.");
    return "I'm having trouble connecting to the AI service right now. Please check your internet connection and try again later.";
  }

  const prompt = `You are EcoTrack+ AI, an expert assistant focused on environmental sustainability and carbon footprint reduction.
  
  Your role is to help users understand and track their eco-friendly actions in these four categories:
  1. Recycling (paper, plastic, glass, etc.)
  2. Using public transport (buses, trains, subways, etc.)
  3. Water conservation (reducing usage, fixing leaks, etc.)
  4. Tree planting and maintenance

  Guidelines for responses:
  - Keep responses under 100 words
  - Use simple, clear language
  - Focus on practical environmental impact
  - If asked about unrelated topics, respond with: "I can help you with questions about recycling, public transport, water conservation, or tree planting."

  User's message: "${message}"`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return text || "I'm not sure how to respond to that. Could you ask me about recycling, public transport, water conservation, or tree planting?";
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    // More specific error handling
    if (error.message.includes('quota')) {
      return "I've reached my usage limit. Please try again later or check your API quota.";
    } else if (error.message.includes('network')) {
      return "I'm having trouble connecting to the AI service. Please check your internet connection.";
    }
    return "I'm having trouble processing your request. Please try again later.";
  }
};
