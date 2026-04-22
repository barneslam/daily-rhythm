import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resvg, initWasm } from 'https://esm.sh/@resvg/resvg-wasm@2.6.0';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const brandConfig: Record<string, { color: string; label: string; url: string }> = {
  the_strategy_pitch: { color: '#2563eb', label: 'THE STRATEGY PITCH', url: 'thestrategypitch.com' },
  barneslam_co:       { color: '#c9a84c', label: 'BARNES LAM',         url: 'barneslam.co'        },
  axis_chamber:       { color: '#16a34a', label: 'AXIS CHAMBER',       url: 'axischamber.org'     },
};

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function extractLines(content: string): { line1: string; line2: string; sub: string } {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const headline = lines[0]?.slice(0, 50) || 'Growth Insight';
  const sub = lines.find((l, i) => i > 0 && l.length > 8)?.slice(0, 68) || '';
  const words = headline.split(' ');
  const mid = Math.ceil(words.length / 2);
  return { line1: words.slice(0, mid).join(' '), line2: words.slice(mid).join(' '), sub };
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function fetchPhotoBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${toBase64(new Uint8Array(buf))}`;
  } catch {
    return null;
  }
}

function generateSVG(channel: string, content: string, photoDataUri: string | null): string {
  const brand = brandConfig[channel] || brandConfig.barneslam_co;
  const { line1, line2, sub } = extractLines(content);
  const c = brand.color;
  const subY = line2 ? 378 : 318;

  if (photoDataUri) {
    // Photo background with dark gradient overlay + text
    return `<svg viewBox="0 0 1200 628" xmlns="http://www.w3.org/2000/svg" width="1200" height="628">
  <defs>
    <linearGradient id="overlay" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.82"/>
      <stop offset="55%" stop-color="#000000" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.10"/>
    </linearGradient>
  </defs>
  <image href="${photoDataUri}" x="0" y="0" width="1200" height="628" preserveAspectRatio="xMidYMid slice"/>
  <rect width="1200" height="628" fill="url(#overlay)"/>
  <rect width="1200" height="6" fill="${c}"/>
  <rect x="0" y="0" width="5" height="628" fill="${c}"/>
  <rect x="60" y="78" width="250" height="36" rx="4" fill="${c}" opacity="0.25"/>
  <text x="74" y="104" font-size="13" font-family="Inter" fill="#ffffff" letter-spacing="2">${esc(brand.label)}</text>
  <text x="60" y="218" font-size="60" font-family="Inter" fill="#ffffff">${esc(line1)}</text>
  ${line2 ? `<text x="60" y="292" font-size="60" font-family="Inter" fill="#ffffff">${esc(line2)}</text>` : ''}
  ${sub ? `<text x="60" y="${subY}" font-size="28" font-family="Inter" fill="${c}">${esc(sub)}</text>` : ''}
  <line x1="60" y1="448" x2="460" y2="448" stroke="${c}" stroke-width="2" opacity="0.7"/>
  <text x="60" y="482" font-size="17" font-family="Inter" fill="#dddddd">${esc(brand.url)}</text>
</svg>`;
  }

  // Fallback: dark geometric design
  return `<svg viewBox="0 0 1200 628" xmlns="http://www.w3.org/2000/svg" width="1200" height="628">
  <defs>
    <pattern id="g" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#ffffff" stroke-width="0.3" opacity="0.06"/>
    </pattern>
  </defs>
  <rect width="1200" height="628" fill="#0d0f1a"/>
  <rect width="1200" height="628" fill="url(#g)"/>
  <rect width="1200" height="6" fill="${c}"/>
  <rect x="0" y="0" width="5" height="628" fill="${c}"/>
  <rect x="60" y="78" width="250" height="36" rx="4" fill="${c}" opacity="0.18"/>
  <text x="74" y="104" font-size="13" font-family="Inter" fill="${c}" letter-spacing="2">${esc(brand.label)}</text>
  <text x="60" y="218" font-size="60" font-family="Inter" fill="#ffffff">${esc(line1)}</text>
  ${line2 ? `<text x="60" y="292" font-size="60" font-family="Inter" fill="#ffffff">${esc(line2)}</text>` : ''}
  ${sub ? `<text x="60" y="${subY}" font-size="30" font-family="Inter" fill="${c}">${esc(sub)}</text>` : ''}
  <line x1="60" y1="448" x2="460" y2="448" stroke="${c}" stroke-width="2" opacity="0.5"/>
  <text x="60" y="482" font-size="17" font-family="Inter" fill="#9a9aaa">${esc(brand.url)}</text>
  <circle cx="980" cy="314" r="220" fill="none" stroke="${c}" stroke-width="1" opacity="0.12"/>
  <circle cx="980" cy="314" r="155" fill="none" stroke="${c}" stroke-width="1" opacity="0.08"/>
  <circle cx="980" cy="314" r="90" fill="${c}" opacity="0.05"/>
</svg>`;
}

let wasmReady = false;
let cachedFont: Uint8Array | null = null;

async function getFont(): Promise<Uint8Array> {
  if (cachedFont) return cachedFont;
  const res = await fetch(
    'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.1.0/files/inter-latin-400-normal.woff2'
  );
  if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`);
  cachedFont = new Uint8Array(await res.arrayBuffer());
  return cachedFont;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { draftId, channel, draft_date, content, photoUrl } = await req.json();
    if (!draftId || !channel || !content) {
      return new Response(JSON.stringify({ error: 'draftId, channel, content required' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (!wasmReady) {
      await initWasm(await fetch('https://esm.sh/@resvg/resvg-wasm@2.6.0/index_bg.wasm'));
      wasmReady = true;
    }

    const [font, photoDataUri] = await Promise.all([
      getFont(),
      photoUrl ? fetchPhotoBase64(photoUrl) : Promise.resolve(null),
    ]);

    const svg = generateSVG(channel, content, photoDataUri);

    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
      font: { loadSystemFonts: false, fontBuffers: [font] },
    });
    const png = resvg.render().asPng();

    const fileName = `${channel}-${draft_date || new Date().toISOString().split('T')[0]}-${draftId}.png`;
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
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
