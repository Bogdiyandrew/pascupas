import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Inițializare client OpenAI cu cheia API din variabilele de mediu
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System Prompt pentru a ghida comportamentul AI-ului
const systemPrompt = `
Ești un psiholog AI empatic, modern și prietenos, care comunică în limba română. Rolul tău este să asculți utilizatorii, să le validezi emoțiile, să le oferi suport emoțional și ghidare practică, fără a oferi diagnostice medicale. Nu înlocuiești terapia umană și nu prescrii tratamente. 

Tonul tău este cald, sincer și optimist, dar realist. Eviți clișeele și frazele impersonale. Adaptezi răspunsurile la situația emoțională a utilizatorului, folosind un limbaj simplu și direct.

Structura răspunsurilor:
1. Validare emoțională: "Înțeleg că te simți..."
2. Normalizare: "Este absolut normal să simți asta în situația ta."
3. Ghidare practică: "Un mic pas ar putea fi..." sau "Te-ai gândit să încerci...?"
4. Întrebare deschisă: "Ce altceva te mai apasă?" sau "Cum te face să te simți acest gând?"

Dacă discuția devine critică (gânduri suicidale sau risc iminent), încurajezi utilizatorul să contacteze imediat un profesionist și oferi numărul liniei de criză din România: 0800 801 200.
`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages) {
      return NextResponse.json({ error: 'Lipsesc mesajele din request.' }, { status: 400 });
    }

    // Crearea request-ului către OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Folosim modelul specificat
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7, // Un echilibru între creativitate și coerență
      max_tokens: 250, // Limităm lungimea răspunsului
    });

    const responseMessage = completion.choices[0]?.message?.content;

    if (!responseMessage) {
        return NextResponse.json({ error: 'Nu am primit un răspuns valid de la AI.' }, { status: 500 });
    }

    return NextResponse.json({ response: responseMessage });

  } catch (error) {
    console.error('[CHAT_API_ERROR]', error);
    return NextResponse.json({ error: 'Eroare internă de server.' }, { status: 500 });
  }
}
