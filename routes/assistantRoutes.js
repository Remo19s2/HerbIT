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

    const tRequestReceived = Date.now();
    console.log(`[Assistant API] Request received. History turns: ${Array.isArray(history) ? history.length : 0}, Garden context requested: ${Boolean(includeGardenContext)}`);

    // Retrieve personal garden context if requested and user is authenticated
    let gardenContextText = '';
    const tGardenStart = Date.now();
    if (includeGardenContext && req.session && req.session.userId) {
      try {
        const userGarden = await GardenEntry.find({ userId: req.session.userId })
          .populate('plantId', 'name scientificName category')
          .limit(10)
          .lean();

        if (userGarden && userGarden.length > 0) {
          const plantList = userGarden
            .filter((e) => e.plantId)
            .map((e) => `- ${e.plantId.name} (${e.plantId.scientificName || ''}) — Status: ${e.status}${e.personalNotes ? ` (Notes: ${e.personalNotes.slice(0, 100)})` : ''}`)
            .join('\n');

          gardenContextText = `\n\n[USER PERSONAL GARDEN CONTEXT]: The user currently has the following plants saved in their personal garden on this platform:\n${plantList}\nUse this context when relevant to provide personalized answers.`;
        }
      } catch (ctxErr) {
        console.warn('[Assistant API] Notice: Could not load garden context:', ctxErr.message);
      }
    }
    const gardenPrepMs = Date.now() - tGardenStart;
    console.log(`[Assistant API] Garden context prepared in ${gardenPrepMs}ms (entries found: ${gardenContextText ? 'yes' : 'none'})`);

    // Build Gemini request contents
    const contents = [];

    // Add conversation history if provided (limit to 6 recent messages / 3 full turns, max 600 chars each)
    if (Array.isArray(history) && history.length > 0) {
      const sanitizedHistory = history.slice(-6);
      for (const turn of sanitizedHistory) {
        if (turn && turn.text && (turn.role === 'user' || turn.role === 'model')) {
          contents.push({
            role: turn.role,
            parts: [{ text: String(turn.text).slice(0, 600) }]
          });
        }
      }
    }

    // Append the current user prompt with injected garden context
    contents.push({
      role: 'user',
      parts: [{ text: userMessage + gardenContextText }]
    });

    // Supported high-speed models in order of proven low latency
    // gemini-3.5-flash-lite is Google's recommended fast lightweight model (responds in ~2s)
    const candidateModels = [
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-flash-latest'
    ];

    let geminiResponse = null;
    let selectedModel = '';
    let lastErrorMsg = '';

    for (const modelName of candidateModels) {
      const tGeminiStart = Date.now();
      try {
        console.log(`[Assistant API] Trying Gemini model: ${modelName}...`);
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        
        // Use AbortSignal.timeout(10000) so a hanging upstream request aborts in 10s max
        const resp = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10000),
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: SYSTEM_INSTRUCTION }]
            },
            contents: contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000
            }
          })
        });

        const geminiCallDuration = Date.now() - tGeminiStart;

        if (resp.ok) {
          geminiResponse = resp;
          selectedModel = modelName;
          console.log(`[Assistant API] Gemini model ${modelName} responded successfully in ${geminiCallDuration}ms`);
          break;
        } else {
          const errBody = await resp.json().catch(() => ({}));
          lastErrorMsg = errBody.error ? errBody.error.message : resp.statusText;
          console.warn(`[Assistant API] Model ${modelName} returned HTTP ${resp.status} after ${geminiCallDuration}ms (${lastErrorMsg}). Falling back...`);
        }
      } catch (callErr) {
        const geminiCallDuration = Date.now() - tGeminiStart;
        lastErrorMsg = callErr.name === 'TimeoutError' ? 'Upstream request timed out after 10000ms' : callErr.message;
        console.warn(`[Assistant API] Model ${modelName} failed after ${geminiCallDuration}ms: ${lastErrorMsg}. Falling back...`);
      }
    }

    if (!geminiResponse || !geminiResponse.ok) {
      const totalBackendTime = Date.now() - tRequestReceived;
      console.error(`[Assistant API] All Gemini candidate models failed after ${totalBackendTime}ms. Last error: ${lastErrorMsg}`);
      return res.status(502).json({
        success: false,
        configured: true,
        message: `Gemini AI service error: ${lastErrorMsg || 'Unexpected response from Google AI'}`,
        reply: `⚠️ The AI service encountered a temporary error. Please try again in a few moments.`
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

    const totalBackendDuration = Date.now() - tRequestReceived;
    console.log(`[Assistant API] Total backend response time: ${totalBackendDuration}ms (Model: ${selectedModel})`);

    return res.status(200).json({
      success: true,
      configured: true,
      modelUsed: selectedModel,
      backendDurationMs: totalBackendDuration,
      reply: generatedText,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Assistant API] Server error processing question:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error processing your question with AI assistant'
    });
  }
});

module.exports = router;
