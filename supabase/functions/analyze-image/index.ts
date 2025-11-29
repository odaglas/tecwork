import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Step 1: Check for GOOGLE_API_KEY immediately
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY || GOOGLE_API_KEY.trim() === "") {
      throw new Error("GOOGLE_API_KEY is missing in environment variables");
    }

    console.log("GOOGLE_API_KEY found");

    // Step 2: Parse request body
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      throw new Error("No se proporcionó imagen en el request body");
    }

    // Step 3: Sanitize base64 string - remove data URL prefix if present
    const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

    console.log("Image base64 sanitized, length:", cleanBase64.length);
    console.log("Analizando imagen con Gemini 1.5 Pro...");

    // Step 4: Direct fetch call to Gemini API with gemini-1.5-pro
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Eres un experto en reparaciones del hogar. Analiza esta imagen e identifica el problema. Responde con un JSON que tenga: 'title' (título breve del problema en español), 'description' (descripción corta de 2-3 oraciones en español), y 'category' (debe ser EXACTAMENTE uno de: Electricidad, Gasfitería, Línea Blanca, Carpintería, Soporte Informático, Mantenimiento General).",
                },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1000,
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "Título breve del problema",
                },
                description: {
                  type: "string",
                  description: "Descripción detallada del problema",
                },
                category: {
                  type: "string",
                  enum: [
                    "Electricidad",
                    "Gasfitería",
                    "Línea Blanca",
                    "Carpintería",
                    "Soporte Informático",
                    "Mantenimiento General",
                  ],
                  description: "Categoría del servicio",
                },
              },
              required: ["title", "description", "category"],
            },
          },
        }),
      },
    );

    console.log("Google API responded with status:", response.status);

    // Step 5: Check if Google API returned an error
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error status:", response.status);
      console.error("Gemini API error response:", errorText);
      throw new Error(`Gemini API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Respuesta de Gemini:", JSON.stringify(data));

    // With responseMimeType: "application/json", the response is already structured JSON
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      console.error("Estructura de respuesta completa:", JSON.stringify(data, null, 2));
      throw new Error("Respuesta inválida de Gemini - no se encontró contenido de texto");
    }

    // Parse the JSON response
    const parsedResponse = JSON.parse(textContent);

    // Validate the response structure
    if (!parsedResponse.title || !parsedResponse.description || !parsedResponse.category) {
      throw new Error("Respuesta incompleta de Gemini");
    }

    // Validate category is one of the allowed values
    const validCategories = [
      "Electricidad",
      "Gasfitería",
      "Línea Blanca",
      "Carpintería",
      "Soporte Informático",
      "Mantenimiento General",
    ];

    if (!validCategories.includes(parsedResponse.category)) {
      console.warn("Categoría inválida:", parsedResponse.category);
      parsedResponse.category = "Mantenimiento General";
    }

    return new Response(
      JSON.stringify({
        title: parsedResponse.title,
        description: parsedResponse.description,
        category: parsedResponse.category,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error en analyze-image:", error);

    // Return 200 OK with error details for frontend debugging
    return new Response(
      JSON.stringify({
        error: "DEBUG INFO",
        details: error instanceof Error ? error.message : "Error desconocido",
        stack: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
