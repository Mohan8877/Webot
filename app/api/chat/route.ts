import { type NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyD08gm7BiteeIVSfM8DzM4qpVbeoAJAMsc"

// Simple similarity search using keyword matching
function findRelevantChunks(query: string, chunks: string[], topK = 3): string[] {
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2)

  const scored = chunks.map((chunk) => {
    const chunkLower = chunk.toLowerCase()
    let score = 0

    for (const word of queryWords) {
      if (chunkLower.includes(word)) {
        score += 1
        if (chunkLower.includes(query.toLowerCase())) {
          score += 5
        }
      }
    }

    return { chunk, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((s) => s.score > 0)
    .map((s) => s.chunk)
}

const languageInstructions: Record<string, string> = {
  en: "Respond in English.",
  hi: "Respond in Hindi (हिन्दी में जवाब दें).",
  te: "Respond in Telugu (తెలుగులో సమాధానం ఇవ్వండి).",
}

async function callGeminiWithRetry(prompt: string, maxRetries = 3): Promise<{ text: string; error?: string }> {
  const models = ["gemini-3-flash-preview","gemini-2.5-pro","gemini-2.5-flash","gemini-2.5-flash-preview-09-2025","gemini-2.5-flash-lite-preview-09-2025"]

  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const model = models[modelIndex]

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
              },
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
              ],
            }),
          },
        )

        if (response.ok) {
          const data = await response.json()
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) {
            return { text }
          }
        }

        const errorBody = await response.text()
        console.log(`[v0] Model ${model} response status: ${response.status}`)

        if (response.status === 429) {
          let waitTime = 10000
          try {
            const errorData = JSON.parse(errorBody)
            const retryInfo = errorData.error?.details?.find(
              (d: any) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo",
            )
            if (retryInfo?.retryDelay) {
              const delayStr = retryInfo.retryDelay.replace("s", "")
              waitTime = Math.ceil(Number.parseFloat(delayStr) * 1000) + 2000
            }
          } catch {}

          console.log(`Rate limited on ${model}, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`)
          await new Promise((resolve) => setTimeout(resolve, waitTime))

          if (attempt === maxRetries - 1 && modelIndex < models.length - 1) {
            console.log(` Switching to next model: ${models[modelIndex + 1]}`)
            break
          }
          continue
        }

        if (response.status === 404) {
          console.log(`Model ${model} not found, trying next model`)
          break
        }

        break
      } catch (error) {
        console.error(` Attempt ${attempt + 1} failed:`, error)
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 3000))
        }
      }
    }
  }

  return {
    text: "",
    error: "RATE_LIMITED",
  }
}

export async function POST(req: NextRequest) {
  try {
    const { question, url, language = "en", chunks = [], fullContent = "" } = await req.json()

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    if (chunks.length === 0 && !fullContent) {
      return NextResponse.json(
        { error: "Website content is required. Please analyze the website first." },
        { status: 400 },
      )
    }

    const relevantChunks = findRelevantChunks(question, chunks)
    const context =
      relevantChunks.length > 0 ? relevantChunks.join("\n\n---\n\n").substring(0, 2000) : fullContent.substring(0, 2000)

    const systemPrompt = `You are a helpful AI assistant that answers questions based on website content.

RULES:
1. Use information from the provided website content
2. If the answer is NOT found, say: "I could not find this information on the website."
3. Be concise and helpful
4. ${languageInstructions[language] || languageInstructions.en}

WEBSITE: ${url || "Unknown"}

CONTENT:
${context}

Question: ${question}`

    const result = await callGeminiWithRetry(systemPrompt)

    if (result.error === "RATE_LIMITED") {
      return NextResponse.json(
        {
          error: "RATE_LIMITED",
          message: "API quota exceeded. Please wait a moment and try again.",
        },
        { status: 429 },
      )
    }

    return NextResponse.json({
      answer: result.text || "I could not generate a response.",
      relevantChunksUsed: relevantChunks.length,
    })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate response" },
      { status: 500 },
    )
  }
}
