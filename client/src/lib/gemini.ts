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
      model: "gemini-pro-latest",
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

  const prompt = `
    You are EcoTrack+ AI, a helpful and encouraging assistant for the EcoTrack+ application.
    Your purpose is to answer user questions OR respond to user statements about their eco-friendly actions and carbon savings.
    
    The app tracks four main actions:
    1.  **Recycling items**
    2.  **Using public transport**
    3.  **Saving water**
    4.  **Planting trees**

    **Your Task:**
    - If the user asks a question about *why* these actions are good (e.g., "Why is saving water important?"), give a concise, encouraging answer about its environmental impact.
    - If the user makes a statement about *performing* an action (e.g., "I planted 3 trees" or "I recycled a bottle"), you MUST respond with positive reinforcement and a simple, encouraging fact about that action.
    - If the user asks a question you can't answer (e.g., about politics or a random topic), politely decline with a message like "I can only help with questions about eco-friendly actions."

    **Example Responses:**
    - User: "I planted 3 trees in my backyard."
    - You: "That's fantastic! Planting trees is one of the best ways to fight climate change. Just three trees can absorb a significant amount of CO2 every year!"
    - User: "Why is recycling good?"
    - You: "Recycling is great because it saves energy and resources. For example, recycling one aluminum can saves enough energy to power a TV for 3 hours!"
    - User: "I saved water today."
    - You: "Awesome! Every drop counts. Saving water helps protect our local rivers and wildlife."
    
    Keep your responses concise (2-3 sentences) and positive.

    User's message: "${message}"`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return text || "I'm not sure how to respond to that. Could you ask me about recycling, public transport, water conservation, or tree planting?";
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    // More specific error handling (safely handle unknown)
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : (() => {
            try {
              return JSON.stringify(error);
            } catch {
              return '';
            }
          })();

    if (message.includes('quota')) {
      return "I've reached my usage limit. Please try again later or check your API quota.";
    } else if (message.includes('network')) {
      return "I'm having trouble connecting to the AI service. Please check your internet connection.";
    }
    return "I'm having trouble processing your request. Please try again later.";
  }
};
