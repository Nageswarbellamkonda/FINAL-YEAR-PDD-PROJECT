// Provider-agnostic AI service layer standardized to use Gemini API via OpenAI compatibility
// Caches requests and deduplicates in-flight identical requests.

const cache = new Map();
const inFlightRequests = new Map();

export async function invokeLLM(prompt, systemPrompt = "You are a helpful AI assistant.") {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const baseURL = import.meta.env.VITE_AI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai";
  const model = import.meta.env.VITE_AI_MODEL || "gemini-3.5-flash";

  if (!apiKey) {
    console.error("[AI_SERVICE] ERROR: VITE_GEMINI_API_KEY is missing from environment variables.");
    throw new Error("VITE_GEMINI_API_KEY is missing. AI features require a valid Gemini API key to function.");
  }

  // Generate a unique cache key based on prompts
  const cacheKey = `${model}|${systemPrompt}|${prompt}`;
  
  // Return cached result if available
  if (cache.has(cacheKey)) {
    console.log("[AI_SERVICE] Returning cached response.");
    return cache.get(cacheKey);
  }

  // Deduplicate in-flight requests (if the same prompt is fired simultaneously)
  if (inFlightRequests.has(cacheKey)) {
    console.log("[AI_SERVICE] Identical request already in flight. Waiting for it to resolve...");
    return inFlightRequests.get(cacheKey);
  }

  const fetchPromise = (async () => {
    console.log(`[AI_SERVICE] Calling Gemini Provider: ${baseURL} | Model: ${model}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

    try {
      // Ensure prompt format is string (if not, stringify it - usually already stringified JSON or raw string)
      const promptString = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);

      // Handle JSON arrays differently to support conversation history
      let messages = [];
      try {
        const parsed = JSON.parse(promptString);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].role) {
           messages = [
             { role: "system", content: systemPrompt },
             ...parsed
           ];
        } else {
           throw new Error("Not a message array");
        }
      } catch (e) {
        messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: promptString }
        ];
      }

      const response = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.7,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AI_SERVICE] Gemini API HTTP Error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`AI API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("[AI_SERVICE] Gemini Response Received Successfully");
      
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
         throw new Error("Invalid response structure from Gemini API");
      }
      
      // Save to cache
      cache.set(cacheKey, content);
      
      // Optionally prune cache if it gets too large
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }

      return content;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error("[AI_SERVICE] Gemini Request Timed Out after 20 seconds.");
        throw new Error("AI Request Timed Out. Please check your network connection.");
      }
      console.error("[AI_SERVICE] Gemini invocation failed:", error);
      throw error; // Rethrow so components can gracefully handle it
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}
