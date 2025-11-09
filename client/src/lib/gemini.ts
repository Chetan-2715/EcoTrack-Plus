// IMPORTANT: This is a client-side implementation for demonstration purposes.
// Exposing API keys on the client-side is a significant security risk.
// In a production environment, you should always handle API calls through a secure backend server
// to protect your API key.

import { GoogleGenerativeAI } from "@google/generative-ai";

// Access the API key from environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Gemini API key is missing. Make sure to set it in your .env file.");
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export const sendMessageToGemini = async (message: string) => {
  // Check for greeting
  if (message.toLowerCase().includes('hi') || message.toLowerCase().includes('hello') || message.toLowerCase().includes('hey')) {
    return "Welcome! I will help you get answers for queries related to the actions in the home page.";
  }

  // Check for public transport query
  const transportRegex = /(?:travel|traveled|travelled|traveling|travelling|commute|commuting|public transport|bus|train|metro|subway|transit)/i;
  const distanceMatch = message.match(/(\d+)\s*(km|kilometer|kilometre)/i);
  
  if (transportRegex.test(message) && distanceMatch) {
    const distance = parseFloat(distanceMatch[1]);
    if (!isNaN(distance)) {
      // Calculate carbon emissions
      const carEmission = distance * 0.192; // kg CO2 per km for average car
      const publicTransportEmission = distance * 0.105; // kg CO2 per km for public transport
      const savedEmission = carEmission - publicTransportEmission;
      
      return `By traveling ${distance}km using public transport instead of a personal vehicle, you saved approximately ${savedEmission.toFixed(2)} kg of CO2 emissions!`;
    }
  }

  // Check if the message is related to app's features
  const appRelatedKeywords = ['recycle', 'public transport', 'water', 'tree', 'carbon', 'emission', 'save', 'saving', 'eco', 'environment'];
  const isAppRelated = appRelatedKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );

  if (!isAppRelated) {
    return "I can only answer queries related to the actions shown in the home page and the carbon amount you saved using these actions.";
  }

  // If it's related to app features but not handled above, use Gemini
  const prompt = `
    You are EcoTrack+ AI, a helpful assistant for the EcoTrack+ application, powered by Gemini.
    Your purpose is to answer user questions about their eco-friendly actions and carbon savings.
    
    The app tracks these actions:
    - Recycling items
    - Using public transport
    - Saving water
    - Planting trees

    Keep your responses concise and focused on environmental impact and carbon savings.
    If the question is not directly about these topics, say: "I can only help with questions about eco-friendly actions and carbon savings."

    User's question: "${message}"
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    return "Sorry, I'm having trouble connecting to the AI service right now.";
  }
};
