import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const substituteNames = ['Inaki Pena', 'Fermin Lopez', 'Joao Felix', 'Yamal', 'Ansu Fati'];
    
    const substitutes = substituteNames.map((name, idx) => ({
      id: 100 + idx,
      name: name,
      psi: Math.round(95 + Math.random() * 5),
      isAvailable: true,
    }));

    return new Response(
      JSON.stringify({ 
        success: true,
        count: substitutes.length,
        data: substitutes 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in get-substitutes function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
