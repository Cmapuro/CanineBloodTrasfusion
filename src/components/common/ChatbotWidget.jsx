import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { askChatbot, submitChatbotFeedback } from '../../services/chatbotService'

const suggestionsByRole = {
  donor: ['How do I register my dog?', 'Who checks donor eligibility?', 'When is my location shared?'],
  hospital: ['How do emergency requests work?', 'What should we do after a donor accepts?', 'Why is crossmatching needed?'],
  admin: ['How does CanineLink work?', 'What blood types do dogs have?', 'Who decides donor eligibility?'],
  public: ['How does canine blood donation work?', 'What are canine blood types?', 'How can I register my dog?'],
}

function messageFromError(error) {
  return error.response?.data?.message || 'The chatbot could not respond. Check your connection and try again.'
}

export default function ChatbotWidget() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const role = user?.role || 'public'
  const suggestions = suggestionsByRole[role] || suggestionsByRole.public

  const send = async (message = input) => {
    const question = message.trim()
    if (!question || sending) return

    setInput('')
    setError('')
    setSending(true)
    setMessages((current) => [...current, { type: 'user', text: question }])

    try {
      const result = await askChatbot(question)
      setMessages((current) => [...current, {
        type: 'assistant',
        text: result.answer,
        faqId: result.faq_id,
        reference: result.conversation_reference,
      }])
    } catch (requestError) {
      setInput(question)
      setError(messageFromError(requestError))
    } finally {
      setSending(false)
    }
  }

  const rate = async (message, rating) => {
    try {
      await submitChatbotFeedback({
        conversation_reference: message.reference,
        faq_id: message.faqId,
        rating,
      })
      setMessages((current) => current.map((item) => item === message ? { ...item, rated: rating } : item))
    } catch (feedbackError) {
      setError(messageFromError(feedbackError))
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[120]">
      {open && (
        <section className="mb-3 flex h-[min(620px,calc(100vh-110px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border border-red-100 bg-white shadow-2xl" aria-label="CanineLink chatbot">
          <header className="flex items-center justify-between bg-gradient-to-r from-blood-dark to-blood-red px-5 py-4 text-white">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-100/80">CanineLink assistant</p>
              <p className="mt-1 text-sm font-semibold">{role === 'public' ? 'Public information' : `${role[0].toUpperCase()}${role.slice(1)} help`}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-white/80 hover:bg-white/15 hover:text-white" aria-label="Close chatbot">×</button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4" aria-live="polite">
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              Do not share names, contact details, exact locations, or medical records here. This assistant provides general information only; veterinary decisions belong to a licensed veterinarian.
              If an AI provider is configured, general questions may be sent with approved FAQ references to generate an answer. Personal or account-specific questions are not sent. CanineLink does not save chat transcripts.
            </p>
            {messages.length === 0 && (
              <div>
                <p className="mb-3 text-sm text-slate-600">Ask a question or choose a suggestion:</p>
                <div className="space-y-2">
                  {suggestions.map((suggestion) => (
                    <button key={suggestion} type="button" onClick={() => send(suggestion)} className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:border-rose-300 hover:text-blood-red">
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={`${message.type}-${index}`} className={message.type === 'user' ? 'ml-8 rounded-2xl rounded-br-md bg-blood-red px-4 py-3 text-sm leading-6 text-white' : 'mr-4 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700'}>
                <p className="whitespace-pre-wrap">{message.text}</p>
                {message.type === 'assistant' && message.reference && (
                  <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
                    {message.rated
                      ? <span>Thanks for your feedback.</span>
                      : <>
                        <span>Was this helpful?</span>
                        <button type="button" onClick={() => rate(message, 'helpful')} className="rounded-md px-2 py-1 hover:bg-emerald-50 hover:text-emerald-700" aria-label="Helpful">Yes</button>
                        <button type="button" onClick={() => rate(message, 'not_helpful')} className="rounded-md px-2 py-1 hover:bg-rose-50 hover:text-rose-700" aria-label="Not helpful">No</button>
                      </>}
                  </div>
                )}
              </div>
            ))}
            {sending && <p className="text-sm text-slate-500" role="status">Looking through approved CanineLink information…</p>}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
                <p>{error}</p>
                <button type="button" onClick={() => send()} className="mt-2 font-semibold underline">Retry</button>
              </div>
            )}
          </div>

          <form onSubmit={(event) => { event.preventDefault(); send() }} className="flex gap-2 border-t border-slate-200 bg-white p-3">
            <label className="sr-only" htmlFor="caninelink-chat-message">Your question</label>
            <input id="caninelink-chat-message" value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000} placeholder="Ask a general question…" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400" />
            <button type="submit" disabled={sending || !input.trim()} className="rounded-xl bg-blood-red px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Send</button>
          </form>
        </section>
      )}
      <button type="button" onClick={() => setOpen((current) => !current)} className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-blood-red text-white shadow-xl ring-4 ring-white hover:bg-blood-dark" aria-label={open ? 'Close CanineLink assistant' : 'Open CanineLink assistant'}>
        {open ? <span className="text-2xl leading-none">×</span> : <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 016.5 3h11A2.5 2.5 0 0120 5.5v8a2.5 2.5 0 01-2.5 2.5H11l-5.5 4v-4.2A2.5 2.5 0 014 13.5v-8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M8 8h8M8 12h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>}
      </button>
    </div>
  )
}
