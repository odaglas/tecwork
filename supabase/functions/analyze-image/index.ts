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

    console.log('Analizando imagen con Gemini 1.5 Flash...');

    // Direct fetch call to Gemini API with gemini-1.5-flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "Eres un experto en reparaciones del hogar. Analiza esta imagen e identifica el problema. Responde con un JSON que tenga: 'title' (título breve del problema en español), 'description' (descripción corta de 2-3 oraciones en español), y 'category' (debe ser EXACTAMENTE uno de: Electricidad, Gasfitería, Línea Blanca, Carpintería, Soporte Informático, Mantenimiento General)."
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
            maxOutputTokens: 1000,
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "Título breve del problema"
                },
                description: {
                  type: "string",
                  description: "Descripción detallada del problema"
                },
                category: {
                  type: "string",
                  enum: ["Electricidad", "Gasfitería", "Línea Blanca", "Carpintería", "Soporte Informático", "Mantenimiento General"],
                  description: "Categoría del servicio"
                }
              },
              required: ["title", "description", "category"]
            }
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error status:', response.status);
      console.error('Gemini API error response:', errorText);
      throw new Error(`Error de Gemini API: ${response.status}`);
    }

    const data = await response.json();
    console.log('Respuesta de Gemini:', JSON.stringify(data));

    // With responseMimeType: "application/json", the response is already structured JSON
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      console.error('Estructura de respuesta completa:', JSON.stringify(data, null, 2));
      throw new Error('Respuesta inválida de Gemini - no se encontró contenido de texto');
    }

    // Parse the JSON response
    const parsedResponse = JSON.parse(textContent);

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
