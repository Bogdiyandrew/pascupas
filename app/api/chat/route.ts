// app/api/chat/route.ts
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { adminAuth } from '@/lib/firebaseAdmin';

const openai = new OpenAI({
  apiKey: (process.env.OPENAI_API_KEY || '').trim(),
});

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';

const defaultSystemPrompt = `
Ești un psiholog AI empatic, modern și prietenos, care comunică în limba română. Rolul tău este să asculți utilizatorii, să le validezi emoțiile, să le oferi suport emoțional și ghidare practică, fără a oferi diagnostice medicale. Nu înlocuiești terapia umană și nu prescrii tratamente.
Tonul tău este cald, sincer și optimist, dar realist. Eviți clișeele și frazele impersonale. Adaptezi răspunsurile la situația emoțională a utilizatorului, folosind un limbaj simplu și direct.
Dacă discuția devine critică (gânduri suicidale sau risc iminent), încurajezi utilizatorul să contacteze imediat un profesionist și oferi numărul liniei de criză din România: 0800 801 200.
`;

// Helper pentru stream completări
async function streamModel(opts: {
  model: string;
  systemPrompt: string;
  messages: any[];
  signal: AbortSignal;
}) {
  const completion = await openai.chat.completions.create(
    {
      model: opts.model,
      stream: true,
      messages: [{ role: 'system', content: opts.systemPrompt }, ...opts.messages],
      max_completion_tokens: 800,
    },
    { signal: opts.signal }
  );

  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });
}

export async function GET() {
  return new Response('chat ok', { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    // auth debug flags
    const skipAuth = req.headers.get('x-debug-skip-auth') === '1';

    let authenticatedUserId: string | null = null;
    if (!skipAuth) {
      const authorization = req.headers.get('Authorization');
      if (!authorization?.startsWith('Bearer ')) {
        return new Response('Lipsă token de autorizare.', { status: 401 });
      }
      const idToken = authorization.split('Bearer ')[1];
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      authenticatedUserId = decodedToken.uid;
    }

    const { messages, profileData, userId, model } = await req.json();

    if (!skipAuth && authenticatedUserId !== userId) {
      return new Response('Acțiune neautorizată.', { status: 403 });
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response('Lipsesc mesajele din request.', { status: 400 });
    }

    // pregătește systemPrompt cu profilul utilizatorului
    let systemPrompt = defaultSystemPrompt;
    if (profileData && Object.keys(profileData).length > 0) {
      systemPrompt += `\n\nAI-ul ar trebui să țină minte următoarele informații despre utilizator:`;
      if (profileData.name) systemPrompt += `\n- Nume: ${profileData.name}`;
      if (profileData.age) systemPrompt += `\n- Vârstă: ${profileData.age} ani`;
      if (profileData.gender) systemPrompt += `\n- Gen: ${profileData.gender}`;
      if (profileData.location) systemPrompt += `\n- Locație: ${profileData.location}`;
      if (profileData.occupation) systemPrompt += `\n- Ocupație: ${profileData.occupation}`;
    }

    const modelToUse = model || DEFAULT_MODEL;

    // control streaming
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 60_000);

    const stream = await streamModel({
      model: modelToUse,
      systemPrompt,
      messages,
      signal: ac.signal,
    });

    clearTimeout(timer);

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (error: any) {
    console.error('[CHAT_API_ERROR]', error);
    const msg =
      error?.message || 'Eroare internă de server necunoscută.';
    return new Response(`Eroare internă de server: ${msg}`, { status: 500 });
  }
}