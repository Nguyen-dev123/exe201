/**
 * AI Service - OpenRouter Integration
 * Provides streaming AI responses for Study Assistant
 *
 * Free Models Available:
 * - google/gemma-2-9b-it:free
 * - meta-llama/llama-3.2-3b-instruct:free
 * - microsoft/phi-3-mini-128k-instruct:free
 */

const AIUsage = require("../models/AIUsage");
const subscriptionService = require("./subscription.service");

// AI Configuration
const AI_CONFIG = {
  OPENROUTER_API_URL: "https://openrouter.ai/api/v1/chat/completions",
  // Free models on OpenRouter
  FREE_MODELS: [
    "arcee-ai/trinity-large-preview:free",
    "tngtech/deepseek-r1t2-chimera:free",
    "z-ai/glm-4.5-air:free",
  ],
  DEFAULT_MODEL:
    process.env.OPENROUTER_MODEL || "arcee-ai/trinity-large-preview:free",

  // Daily limits
  FREE_DAILY_LIMIT: 5,

  // Groq (free, fast, reliable) - used when GROQ_API_KEY is set
  GROQ_API_URL: "https://api.groq.com/openai/v1/chat/completions",
  GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",

  // Free fallback provider (no API key required) - keeps AI working out of the box
  POLLINATIONS_API_URL: "https://text.pollinations.ai/openai",
  POLLINATIONS_MODEL: "openai",

  // System prompt to keep AI focused on education
  SYSTEM_PROMPT: `Bạn là HOCA AI - trợ lý học tập thông minh của nền tảng HOCA.

NGUYÊN TẮC:
1. Chỉ trả lời các câu hỏi liên quan đến học tập, kiến thức học thuật
2. Trả lời ngắn gọn, súc tích, dễ hiểu
3. Sử dụng tiếng Việt tự nhiên, thân thiện
4. Nếu câu hỏi không liên quan đến học tập, lịch sự từ chối và hướng dẫn hỏi về học tập
5. Có thể giải thích công thức, lý thuyết, bài tập
6. Khuyến khích và động viên học viên

PHONG CÁCH:
- Thân thiện như một người bạn học
- Sử dụng emoji phù hợp 📚✨🎯
- Chia nhỏ kiến thức phức tạp thành các bước đơn giản

Hãy trả lời câu hỏi của học viên:`,
};

/**
 * Check if user can ask AI questions today
 * @param {Object} user - User object with subscription info
 * @returns {Object} { canAsk, remaining, limit, message }
 */
async function checkAILimit(user) {
  // AI is unlimited for all users (no daily cap)
  const tier = subscriptionService.getEffectiveTier(user);
  const isPremium = tier !== "FREE";

  return {
    canAsk: true,
    remaining: -1, // -1 means unlimited
    limit: -1,
    used: 0,
    isPremium,
    message: null,
  };
}

/**
 * Get AI status for user
 * @param {Object} user - User object
 * @returns {Object} AI availability status
 */
async function getAIStatus(user) {
  if (!user || !user._id) {
    throw new Error("User is required to get AI status");
  }

  const limitInfo = await checkAILimit(user);

  return {
    available: true,
    model: AI_CONFIG.DEFAULT_MODEL,
    ...limitInfo,
  };
}

/**
 * Call Groq (OpenAI-compatible, free & fast). Requires GROQ_API_KEY.
 * @param {Array} messages
 * @returns {Promise<string>}
 */
