const { GoogleGenerativeAI } = require('@google/generative-ai');
const { OpenAI } = require('openai');

// Initialize both SDKs
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The Master Prompt - Works for both models
const SYSTEM_PROMPT = `
You are a financial parsing assistant. Extract transaction details from the user's text.
Respond ONLY with a valid JSON object matching this exact structure:
{
  "description": "Short, clean description (e.g., 'Uber Ride', 'Groceries')",
  "amount": number (absolute value, no currency symbols),
  "type": "expense" or "income",
  "category": "Suggest a generic category like 'Transport', 'Food', 'Entertainment', 'Income', 'Other'"
}
Do not include any extra text or markdown formatting.
`;

// --- GEMINI IMPLEMENTATION ---
async function parseWithGemini(rawText) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    // Force Gemini to return clean JSON
    generationConfig: { responseMimeType: "application/json" }
  });

  const result = await model.generateContent(`${SYSTEM_PROMPT}\n\nUser Text: "${rawText}"`);
  return JSON.parse(result.response.text());
}

// --- OPENAI IMPLEMENTATION ---
async function parseWithOpenAI(rawText) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Or gpt-3.5-turbo
    response_format: { type: "json_object" }, // Force OpenAI to return clean JSON
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: rawText }
    ]
  });

  return JSON.parse(response.choices[0].message.content);
}

// --- THE ADAPTER ROUTER ---
async function extractTransactionData(rawText) {
  const provider = process.env.ACTIVE_AI_PROVIDER || 'gemini';
  
  if (provider === 'openai') {
    console.log("🧠 Routing to OpenAI...");
    return await parseWithOpenAI(rawText);
  } else {
    console.log("🧠 Routing to Gemini...");
    return await parseWithGemini(rawText);
  }
}

module.exports = { extractTransactionData };