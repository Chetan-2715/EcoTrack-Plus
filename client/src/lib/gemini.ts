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
  const prompt = `
    You are EcoTrack+ AI, a helpful assistant for the EcoTrack+ application, powered by Gemini.
    Your purpose is to answer user questions about their eco-friendly actions and carbon savings based on the features available in the app.
    The app tracks the following actions:
    - Recycling items
    - Using public transport
    - Saving water
    - Planting trees

    When a user asks about carbon savings from public transport, use this formula:
    Carbon Saved (in kg) = Distance (in km) * 0.12
    For example, if a user travels 25km, the carbon saved is 25 * 0.12 = 3 kg.

    Here are your rules:
    1.  If the user's question is related to the app's actions or calculating carbon savings as described, provide a direct and helpful answer.
    2.  If the user asks a question NOT related to the app's features (e.g., "what is the capital of France?", "write me a poem", etc.), you MUST politely decline and state your purpose. Your response should be: "I can only answer queries related to the actions shown in the home page and the carbon amount you saved using these actions."
    3.  Keep your answers concise and to the point.

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
