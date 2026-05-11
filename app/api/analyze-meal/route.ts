import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { mealName, mealType } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "API Key missing" }, { status: 500 });

    // Using the 2.5 Flash model confirmed by your debug list
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ 
              text: `Analyze nutrition for ${mealName} (${mealType}). 
                     Return ONLY JSON: {"cal": number, "pro": number, "carb": number, "fat": number, "co2": number, "name": "string"}
                     The co2 field MUST be returned in Kilograms (kg). For most meals, this will be a decimal between 0.1 and 2.0. Never return grams (e.g., return 0.05 for coffee, not 50. 4.5 for beef).`
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
    if (!rawText) return NextResponse.json({ error: "AI failed to respond" }, { status: 500 });

    return NextResponse.json(JSON.parse(rawText));

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
