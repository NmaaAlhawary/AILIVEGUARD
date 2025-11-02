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
    const url = new URL(req.url);
    const playerId = url.searchParams.get('id');

    if (!playerId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Player ID is required. Use ?id=1' 
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const playerNames = [
      'Ter Stegen', 'Araujo', 'Christensen', 'Kounde', 
      'Balde', 'De Jong', 'Gavi', 'Pedri',
      'Raphinha', 'Lewandowski', 'Ferran Torres'
    ];

    const id = parseInt(playerId);
    if (id < 1 || id > 11) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Player ID must be between 1 and 11' 
        }), 
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const heartRate = 70 + Math.random() * 30;
    const fatigue = Math.random() * 30;
    const psi = Math.round((Math.max(0, 1 - (heartRate - 60) / 140) * 0.6 + Math.max(0, 1 - fatigue / 100) * 0.4) * 100);
    
    let status = 'fit';
    if (psi < 40) status = 'risk';
    else if (psi < 60) status = 'tired';

    const player = {
      id: id,
      name: playerNames[id - 1],
      heartRate: Math.round(heartRate),
      speed: Math.round((15 + Math.random() * 10) * 10) / 10,
      fatigue: Math.round(fatigue),
      psi: psi,
      status: status,
      isOnField: true,
    };

    return new Response(
      JSON.stringify({ 
        success: true,
        data: player 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in get-player function:', error);
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
