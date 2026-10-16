import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    setStatus('sending');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(fields), consent: fields.get('consent') === 'on' }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'Отправка не удалась.');
      form.reset();
      setStatus('success');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Ошибка сети. Попробуйте позже.');
      setStatus('error');
    }
  }
  return <form onSubmit={submit} className="contact-form">
    <div className="form-row"><label>Ваше имя<input name="name" autoComplete="name" placeholder="Александр" required maxLength={100} /></label><label>Компания<input name="company" autoComplete="organization" placeholder="Название компании" required maxLength={150} /></label></div>
    <label>Рабочая почта<input name="email" type="email" autoComplete="email" placeholder="you@company.ru" required maxLength={200} /></label>
    <label>О вашей задаче<textarea name="task" placeholder="Платформа, условия эксплуатации, требования к навигации…" rows={3} required maxLength={2500} /></label>
    <div hidden aria-hidden="true"><label>Сайт<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <label className="contact-consent"><input name="consent" type="checkbox" required />Согласен на передачу введённых данных команде Aster через Telegram для ответа на заявку.</label>
    <button type="submit" className="button button-dark" disabled={status === 'sending'}>{status === 'sending' ? 'Отправляем…' : 'Отправить заявку'}{status === 'success' ? <Check size={17} /> : <ArrowUpRight size={17} />}</button>
    <p className="form-note" role="status" aria-live="polite">{status === 'success' ? 'Заявка доставлена команде Aster в Telegram.' : status === 'error' ? error : 'Заявка поступит команде Aster в Telegram. Данные не публикуются на сайте.'}</p>
  </form>;
}
