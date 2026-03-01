import Anthropic from "@anthropic-ai/sdk";
import { Scene } from "@/types";
import { v4 as uuidv4 } from "uuid";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ParsedScene {
  text: string;
  keywords: string[];
  duration: number;
}

export async function parseScript(script: string): Promise<Scene[]> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Given the following YouTube Short script, split it into scenes of 3-8 seconds each. For each scene generate:
- The text of that scene (the narration/voiceover text)
- 3-5 search keywords IN ENGLISH to find relevant stock videos
- Estimated duration in seconds

IMPORTANT: Respond ONLY with a valid JSON array, no markdown, no explanation. Example format:
[
  {
    "text": "Scene narration text here",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "duration": 5
  }
]

Here is the script:

${script}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude API");
  }

  let parsed: ParsedScene[];
  try {
    // Try to extract JSON from the response, handling potential markdown wrapping
    let jsonText = content.text.trim();
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(
      `Failed to parse Claude response as JSON: ${content.text.substring(0, 200)}`
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Claude response is not an array");
  }

  return parsed.map((scene, index) => ({
    id: uuidv4(),
    index,
    text: scene.text,
    keywords: scene.keywords,
    duration: scene.duration,
  }));
}
