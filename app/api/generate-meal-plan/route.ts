import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. Destructure the new context from the frontend
    const { dietType, currentPlan, ingredients } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey)
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });

    // 2. Updated Prompt for the Planner
    const prompt = `
  You are NURA, a precision nutrition AI. 
  
  User Profile:
  - Diet: ${dietType}
  - Goal: ${currentPlan}
  - Current Pantry (Priority): ${ingredients.length > 0 ? ingredients.join(", ") : "Empty"}
  
  Task: Create a 3-meal plan. 
  Logic:
  1. Use the "Current Pantry" items as the foundation for the meals.
  2. If the pantry is incomplete (e.g., only has eggs), SUGGEST (use meat items less and not in every meal-once or twice is fine) and INCLUDE additional healthy ingredients needed to make a complete meal (Avoid adding beef/pork).
  3. Ensure the plan remains strictly ${dietType} and optimized for ${currentPlan} and also INDIAN cuisine.

  Return strictly JSON:
  {
    "breakfast": { "name": "string", "description": "string", "cals": number, "added_items": ["string"] },
    "lunch": { "name": "string", "description": "string", "cals": number, "added_items": ["string"] },
    "dinner": { "name": "string", "description": "string", "cals": number, "added_items": ["string"] }
  }
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            response_mime_type: "application/json",
          },
        }),
      },
    );

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText)
      return NextResponse.json(
        { error: "AI failed to respond" },
        { status: 500 },
      );

    // Return the full 3-meal plan
    return NextResponse.json(JSON.parse(rawText));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
