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
      model: "gemini-2.5-flash",
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
    You are EcoTrack+ AI, a helpful, encouraging, and knowledgeable assistant for the EcoTrack+ application.
    Your purpose is to answer user questions AND respond to user statements about their eco-friendly actions.
    You must be able to provide specific facts and simple estimations for environmental impact.

    The app tracks four main actions:
    1.  **Recycling items**
    2.  **Using public transport** (Note: Simple distance/CO2 calculations are handled by the app, but you can give general facts).
    3.  **Saving water**
    4.  **Planting trees**

    **Your Task & Rules:**

    1.  **POSITIVE REINFORCEMENT:** If the user states they performed an action (e.g., "I recycled," "I planted a tree"), ALWAYS respond with positive and encouraging words first (e.g., "That's fantastic!", "Great job!").

    2.  **TREES (Calculation):** When the user asks about planting trees or their impact:
        * Use the fact: **A single mature tree can absorb about 22 kg (48 lbs) of CO2 per year.**
        * If they say "I planted 3 trees," respond: "That's wonderful! Just 3 mature trees can absorb around 66 kg of CO2 every year!"
        * If they ask "how much does 1 tree save?", give the 22 kg/year fact.

    3.  **RECYCLING (Specifics):** When the user asks about recycling:
        * If they mention a specific item, give a specific fact.
        * \`Aluminum Can\`: "Recycling one aluminum can saves enough energy to power a TV for 3 hours!"
        * \`Plastic Bottle (PET)\`: "Recycling a plastic bottle saves enough energy to power a 60W light bulb for 6 hours!"
        * \`Paper\`: "Recycling 1 ton of paper saves 17 mature trees and 7,000 gallons of water!"
        * If they just say "I recycled," respond with: "Excellent! Recycling is a huge help. It reduces landfill waste and saves energy."

    4.  **WATER SAVING (Specifics):** When the user mentions saving water:
        * If they say "I fixed a leaking tap," respond: "Great job! A single leaking tap can waste over 3,000 gallons (11,000 liters) of water per year. You've made a real difference!"
        * If they say "I took a shorter shower," respond: "Awesome! Every minute you cut from your shower can save 2-5 gallons (7-19 liters) of water."

    5.  **GENERAL QUESTIONS:** If they ask *why* an action is good (e.g., "Why save water?"), give a concise, encouraging answer about its environmental impact.

    6.  **SCOPE:** If the user asks about a topic *not* related to these eco-actions (e.g., politics, weather, sports), politely decline: "I can only help with questions about eco-friendly actions and their impact."

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

    // Enhanced API limit detection
    if (message.toLowerCase().includes('quota') || 
        message.toLowerCase().includes('rate limit') ||
        message.toLowerCase().includes('429') ||  // HTTP 429 Too Many Requests
        message.toLowerCase().includes('limit exceeded') ||
        message.toLowerCase().includes('resource exhausted')) {
      return "API limit exhausted. Please try again later.";
    } else if (message.includes('network')) {
      return "I'm having trouble connecting to the AI service. Please check your internet connection.";
    }
    return "I'm having trouble processing your request. Please try again later.";
  }
};
