import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resvg, initWasm } from 'https://esm.sh/@resvg/resvg-wasm@2.6.0';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const brandConfig: Record<string, { color: string; label: string; url: string; bgWord: string }> = {
  the_strategy_pitch: { color: '#2563eb', label: 'THE STRATEGY PITCH', url: 'thestrategypitch.com', bgWord: 'GTM' },
  barneslam_co:       { color: '#c9a84c', label: 'BARNES LAM',         url: 'barneslam.co',        bgWord: 'POS' },
  axis_chamber:       { color: '#16a34a', label: 'AXIS CHAMBER',       url: 'axischamber.org',     bgWord: 'GRW' },
};

function extractHeadlines(content: string): { headline: string; sub: string } {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const headline = lines[0]?.slice(0, 60) || 'Growth Insight';
  const sub = lines[1]?.slice(0, 80) || '';
  return { headline, sub };
}

function generateSVG(channel: string, content: string): string {
  const brand = brandConfig[channel] || brandConfig.barneslam_co;
  const { headline, sub } = extractHeadlines(content);
  const color = brand.color;

  // Split headline into two lines if long
  const words = headline.split(' ');
  const mid = Math.ceil(words.length / 2);
  const line1 = words.slice(0, mid).join(' ');
  const line2 = words.slice(mid).join(' ');

  return `<svg viewBox="0 0 1200 628" xmlns="http://www.w3.org/2000/svg" width="1200" height="628">
  <rect width="1200" height="628" fill="#0d0f1a"/>
  <rect width="1200" height="6" fill="${color}"/>
  <rect x="0" y="0" width="5" height="628" fill="${color}"/>
  <defs>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#ffffff" stroke-width="0.3" opacity="0.06"/>
    </pattern>
  </defs>
  <rect width="1200" height="628" fill="url(#grid)"/>
  <text x="60" y="520" font-size="300" font-weight="900" fill="#ffffff" opacity="0.03" font-family="Georgia, serif">${brand.bgWord}</text>
  <rect x="60" y="80" width="220" height="32" rx="4" fill="${color}" opacity="0.15"/>
  <text x="72" y="101" font-size="13" font-weight="700" fill="${color}" font-family="system-ui, sans-serif" letter-spacing="2">${brand.label}</text>
  <text x="60" y="200" font-size="64" font-weight="900" fill="#ffffff" font-family="Georgia, serif">${line1}</text>
  ${line2 ? `<text x="60" y="278" font-size="64" font-weight="900" fill="#ffffff" font-family="Georgia, serif">${line2}</text>` : ''}
  ${sub ? `<text x="60" y="${line2 ? 360 : 300}" font-size="36" font-weight="700" fill="${color}" font-family="Georgia, serif">${sub}</text>` : ''}
  <line x1="60" y1="430" x2="500" y2="430" stroke="${color}" stroke-width="2" opacity="0.5"/>
  <text x="60" y="470" font-size="20" fill="#9a9aaa" font-family="system-ui, sans-serif">${brand.url}</text>
  <circle cx="980" cy="314" r="220" fill="none" stroke="${color}" stroke-width="1" opacity="0.12"/>
  <circle cx="980" cy="314" r="160" fill="none" stroke="${color}" stroke-width="1" opacity="0.08"/>
  <circle cx="980" cy="314" r="100" fill="${color}" opacity="0.04"/>
  <text x="980" y="300" font-size="80" text-anchor="middle" fill="${color}" opacity="0.25" font-family="Georgia, serif">BL</text>
  <text x="980" y="360" font-size="14" text-anchor="middle" fill="${color}" opacity="0.4" font-family="system-ui" letter-spacing="3">BARNES LAM</text>
</svg>`;
}

let wasmInitialized = false;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { draftId, channel, draft_date, content } = await req.json();
    if (!draftId || !channel || !content) {
      return new Response(JSON.stringify({ error: 'draftId, channel, content required' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Initialize WASM once
    if (!wasmInitialized) {
      const wasmRes = await fetch('https://esm.sh/@resvg/resvg-wasm@2.6.0/index_bg.wasm');
      await initWasm(wasmRes);
      wasmInitialized = true;
    }

    const svg = generateSVG(channel, content);
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    const png = resvg.render().asPng();

    const fileName = `${channel}-${draft_date || new Date().toISOString().split('T')[0]}.png`;
    const { error: uploadErr } = await supabase.storage
      .from('graphics')
      .upload(fileName, png, { contentType: 'image/png', upsert: true });

    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

    const { data: { publicUrl } } = supabase.storage.from('graphics').getPublicUrl(fileName);

    await supabase.from('gtm_drafts').update({ graphic_url: publicUrl }).eq('id', draftId);

    return new Response(JSON.stringify({ success: true, graphic_url: publicUrl }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
