export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Метод не поддерживается.' });
  }
  const origin = request.headers.origin;
  if (!origin || origin !== `https://${request.headers.host}`) {
    return response.status(403).json({ error: 'Недопустимый источник запроса.' });
  }
  if (!request.headers['content-type']?.startsWith('application/json')) {
    return response.status(415).json({ error: 'Ожидается JSON.' });
  }
  let body;
  try { body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body; }
  catch { return response.status(400).json({ error: 'Некорректный запрос.' }); }
  if (!body || typeof body !== 'object') return response.status(400).json({ error: 'Заполните форму.' });
  if (body.website) return response.status(200).json({ ok: true });
  const limits = { name: 100, company: 150, email: 200, task: 2500 };
  const fields = {};
  for (const [field, limit] of Object.entries(limits)) {
    if (typeof body[field] !== 'string' || !body[field].trim() || body[field].length > limit) {
      return response.status(400).json({ error: 'Проверьте заполнение полей.' });
    }
    fields[field] = body[field].trim();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) return response.status(400).json({ error: 'Проверьте адрес почты.' });
  if (body.consent !== true) return response.status(400).json({ error: 'Подтвердите согласие на отправку данных.' });
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return response.status(503).json({ error: 'Отправка временно недоступна.' });
  try {
    const result = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: `ASTER — заявка с сайта\n\nИмя: ${fields.name}\nКомпания: ${fields.company}\nEmail: ${fields.email}\n\nЗадача:\n${fields.task}` }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await result.json();
    if (!result.ok || !data.ok) throw new Error('Delivery failed');
    return response.status(200).json({ ok: true });
  } catch {
    return response.status(502).json({ error: 'Не удалось подтвердить доставку. Попробуйте позже.' });
  }
}
