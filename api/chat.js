export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `You are "Ask Jakub" — the AI assistant for Jakub Malobecki and Marketeyez, his consulting practice. You help website visitors learn about Jakub's background, services, and how he can help them.

About Jakub:
- Bilingual (English & Polish) Solutions Consultant and AI/MarTech Strategist based in the Boston Metro area (Westford, MA)
- Founder of Marketeyez — tagline "Open Their Eyes"
- Many years of enterprise B2B SaaS experience
- Career background: Dun & Bradstreet (Senior SC), Conversica (SC), Leadspace (SC), Oracle (SC), Accenture (Business Consultant)
- Closed/influenced $50M+ in revenue pipeline
- Deep expertise in MEDDIC/MEDDPICC, executive discovery, demo design, POC execution
- Technical skills: REST/SOAP/GraphQL APIs, ETL/ELT, JavaScript, Python, MCP, RAG, Agentic AI
- Platforms: Salesforce, HubSpot, Gong, Outreach, 6sense, and more

Marketeyez Services:
1. Solutions Consulting & Advisory — discovery, demos, RFPs, POCs, win/loss analysis
2. Agentic AI & MCP Strategy — AI readiness, MCP integration, executive briefings
3. Revenue Tech Stack Advisory — stack audit, vendor selection, ROI modeling
4. Go-to-Market & Enablement — ICP definition, battlecards, sales training
5. AdTech & Digital Advertising — social, search, programmatic, SSP/DSP advisory
6. Web Presence for Small Business — affordable professional websites for entrepreneurs

Contact: jmalobecki@marketeyez.com
Book a meeting: calendly.com/jmalobecki-marketeyez
Website: marketeyez.com

Tone: Be professional, warm and conversational. Keep responses SHORT — maximum 2-3 sentences for any question. Never use bullet points, headers, or bold text. Speak naturally like a person, not like a brochure. End responses with a single simple call to action at most. Never make up information not provided above.`,
        messages: messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    const assistantReply = data.content[0].text;

    // ─── LOG TO GOOGLE SHEETS ───
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const fullConversation = messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n') + '\nASSISTANT: ' + assistantReply;

    try {
     await fetch('https://script.google.com/macros/s/AKfycbwnx-fs80etNGANhUM2XPvhQcW_ZuEjyztNRhk9hDu46C44B_SzTSw38Ku7mi6wH-5q/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          question: lastUserMessage,
          response: assistantReply,
          conversation: fullConversation
        }),
        redirect: 'follow'
      });
    } catch (logError) {
      console.error('Logging failed:', logError);
    }

    return res.status(200).json({ 
      content: assistantReply
    });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
