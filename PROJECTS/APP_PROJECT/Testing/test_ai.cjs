const fetch = globalThis.fetch;

async function testGemini() {
  console.log('Testing Gemini Flash AI invocation...');
  const apiKey = 'AIzaSyCmhDGvaBUQuFCvaDWt037KIgAPZj73Q70';
  const baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai';
  const model = 'gemini-1.5-flash';

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are NyayaMitra legal assistant for Andhra Pradesh.' },
        { role: 'user', content: 'What is the Golden Hour helpline number for cyber fraud?' }
      ]
    })
  });

  console.log('HTTP status:', res.status);
  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content;
  console.log('AI Response:', reply?.slice(0, 200));
  if (res.ok && reply) {
    console.log('[PASS] NYAYA AI Integration: Gemini API successfully responded');
  } else {
    console.log('[FAIL] NYAYA AI Integration error:', data);
  }
}

testGemini().catch(console.error);
