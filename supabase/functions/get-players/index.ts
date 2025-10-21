import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock player data that simulates your app's data structure
const generatePlayers = () => {
  const formations = [
    { x: 50, y: 90, name: 'Al-Owais' },   // GK
    { x: 20, y: 70, name: 'Al-Shahrani' },   // LB
    { x: 40, y: 75, name: 'Al-Bulaihi' },   // CB
    { x: 60, y: 75, name: 'Al-Amri' },   // CB
    { x: 80, y: 70, name: 'Al-Burayk' },   // RB
    { x: 30, y: 50, name: 'Kanno' },   // CM
    { x: 50, y: 55, name: 'Al-Faraj' },   // CM
    { x: 70, y: 50, name: 'Al-Najei' },   // CM
    { x: 20, y: 20, name: 'Al-Dawsari' },   // LW
    { x: 50, y: 15, name: 'Al-Shehri' },   // ST
    { x: 80, y: 20, name: 'Otaif' },   // RW
  ];

  return formations.map((player, index) => {
    const heartRate = 70 + Math.random() * 30;
    const fatigue = Math.random() * 30;
    const psi = Math.round((Math.max(0, 1 - (heartRate - 60) / 140) * 0.6 + Math.max(0, 1 - fatigue / 100) * 0.4) * 100);
    
    let status = 'fit';
    if (psi < 40) status = 'risk';
    else if (psi < 60) status = 'tired';

    return {
      id: index + 1,
      name: player.name,
      position: { x: player.x, y: player.y },
      heartRate: Math.round(heartRate),
      speed: Math.round((15 + Math.random() * 10) * 10) / 10,
      fatigue: Math.round(fatigue),
      psi: psi,
      status: status,
      isOnField: true,
    };
  });
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const players = generatePlayers();

    return new Response(
      JSON.stringify({ 
        success: true,
        count: players.length,
        data: players 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in get-players function:', error);
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
