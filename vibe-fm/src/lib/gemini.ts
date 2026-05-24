import { SonicProfile } from '../types';

interface GeminiParsed { qualitativeDescription: string; sonicProfile: SonicProfile; }

export function parseGemini(content: string): GeminiParsed {
  try {
    const o = JSON.parse(content);
    return {
      qualitativeDescription: o.qualitativeDescription ?? 'Description unavailable.',
      sonicProfile: {
        name: o.sonicProfile?.name ?? 'Unclassified',
        tags: Array.isArray(o.sonicProfile?.tags) ? o.sonicProfile.tags : [],
      },
    };
  } catch {
    return { qualitativeDescription: 'Description unavailable.', sonicProfile: { name: 'Unclassified', tags: [] } };
  }
}

export async function synthesize(features: object, sonicProfiles: object): Promise<GeminiParsed> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      response_format: { type: 'json_object' },
      reasoning: { exclude: true },
      messages: [{
        role: 'user',
        content: `Given this track's acoustic data: ${JSON.stringify(features)}, and these sonic archetype profiles: ${JSON.stringify(sonicProfiles)}, return ONLY a JSON object with: {"qualitativeDescription": "2-3 sentences describing the sonic texture and emotional character", "sonicProfile": { "name": "matched archetype name", "tags": ["tag1","tag2"] }}`,
      }],
    }),
  });
  const json = await res.json();
  return parseGemini(json?.choices?.[0]?.message?.content ?? '');
}
