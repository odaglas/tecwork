import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      throw new Error('No se proporcionó imagen');
    }

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY no configurada');
    }

    console.log('Analizando imagen con Gemini...');

    // Call Google Gemini API with gemini-2.5-flash (current fast model)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "You are an expert home repair technician. Analyze this image and identify the problem. Return ONLY a valid JSON object (no markdown, no code blocks) with: 'title' (a brief problem title in Spanish), 'description' (a short 2-3 sentence description in Spanish), and 'category' (must be EXACTLY one of: Electricidad, Gasfitería, Línea Blanca, Carpintería, Soporte Informático, Mantenimiento General)."
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageBase64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 500,
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      throw new Error(`Error de Gemini API: ${response.status}`);
    }

    const data = await response.json();
    console.log('Respuesta de Gemini:', JSON.stringify(data));

    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      throw new Error('Respuesta inválida de Gemini');
    }

    // Parse the JSON from the text content
    // Remove markdown code blocks if present
    let cleanedText = textContent.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }

    const parsedResponse = JSON.parse(cleanedText);

    // Validate the response structure
    if (!parsedResponse.title || !parsedResponse.description || !parsedResponse.category) {
      throw new Error('Respuesta incompleta de Gemini');
    }

    // Validate category is one of the allowed values
    const validCategories = [
      'Electricidad',
      'Gasfitería',
      'Línea Blanca',
      'Carpintería',
      'Soporte Informático',
      'Mantenimiento General'
    ];

    if (!validCategories.includes(parsedResponse.category)) {
      console.warn('Categoría inválida:', parsedResponse.category);
      parsedResponse.category = 'Mantenimiento General';
    }

    return new Response(
      JSON.stringify({
        title: parsedResponse.title,
        description: parsedResponse.description,
        category: parsedResponse.category
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en analyze-image:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
