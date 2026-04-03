import { getGeminiClient } from "../config/gemini.js";

function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("AI response did not contain valid JSON");
  }

  return JSON.parse(text.slice(start, end + 1));
}

export async function classifyComplaintImage(
  imageUrl,
  imageMimeType = "image/jpeg",
) {
  const gemini = getGeminiClient();

  const prompt = `
You are a civic issue classifier.

Analyze the complaint image and return ONLY valid JSON in this exact shape:
{
  "issueType": "GARBAGE | POTHOLE | WATER_LEAK | STREETLIGHT | DRAINAGE | ROAD_DAMAGE | UNKNOWN",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "department": "string",
  "summary": "string",
  "confidence": 0.0
}

Rules:
- Return JSON only
- No markdown
- No explanation
- Choose the closest matching issueType
- confidence must be between 0 and 1
`;

  const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            fileData: {
              fileUri: imageUrl,
              mimeType: imageMimeType,
            },
          },
        ],
      },
    ],
  });

  const text = response.text || "";
  return extractJson(text);
}

export async function verifyBeforeAfter({
  beforeImageUrl,
  beforeImageMimeType = "image/jpeg",
  afterImageUrl,
  afterImageMimeType = "image/jpeg"
}) {
  const gemini = getGeminiClient();

  const prompt = `
Compare the BEFORE and AFTER civic issue images.

Return ONLY valid JSON in this exact shape:
{
  "verificationStatus": "RESOLVED | UNRESOLVED | UNCLEAR",
  "summary": "string",
  "confidence": 0.0
}

Rules:
- Return JSON only
- No markdown
- No explanation
- confidence must be between 0 and 1
`;

  const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            fileData: {
              fileUri: beforeImageUrl,
              mimeType: beforeImageMimeType
            }
          },
          {
            fileData: {
              fileUri: afterImageUrl,
              mimeType: afterImageMimeType
            }
          }
        ]
      }
    ]
  });

  const text = response.text || "";
  return extractJson(text);
}
