import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Loader2,
  MessageCircle,
  Send,
  ShieldCheck,
  X
} from 'lucide-react';
import crmApi from '../lib/crmApi';

const SESSION_KEY = 'datalab-assistant-session';

const offlineReply = (message, language) => {
  const text = message.toLowerCase();
  const has = (...terms) => terms.some((term) => text.includes(term));

  if (has('ticket', 'status', 'ტიკეტ', 'სტატუს')) {
    return language === 'en'
      ? 'For privacy, the assistant cannot open CRM records. Use Case Tracking with your ticket code or phone number.'
      : 'კონფიდენციალურობის გამო ბოტს CRM ჩანაწერებზე წვდომა არ აქვს. გამოიყენეთ „საქმის თვალთვალი“ ტიკეტის კოდით ან ტელეფონის ნომრით.';
  }
  if (has('price', 'cost', 'ფასი', 'ღირს')) {
    return language === 'en'
      ? 'Indicative prices: HDD from 150 GEL, SSD from 300 GEL, USB/SD/microSD from 150 GEL, and RAID from 500 GEL. The exact quote is confirmed after diagnostics.'
      : 'საორიენტაციო ფასებია: HDD — 150 ₾-დან, SSD — 300 ₾-დან, USB/SD/microSD — 150 ₾-დან, RAID — 500 ₾-დან. ზუსტი ფასი დიაგნოსტიკის შემდეგ დგინდება.';
  }
  if (has('ssd')) {
    return language === 'en'
      ? 'Stop using the SSD and do not format or reinstall the system. Submit a service request with the model and symptoms. SSD recovery starts from 300 GEL.'
      : 'SSD აღარ გამოიყენოთ, არ დააფორმატოთ და სისტემა არ გადააყენოთ. მოგვწერეთ მოდელი და სიმპტომები. SSD აღდგენა 300 ₾-დან იწყება.';
  }
  if (has('hdd', 'hard drive', 'ვინჩესტერ', 'მყარი დისკ')) {
    return language === 'en'
      ? 'If the HDD clicks, was dropped or is not detected, power it off and do not open it. HDD recovery starts from 150 GEL after diagnostics.'
      : 'თუ HDD წკაპუნებს, დავარდა ან აღარ იკითხება, გამორთეთ და თავად არ გახსნათ. აღდგენა დიაგნოსტიკის შემდეგ 150 ₾-დან იწყება.';
  }
  if (has('usb', 'microsd', 'sd card', 'ფლეშ', 'sd ბარ')) {
    return language === 'en'
      ? 'Stop using the USB/SD device. Do not format it or copy new files onto it. Indicative recovery price starts from 150 GEL.'
      : 'USB/SD მოწყობილობა აღარ გამოიყენოთ, არ დააფორმატოთ და ახალი ფაილები არ ჩაწეროთ. აღდგენა 150 ₾-დან იწყება.';
  }
  if (has('raid')) {
    return language === 'en'
      ? 'Do not rebuild or initialize the RAID and do not change disk order. Turn it off and submit a service request. Recovery starts from 500 GEL.'
      : 'არ გაუშვათ RAID rebuild/initialize და არ შეცვალოთ დისკების რიგი. გამორთეთ სისტემა და გამოგვიგზავნეთ მოთხოვნა. აღდგენა 500 ₾-დან იწყება.';
  }
  if (has('deleted', 'formatted', 'წაიშალა', 'ფორმატ')) {
    return language === 'en'
      ? 'Stop writing new data to the device. Do not format it again or install recovery software on the same drive.'
      : 'მოწყობილობაზე ახალი მონაცემები აღარ ჩაწეროთ. აღარ დააფორმატოთ და აღდგენის პროგრამაც იმავე დისკზე არ დააყენოთ.';
  }
  return language === 'en'
    ? 'I can only help with DataLab Georgia data-recovery services, prices, safe first steps and ticket tracking. Tell me whether the device is HDD, SSD, USB/SD or RAID.'
    : 'მე მხოლოდ DataLab Georgia-ს მონაცემთა აღდგენაზე, ფასებზე, უსაფრთხო პირველ ნაბიჯებსა და ტიკეტის თვალთვალზე დაგეხმარებით. მითხარით: HDD, SSD, USB/SD თუ RAID გაქვთ?';
};

