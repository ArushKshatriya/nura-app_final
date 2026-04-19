import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { mealName } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ 
              text: `Suggest ONE sustainable, lower-carbon food swap for: "${mealName}".
                     
                     Return ONLY JSON with this structure:
                     {
                       "name": "Name of the swap meal",
                       "co2": number,
                       "ingredient": "The main low-carbon ingredient to buy",
                       "reason": "One short sentence explaining why this is better for the planet"
                     }
                     
                     Guidelines:
                     1. If the original is meat-heavy (especially beef/lamb), suggest plant-based or lower-impact alternatives (lentils, chicken, tofu).
                     2. The "co2" value MUST be in Kilograms (kg) and MUST be lower than the original impact.
                     3. Keep the "reason" punchy and professional.`
            }]
          }],
          generationConfig: {
            response_mime_type: "application/json"
          }
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return NextResponse.json({ error: "AI failed to respond" }, { status: 500 });
    }

    // Parse and return the clean JSON
    return NextResponse.json(JSON.parse(rawText));

  } catch (error: any) {
    console.error("Swap API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}