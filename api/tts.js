module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      return res.json({ error: 'Method not allowed' });
    }
    const { text, voiceId } = req.body || {};
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      res.statusCode = 500;
      return res.json({ error: 'ELEVENLABS_API_KEY not set' });
    }
    if (!text || !String(text).trim()) {
      res.statusCode = 400;
      return res.json({ error: 'Missing text' });
    }
    const vId = voiceId || '21m00Tcm4TlvDq8ikWAM';
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(vId)}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: { stability: 0.5, similarity_boost: 0.7 }
      })
    });
    if (!r.ok) {
      const txt = await r.text();
      res.statusCode = r.status;
      return res.json({ error: 'ElevenLabs request failed', details: txt });
    }
    const arrayBuf = await r.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    return res.status(200).send(Buffer.from(arrayBuf));
  } catch (e) {
    res.statusCode = 500;
    return res.json({ error: e.message || 'Server error' });
  }
};