const copy = {
  ka: {
    title: 'DataLab ასისტენტი',
    trial: 'უფასო საცდელი',
    intro: 'გამარჯობა! დაგეხმარებით მონაცემთა აღდგენის სერვისებზე, ფასებზე და უსაფრთხო პირველ ნაბიჯებზე. რა მოწყობილობა გაქვთ?',
    placeholder: 'მომწერეთ თქვენი კითხვა…',
    send: 'გაგზავნა',
    open: 'AI ასისტენტის გახსნა',
    close: 'AI ასისტენტის დახურვა',
    privacy: 'არ გამოგზავნოთ პაროლი, საბანკო ან სხვა კონფიდენციალური ინფორმაცია.',
    error: 'პასუხის მიღება ვერ მოხერხდა. სცადეთ ხელახლა ან დაგვიკავშირდით.',
    limited: 'შეტყობინებების ლიმიტი ამოიწურა. გთხოვთ, ცოტა მოგვიანებით სცადოთ.',
    prompts: [
      'რა ღირს HDD აღდგენა?',
      'SSD აღარ იკითხება, რა გავაკეთო?',
      'როგორ ვნახო ტიკეტის სტატუსი?'
    ]
  },
  en: {
    title: 'DataLab Assistant',
    trial: 'Free trial',
    intro: 'Hello! I can help with data-recovery services, prices and safe first steps. Which device do you have?',
    placeholder: 'Type your question…',
    send: 'Send',
    open: 'Open AI assistant',
    close: 'Close AI assistant',
    privacy: 'Do not send passwords, payment details or other confidential information.',
    error: 'I could not get a response. Please retry or contact us directly.',
    limited: 'The message limit has been reached. Please try again a little later.',
    prompts: [
      'How much is HDD recovery?',
      'My SSD is not detected. What should I do?',
      'How can I track my ticket?'
    ]
  }
};

const getSessionId = () => {
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) return existing;

  const generated = window.crypto?.randomUUID
    ? window.crypto.randomUUID().replaceAll('-', '')
    : `session_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  window.localStorage.setItem(SESSION_KEY, generated);
  return generated;
};

const AiAssistant = ({ language }) => {
  const t = copy[language] || copy.ka;
  const sessionId = useMemo(getSessionId, []);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: t.intro }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages([{ role: 'assistant', content: t.intro }]);
    setInput('');
    setError('');
  }, [language, t.intro]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, isSending]);

  const sendMessage = async (rawMessage = input) => {
    const message = rawMessage.trim();
    if (!message || isSending) return;

    const priorHistory = messages.slice(-6).map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { role: 'user', content: message }]);
    setInput('');
    setError('');
    setIsSending(true);

    try {
      const response = await crmApi.post(
        '/public/assistant',
        {
          message,
          language,
          session_id: sessionId,
          history: priorHistory
        },
        { timeout: 50000 }
      );
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: response.data.reply }
      ]);
    } catch (requestError) {
      const status = requestError?.response?.status;
      if (status === 429) {
        setError(t.limited);
      } else if (!requestError?.response || status === 404) {
        setMessages((current) => [
          ...current,
          { role: 'assistant', content: offlineReply(message, language) }
        ]);
      } else {
        setError(t.error);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {isOpen && (
        <section
          className="fixed bottom-24 right-4 sm:right-6 z-[80] flex h-[min(610px,calc(100vh-8rem))] w-[calc(100vw-2rem)] sm:w-[390px] flex-col overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl shadow-black/50"
          role="dialog"
          aria-label={t.title}
        >
          <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-accent text-white shadow-lg shadow-red-500/20">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0 text-left">
                <h2 className="truncate font-semibold text-white">{t.title}</h2>
                <span className="inline-flex items-center gap-1 text-xs text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  {t.trial}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-700 hover:text-white"
              aria-label={t.close}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[86%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-left text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'rounded-br-md bg-red-accent text-white'
                      : 'rounded-bl-md border border-gray-700 bg-gray-800 text-gray-200'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {messages.length === 1 && (
              <div className="space-y-2 pt-1">
                {t.prompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="block w-full rounded-xl border border-gray-700 bg-gray-800/70 px-3 py-2 text-left text-xs text-gray-300 hover:border-red-500/60 hover:bg-gray-800 hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {isSending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>...</span>
                </div>
              </div>
            )}
            {error && (
              <p className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-left text-xs text-red-200">
                {error}
              </p>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-700 bg-gray-800/80 p-3">
            <div className="mb-2 flex items-start gap-1.5 text-left text-[11px] leading-4 text-gray-400">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
              <span>{t.privacy}</span>
            </div>
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value.slice(0, 800))}
                onKeyDown={handleKeyDown}
                placeholder={t.placeholder}
                rows={1}
                className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-gray-600 bg-gray-900 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                disabled={isSending}
                aria-label={t.placeholder}
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isSending}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-accent text-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={t.send}
              >
                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="fixed bottom-6 right-6 right-scroll-bar-position z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-red-accent text-white shadow-lg shadow-red-500/30 hover:scale-110 hover:bg-red-600"
        aria-label={isOpen ? t.close : t.open}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
};

export default AiAssistant;
