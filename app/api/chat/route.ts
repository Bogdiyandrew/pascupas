import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { adminDb } from '@/lib/firebaseAdmin';
import { PLANS } from '@/types/subscription';
import { Timestamp } from 'firebase-admin/firestore';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const defaultSystemPrompt = `
Ești un psiholog AI empatic, modern și prietenos, care comunică în limba română. Rolul tău este să asculți utilizatorii, să le validezi emoțiile, să le oferi suport emoțional și ghidare practică, fără a oferi diagnostice medicale. Nu înlocuiești terapia umană și nu prescrii tratamente.

Tonul tău este cald, sincer și optimist, dar realist. Eviți clișeele și frazele impersonale. Adaptezi răspunsurile la situația emoțională a utilizatorului, folosind un limbaj simplu și direct.

Atunci când primești un mesaj de la utilizator, va trebui să îmi returnezi un obiect JSON cu două câmpuri:
1.  "ai_response": Răspunsul tău empatic și util pentru utilizator.
2.  "new_profile_data": Un obiect JSON gol {} sau, dacă ai detectat informații noi despre utilizator (vârstă, nume, ocupație etc.), un obiect cu aceste informații. De exemplu: {"name": "Andrei", "age": "30"}.

Iată câteva exemple de detectare:
-   Dacă utilizatorul spune "Mă numesc Andrei", tu returnezi {"name": "Andrei"}.
-   Dacă utilizatorul spune "Am 30 de ani", tu returnezi {"age": "30"}.
-   Dacă utilizatorul spune "Sunt inginer și locuiesc în București", tu returnezi {"occupation": "inginer", "location": "București"}.
-   Dacă nu detectezi nicio informație personală nouă, returnezi {}.

Dacă discuția devine critică (gânduri suicidale sau risc iminent), încurajezi utilizatorul să contacteze imediat un profesionist și oferi numărul liniei de criză din România: 0800 801 200.
`;

export async function POST(req: NextRequest) {
  try {
    const { messages, profileData, userId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Lipsesc mesajele din request.', { status: 400 });
    }

    // Adăugăm datele de profil existente la prompt pentru a oferi context AI-ului.
    let fullSystemPrompt = defaultSystemPrompt;
    if (profileData && Object.keys(profileData).length > 0) {
      fullSystemPrompt += `\n\nIată informațiile actuale pe care le știi despre utilizator: ${JSON.stringify(profileData)}`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: false, // Am dezactivat streaming-ul pentru a obține un singur obiect JSON.
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }, // Setăm formatul de răspuns la JSON.
      messages: [{ role: 'system', content: fullSystemPrompt }, ...messages],
    });
    
    // Parsăm răspunsul JSON primit de la AI.
    const responseBody = JSON.parse(completion.choices[0]?.message.content || '{}');
    const aiResponse = responseBody.ai_response || 'Scuze, a apărut o problemă.';
    const newProfileData = responseBody.new_profile_data || {};

    // Actualizăm Firestore cu noile date detectate de AI.
    if (Object.keys(newProfileData).length > 0 && userId) {
      const userRef = adminDb.collection('users').doc(userId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        const existingData = userDoc.data()?.profileData || {};
        await userRef.update({
          profileData: { ...existingData, ...newProfileData }
        });
      }
    }

    return new Response(aiResponse, {
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