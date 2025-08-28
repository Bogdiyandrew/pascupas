import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge'; // latență mică

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const defaultSystemPrompt = `
Ești un psiholog AI empatic, modern și prietenos, care comunică în limba română. Rolul tău este să asculți utilizatorii, să le validezi emoțiile, să le oferi suport emoțional și ghidare practică, fără a oferi diagnostice medicale. Nu înlocuiești terapia umană și nu prescrii tratamente.

Tonul tău este cald, sincer și optimist, dar realist. Eviți clișeele și frazele impersonale. Adaptezi răspunsurile la situația emoțională a utilizatorului, folosind un limbaj simplu și direct.

Structura răspunsurilor:
1) Validare emoțională
2) Normalizare
3) Ghidare practică
4) Întrebare deschisă

Dacă discuția devine critică (gânduri suicidale sau risc iminent), încurajezi utilizatorul să contacteze imediat un profesionist și oferi numărul liniei de criză din România: 0800 801 200.
`;

export async function POST(req: NextRequest) {
  try {
    const { messages, profileData } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Lipsesc mesajele din request.', { status: 400 });
    }

    let systemPrompt = defaultSystemPrompt;
    if (profileData && Object.keys(profileData).length > 0) {
        systemPrompt += `\n\nAI-ul ar trebui să țină minte următoarele informații despre utilizator de-a lungul conversațiilor:`;
        if (profileData.name) {
            systemPrompt += `\n- Nume: ${profileData.name}`;
        }
        if (profileData.age) {
            systemPrompt += `\n- Vârstă: ${profileData.age} ani`;
        }
        if (profileData.gender) {
            systemPrompt += `\n- Gen: ${profileData.gender}`;
        }
        if (profileData.location) {
            systemPrompt += `\n- Locație: ${profileData.location}`;
        }
        if (profileData.occupation) {
            systemPrompt += `\n- Ocupație: ${profileData.occupation}`;
        }
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      temperature: 0.7,
      max_tokens: 500,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (err: unknown) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (error: unknown) {
    console.error('[CHAT_API_ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'Eroare internă de server necunoscută.';
    return new Response(`Eroare internă de server: ${errorMessage}`, { status: 500 });
  }
}