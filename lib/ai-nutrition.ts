// lib/ai-nutrition.ts
export async function getNutritionData(input: string) {
  const prompt = `
    Analyze food: "${input}". 
    Reference Scale (kg CO2 per kg): Beef: 27, Lamb: 39, Cheese: 13, Chicken: 7, Veggies: 1.
    Return ONLY JSON: 
    {
      "name": "string",
      "cal": number,
      "pro": number,
      "carb": number,
      "fat": number,
      "co2": number,
      "swap": "string"
    }
  `;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    }
  );

  const rawData = await response.json();
  return JSON.parse(rawData.candidates[0].content.parts[0].text);
}