async function callGroq(messages) {
  const response = await fetch(AI_CONFIG.GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Groq ${response.status}: ${text.slice(0, 120)}`);
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  if (!content) throw new Error("Empty Groq response");
  return content;
}

/**
 * Call a free, no-key provider (Pollinations - OpenAI compatible).
 * Resilient: retries with backoff and falls back across endpoints,
 * because the free service is occasionally rate-limited (HTTP 502).
 * @param {Array} messages
 * @returns {Promise<string>} AI response text
 */
async function callFreeProvider(messages) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Strategy 1: OpenAI-compatible POST endpoint (supports full message history)
  const tryPost = async () => {
    const response = await fetch(AI_CONFIG.POLLINATIONS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: AI_CONFIG.POLLINATIONS_MODEL,
        messages,
        temperature: 0.7,
        referrer: "hoca",
      }),
    });
    if (!response.ok) throw new Error(`POST ${response.status}`);
    const data = await response.json();
    const content =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.text ||
      (typeof data === "string" ? data : "");
    if (!content) throw new Error("Empty POST response");
    return content;
  };

  // Strategy 2: Simple GET endpoint (collapse history into a single prompt)
  const tryGet = async () => {
    const sys = messages.find((m) => m.role === "system")?.content || "";
    const convo = messages
      .filter((m) => m.role !== "system")
      .map((m) => `${m.role === "user" ? "Học viên" : "Trợ lý"}: ${m.content}`)
      .join("\n");
    const prompt = `${sys}\n\n${convo}\nTrợ lý:`;
    const url =
      "https://text.pollinations.ai/" +
      encodeURIComponent(prompt) +
      `?model=${AI_CONFIG.POLLINATIONS_MODEL}&referrer=hoca`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`GET ${response.status}`);
    const text = await response.text();
    if (!text || text.trim().startsWith("<!DOCTYPE"))
      throw new Error("Invalid GET response");
    return text.trim();
  };

  const strategies = [tryPost, tryPost, tryGet, tryPost];
  let lastErr;
  for (let i = 0; i < strategies.length; i++) {
    try {
      return await strategies[i]();
    } catch (err) {
      lastErr = err;
      console.warn(`Free AI attempt ${i + 1} failed: ${err.message}`);
      // brief backoff before retrying (skip wait on last attempt)
      if (i < strategies.length - 1) await sleep(800 * (i + 1));
    }
  }
  console.error("Free AI provider error after retries:", lastErr?.message);
  throw new Error("AI API request failed");
}

/**
 * Stream AI response from OpenRouter (falls back to free provider)
 * @param {string} question - User's question
 * @param {Object} user - User object for context
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {AsyncGenerator} Yields response chunks
 */
async function* streamAIResponse(question, user, conversationHistory = []) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  // Check limit for FREE users
  const limitInfo = await checkAILimit(user);
  if (!limitInfo.canAsk) {
    yield {
      type: "limit_reached",
      content: limitInfo.message,
      remaining: 0,
      limit: limitInfo.limit,
    };
    return;
  }

  // Build messages array
  const messages = [
    { role: "system", content: AI_CONFIG.SYSTEM_PROMPT },
    ...conversationHistory.slice(-6), // Keep last 3 exchanges for context
    { role: "user", content: question },
  ];

  // No OpenRouter key -> use Groq (if available) then free provider
  if (!apiKey) {
    try {
      yield {
        type: "start",
        remaining: limitInfo.isPremium ? -1 : limitInfo.remaining - 1,
      };
      let fullResponse = "";
      let usedModel = AI_CONFIG.POLLINATIONS_MODEL;
      if (process.env.GROQ_API_KEY) {
        try {
          fullResponse = await callGroq(messages);
          usedModel = AI_CONFIG.GROQ_MODEL;
        } catch (gErr) {
          console.warn("Groq failed, using free provider:", gErr.message);
          fullResponse = await callFreeProvider(messages);
        }
      } else {
        fullResponse = await callFreeProvider(messages);
      }
      yield { type: "chunk", content: fullResponse };
      await AIUsage.incrementUsage(user._id, {
        question,
        response: fullResponse,
        model: usedModel,
        tokensUsed: 0,
      });
      yield { type: "done", fullResponse };
    } catch (error) {
      console.error("Free AI stream error:", error);
      yield {
        type: "error",
        content: "Xin lỗi, AI đang bận. Vui lòng thử lại sau.",
      };
    }
    return;
  }

  try {
    const response = await fetch(AI_CONFIG.OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.APP_URL || "https://hoca.vn",
        "X-Title": "HOCA Study Assistant",
      },
      body: JSON.stringify({
        model: AI_CONFIG.DEFAULT_MODEL,
        messages,
        stream: true,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenRouter API error:", response.status, errorData);
      // Fallback to free provider on OpenRouter failure
      try {
        yield {
          type: "start",
          remaining: limitInfo.isPremium ? -1 : limitInfo.remaining - 1,
        };
        const fullResponse = await callFreeProvider(messages);
        yield { type: "chunk", content: fullResponse };
        await AIUsage.incrementUsage(user._id, {
          question,
          response: fullResponse,
          model: AI_CONFIG.POLLINATIONS_MODEL,
          tokensUsed: 0,
        });
        yield { type: "done", fullResponse };
      } catch (e) {
        yield {
          type: "error",
          content: "Xin lỗi, AI đang bận. Vui lòng thử lại sau.",
        };
      }
      return;
    }

    // Stream response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    yield {
      type: "start",
      remaining: limitInfo.isPremium ? -1 : limitInfo.remaining - 1,
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);

          if (data === "[DONE]") {
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;

            if (content) {
              fullResponse += content;
              yield { type: "chunk", content };
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

    // Record usage after successful response
    await AIUsage.incrementUsage(user._id, {
      question,
      response: fullResponse,
      model: AI_CONFIG.DEFAULT_MODEL,
      tokensUsed: 0, // OpenRouter doesn't always provide token count in stream
    });

    yield { type: "done", fullResponse };
  } catch (error) {
    console.error("AI Service error:", error);
    yield { type: "error", content: "Đã có lỗi xảy ra. Vui lòng thử lại." };
  }
}

/**
 * Non-streaming AI call (for simpler use cases)
 */
async function askAI(question, user, conversationHistory = []) {
  const limitInfo = await checkAILimit(user);
  if (!limitInfo.canAsk) {
    throw new Error(limitInfo.message);
  }

  const messages = [
    { role: "system", content: AI_CONFIG.SYSTEM_PROMPT },
    ...conversationHistory.slice(-6),
    { role: "user", content: question },
  ];

  let aiResponse = "";
  let usedModel = "";
  let tokensUsed = 0;

  // Provider priority chain: OpenRouter -> Groq -> free (Pollinations)
  const providers = [];
  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      name: AI_CONFIG.DEFAULT_MODEL,
      run: async () => {
        const response = await fetch(AI_CONFIG.OPENROUTER_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": process.env.APP_URL || "https://hoca.vn",
            "X-Title": "HOCA Study Assistant",
          },
          body: JSON.stringify({
            model: AI_CONFIG.DEFAULT_MODEL,
            messages,
            max_tokens: 1024,
            temperature: 0.7,
          }),
        });
        if (!response.ok) throw new Error(`OpenRouter ${response.status}`);
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        if (!content) throw new Error("Empty OpenRouter response");
        tokensUsed = data.usage?.total_tokens || 0;
        return content;
      },
    });
  }
  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: AI_CONFIG.GROQ_MODEL,
      run: () => callGroq(messages),
    });
  }
  providers.push({
    name: AI_CONFIG.POLLINATIONS_MODEL,
    run: () => callFreeProvider(messages),
  });

  let lastErr;
  for (const provider of providers) {
    try {
      aiResponse = await provider.run();
      usedModel = provider.name;
      break;
    } catch (err) {
      lastErr = err;
      console.error(`AI provider "${provider.name}" failed:`, err.message);
    }
  }

  if (!aiResponse) {
    throw new Error("AI API request failed");
  }

  // Record usage
  await AIUsage.incrementUsage(user._id, {
    question,
    response: aiResponse,
    model: usedModel,
    tokensUsed,
  });

  return {
    response: aiResponse,
    remaining: limitInfo.isPremium ? -1 : limitInfo.remaining - 1,
  };
}

module.exports = {
  AI_CONFIG,
  checkAILimit,
  getAIStatus,
  streamAIResponse,
  askAI,
};
