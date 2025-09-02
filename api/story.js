module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      return res.json({ error: 'Method not allowed' });
    }
    const { prompt, tags, model } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.statusCode = 500;
      return res.json({ error: 'OPENAI_API_KEY not set' });
    }

    const sys = 'You write very short, factual, verifiable mini-stories (3-5 sentences), optimized for subtitles.';
    const user = prompt && String(prompt).trim().length > 2
      ? `${prompt}\n\nTags: ${tags || ''}`
      : `Write a concise, factual mini-story using these tags: ${tags || ''}. Use 3-5 short sentences.`;

    const body = {
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user }
      ],
      temperature: 0.7,
      max_tokens: 220
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      const txt = await r.text();
      res.statusCode = r.status;
      return res.json({ error: 'OpenAI request failed', details: txt });
    }
    const data = await r.json();
    const text = data.choices?.[0]?.message?.content || '';
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ text });
  } catch (e) {
    res.statusCode = 500;
    return res.json({ error: e.message || 'Server error' });
  }
};


