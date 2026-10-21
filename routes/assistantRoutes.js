const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const GardenEntry = require('../models/GardenEntry');

// Rate limiter for AI chat: 30 requests per 10 minutes per IP
const assistantLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'You have reached the AI assistant question limit. Please wait a few minutes before asking more questions.'
  }
});

const SYSTEM_INSTRUCTION = `You are "Santhamithra AI", the expert botanical and herbal gardening companion for the HerbIT platform ("Grow Knowledge. Nurture Nature.").
Your mission is to help users successfully grow, nurture, and understand medicinal plants and traditional Indian herbs (such as Tulsi, Ashwagandha, Neem, Brahmi, Shatavari, Giloy, Aloe Vera, etc.).

Core Responsibilities:
1. Provide accurate, practical horticultural advice: sunlight, soil pH and drainage, watering schedules, propagation methods (cuttings, seeds, division), pruning, seasonal care, and organic pest remedies (e.g., neem oil spray, compost tea).
2. Share traditional botanical wisdom and cultural context about Indian medicinal flora clearly and respectfully.
3. Keep answers clear, encouraging, structured with bullet points where appropriate, and formatted in clean markdown.

Language & Tone Guidelines:
- Always greet users in clean, friendly, natural English (e.g., "Hello!", "Hi there!").
- Do NOT use "Namaste" or any other non-English greetings anywhere in your response.

Critical Safety & Medical Guardrails:
- You are an educational gardening and botanical guide, NOT a medical doctor or diagnostic service.
- If a user asks about medical treatment, dosing, pregnancy safety, severe poisoning, pediatric use, or drug interactions, clearly advise them that herbal remedies must not replace professional clinical care and urge them to consult a qualified Ayurvedic doctor (Vaidya) or registered healthcare professional.
- Never guarantee medical cures or fabricate clinical trial conclusions.
- When referencing user garden plants, use their current growing status to provide tailored cultivation guidance.`;

/**
 * POST /api/assistant/chat
 * Send a query to the Gemini AI Gardening Assistant with optional personal garden context
 */
router.post('/chat', assistantLimiter, async (req, res) => {
  try {
    const { message, history, includeGardenContext } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a non-empty question for the gardening assistant.'
      });
    }

    const userMessage = message.trim();
    if (userMessage.length > 1500) {
      return res.status(400).json({
        success: false,
        message: 'Message is too long. Please keep questions under 1500 characters.'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';

    // Graceful handling if Gemini API Key is not yet configured
    if (!apiKey) {
      return res.status(200).json({
        success: false,
        configured: false,
        reply: `🌿 **Santhamithra AI Setup Required**\n\nThe Google Gemini API Key (\`GEMINI_API_KEY\`) is not yet configured in the server's \`.env\` file.\n\n### How to enable live AI responses:\n1. Obtain an API key at **[Google AI Studio](https://aistudio.google.com/app/apikey)**.\n2. Add the following line to your project's \`.env\` file:\n   \`\`\`env\n   GEMINI_API_KEY=your_gemini_api_key_here\n   \`\`\`\n3. Restart the server.\n\nOnce configured, Santhamithra AI will immediately provide tailored cultivation advice, analyze your personal garden plants, and answer your herbal questions!`,
        timestamp: new Date().toISOString()
      });
    }

    // Retrieve personal garden context if requested and user is authenticated
    let gardenContextText = '';
    if (includeGardenContext && req.session && req.session.userId) {
      try {
        const userGarden = await GardenEntry.find({ userId: req.session.userId })
          .populate('plantId', 'name scientificName category')
          .limit(20);

        if (userGarden && userGarden.length > 0) {
          const plantList = userGarden
            .filter((e) => e.plantId)
            .map((e) => `- ${e.plantId.name} (${e.plantId.scientificName || ''}) — Status: ${e.status}${e.personalNotes ? ` (User Notes: ${e.personalNotes})` : ''}`)
            .join('\n');

          gardenContextText = `\n\n[USER PERSONAL GARDEN CONTEXT]: The user currently has the following plants saved in their personal garden on this platform:\n${plantList}\nUse this context when relevant to provide personalized answers.`;
        }
      } catch (ctxErr) {
        console.warn('Notice: Could not load garden context for AI prompt:', ctxErr.message);
      }
    }

    // Build Gemini request contents
    const contents = [];

    // Add conversation history if provided (limit to 8 recent exchanges)
    if (Array.isArray(history) && history.length > 0) {
      const sanitizedHistory = history.slice(-8);
      for (const turn of sanitizedHistory) {
        if (turn && turn.text && (turn.role === 'user' || turn.role === 'model')) {
          contents.push({
            role: turn.role,
            parts: [{ text: String(turn.text).slice(0, 1500) }]
          });
        }
      }
    }

    // Append the current user prompt with injected garden context
    contents.push({
      role: 'user',
      parts: [{ text: userMessage + gardenContextText }]
    });

    // Models to try in order of availability and stability
    const candidateModels = [
      'gemini-flash-latest',
      'gemini-3.5-flash',
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash-lite'
    ];

    let geminiResponse = null;
    let lastErrorMsg = '';

    for (const modelName of candidateModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const resp = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: SYSTEM_INSTRUCTION }]
            },
            contents: contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1200
            }
          })
        });

        if (resp.ok) {
          geminiResponse = resp;
          break;
        } else {
          const errBody = await resp.json().catch(() => ({}));
          lastErrorMsg = errBody.error ? errBody.error.message : resp.statusText;
          // Continue loop to try fallback models on 404, 503, 429, or 500
          console.warn(`Model ${modelName} returned ${resp.status} (${lastErrorMsg}), attempting fallback model...`);
        }
      } catch (callErr) {
        lastErrorMsg = callErr.message;
      }
    }

    if (!geminiResponse || !geminiResponse.ok) {
      console.error('Gemini API Error:', lastErrorMsg);
      return res.status(502).json({
        success: false,
        configured: true,
        message: `Gemini AI service error: ${lastErrorMsg || 'Unexpected response from Google AI'}`,
        reply: `⚠️ The AI service encountered a temporary error. Please verify your API key quota or try again in a moment.`
      });
    }

    const result = await geminiResponse.json();
    const generatedText =
      result.candidates &&
      result.candidates[0] &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts[0]
        ? result.candidates[0].content.parts[0].text
        : 'I apologize, but I could not formulate an answer at this moment. Please try again.';

    return res.status(200).json({
      success: true,
      configured: true,
      reply: generatedText,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI assistant endpoint error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error processing your question with AI assistant'
    });
  }
});

module.exports = router;
