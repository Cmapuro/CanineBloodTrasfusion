import React, { useEffect, useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import {
  approveChatbotFaq,
  createChatbotFaq,
  deleteChatbotFaq,
  disableChatbotFaq,
  evaluateChatbotKnowledge,
  getChatbotFaqHistory,
  getChatbotKnowledge,
  reviewChatbotSuggestion,
  rollbackChatbotFaq,
  updateChatbotFaq,
} from '../../services/chatbotService'

const emptyFaq = {
  question: '',
  approved_answer: '',
  category: 'general',
  visibility_scope: 'public',
  keywords: '',
  expires_at: '',
  change_reason: '',
}

const scopes = ['public', 'donor', 'clinic', 'internal']

function errorText(error) {
  return error.response?.data?.message || 'The request failed. Please try again.'
}

export default function ChatbotKnowledgePage() {
  const [knowledge, setKnowledge] = useState(null)
  const [faq, setFaq] = useState(emptyFaq)
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [history, setHistory] = useState(null)
  const [testQuestion, setTestQuestion] = useState('')
  const [testScope, setTestScope] = useState('public')
  const [testFaqId, setTestFaqId] = useState('')
  const [testResult, setTestResult] = useState(null)

  const refresh = async () => setKnowledge(await getChatbotKnowledge())

  useEffect(() => {
    refresh().catch((error) => setNotice(errorText(error)))
  }, [])

  const runAction = async (action, successMessage) => {
    setBusy(true)
    setNotice('')
    try {
      await action()
      await refresh()
      setNotice(successMessage)
    } catch (error) {
      setNotice(errorText(error))
    } finally {
      setBusy(false)
    }
  }

  const submitFaq = async (event) => {
    event.preventDefault()
    await runAction(async () => {
      const payload = {
        ...faq,
        expires_at: faq.expires_at || null,
      }
      if (editingId) await updateChatbotFaq(editingId, payload)
      else await createChatbotFaq(payload)
      setFaq(emptyFaq)
      setEditingId(null)
    }, editingId ? 'FAQ saved as a draft. Review and approve it to publish.' : 'FAQ draft created.')
  }

  const editFaq = (item) => {
    setEditingId(item.id)
    setFaq({
      question: item.question,
      approved_answer: item.approved_answer,
      category: item.category,
      visibility_scope: item.visibility_scope,
      keywords: item.keywords || '',
      expires_at: item.expires_at ? item.expires_at.slice(0, 10) : '',
      change_reason: '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const reviewSuggestion = (suggestion, decision) => runAction(() => {
    const draft = window.prompt('Review the proposed answer before approval. Leave blank to provide no answer:', suggestion.proposed_answer || '')
    if (decision === 'approve' && !draft?.trim()) {
      throw new Error('Provide a reviewed answer before approving this suggestion.')
    }
    const question = decision === 'approve'
      ? window.prompt('Review or rewrite the FAQ question:', suggestion.proposed_question)
      : suggestion.proposed_question
    if (decision === 'approve' && !question?.trim()) {
      throw new Error('Provide a reviewed FAQ question before approval.')
    }
    return reviewChatbotSuggestion(suggestion.id, decision, decision === 'approve' ? {
      question: question.trim(),
      answer: draft.trim(),
      category: suggestion.category,
      visibility_scope: suggestion.visibility_scope,
    } : {})
  }, `Suggestion ${decision === 'approve' ? 'approved as a draft' : 'rejected'}.`)

  const runEvaluation = async (event) => {
    event.preventDefault()
    await runAction(async () => {
      const result = await evaluateChatbotKnowledge(testQuestion, testScope, testFaqId)
      setTestResult(result)
    }, 'Evaluation completed. A reviewer must verify answer quality.')
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blood-red">Knowledge review</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Chatbot FAQ management</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Only approved, unexpired FAQs are used to answer users. Changes are saved as drafts until reviewed. Chat transcripts and unanswered question text are not retained.</p>
      </div>

      {notice && <p className="mb-5 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700" role="status">{notice}</p>}

      <section className="card mb-8">
        <h2 className="mb-4 text-xl font-bold">{editingId ? 'Edit FAQ draft' : 'Create FAQ draft'}</h2>
        <form onSubmit={submitFaq} className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Question
            <input required maxLength={255} value={faq.question} onChange={(event) => setFaq({ ...faq, question: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3" />
          </label>
          <label className="text-sm font-medium text-slate-700">Category
            <input required maxLength={80} value={faq.category} onChange={(event) => setFaq({ ...faq, category: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3" />
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">Approved answer (kept in draft until approved)
            <textarea required rows={4} maxLength={10000} value={faq.approved_answer} onChange={(event) => setFaq({ ...faq, approved_answer: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3" />
          </label>
          <label className="text-sm font-medium text-slate-700">Visibility
            <select value={faq.visibility_scope} onChange={(event) => setFaq({ ...faq, visibility_scope: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3">
              {scopes.map((scope) => <option key={scope} value={scope}>{scope}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">Review/expiry date
            <input type="date" value={faq.expires_at} onChange={(event) => setFaq({ ...faq, expires_at: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3" />
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">Search keywords
            <input value={faq.keywords} onChange={(event) => setFaq({ ...faq, keywords: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3" />
          </label>
          {editingId && <label className="text-sm font-medium text-slate-700 md:col-span-2">Change reason
            <input maxLength={500} value={faq.change_reason} onChange={(event) => setFaq({ ...faq, change_reason: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3" />
          </label>}
          <div className="flex gap-3 md:col-span-2">
            <button disabled={busy} className="btn-primary">{editingId ? 'Save draft' : 'Create draft'}</button>
            {editingId && <button type="button" onClick={() => { setFaq(emptyFaq); setEditingId(null) }} className="btn-secondary">Cancel</button>}
          </div>
        </form>
      </section>

      {knowledge && (
        <>
          <section className="card mb-8">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">FAQs</h2>
                <p className="mt-1 text-sm text-slate-500">{knowledge.faqs.length} total · approved entries are available within their visibility scope.</p>
              </div>
            </div>
            <div className="space-y-4">
              {knowledge.faqs.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">{item.question}</h3>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{item.status}</span>
                        <span className="rounded-full bg-rose-50 px-2 py-1 text-xs text-blood-red">{item.visibility_scope}</span>
                        <span className="text-xs text-slate-500">v{item.version}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.approved_answer}</p>
                      {item.expires_at && <p className="mt-2 text-xs text-slate-500">Expires {new Date(item.expires_at).toLocaleDateString()}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.status !== 'approved' && <button disabled={busy} onClick={() => runAction(() => approveChatbotFaq(item.id), 'FAQ approved and published.')} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">Approve</button>}
                      {item.status === 'approved' && <button disabled={busy} onClick={() => runAction(() => disableChatbotFaq(item.id), 'FAQ disabled.')} className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Disable</button>}
                      <button onClick={() => editFaq(item)} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">Edit</button>
                      <button disabled={busy} onClick={() => runAction(async () => setHistory({ faq: item, versions: await getChatbotFaqHistory(item.id) }), 'Version history loaded.')} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">History</button>
                      <button disabled={busy} onClick={() => window.confirm('Delete this FAQ? Its version snapshots will remain for audit history.') && runAction(() => deleteChatbotFaq(item.id), 'FAQ deleted.')} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Delete</button>
                    </div>
                  </div>
                </article>
              ))}
              {knowledge.faqs.length === 0 && <p className="text-sm text-slate-500">No FAQs yet. Add a draft above.</p>}
            </div>
          </section>

          <section className="card mb-8">
            <h2 className="text-xl font-bold">Knowledge signals</h2>
            <p className="mt-1 text-sm text-slate-500">Only aggregate counts are stored; unanswered question text and conversation contents are not available for review.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {knowledge.unanswered_questions.map((metric) => <p key={`${metric.visibility_scope}-${metric.topic}`} className="rounded-xl bg-slate-50 p-3 text-sm"><strong>{metric.visibility_scope}</strong> · {metric.topic}: {metric.occurrences} occurrences</p>)}
              {knowledge.feedback.map((item) => <p key={`${item.visibility_scope}-${item.question}-${item.rating}`} className="rounded-xl bg-slate-50 p-3 text-sm"><strong>{item.visibility_scope}</strong> · {item.question || 'No FAQ match'} · {item.rating}: {item.total}</p>)}
              {knowledge.unanswered_questions.length === 0 && knowledge.feedback.length === 0 && <p className="text-sm text-slate-500">No feedback or unanswered questions recorded yet.</p>}
            </div>
          </section>

          <section className="card mb-8">
            <h2 className="text-xl font-bold">Suggested knowledge updates</h2>
            <p className="mt-1 text-sm text-slate-500">Suggestions never publish automatically. Review answers before approving; approval creates an FAQ draft that must be separately approved for publication.</p>
            <div className="mt-4 space-y-3">
              {knowledge.suggestions.filter((suggestion) => suggestion.review_status === 'pending').map((suggestion) => (
                <article key={suggestion.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="font-semibold">{suggestion.proposed_question}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{suggestion.proposed_answer || 'No answer proposed.'}</p>
                  <p className="mt-2 text-xs text-slate-500">{suggestion.category} · {suggestion.visibility_scope}</p>
                  <div className="mt-3 flex gap-2">
                    <button disabled={busy} onClick={() => reviewSuggestion(suggestion, 'approve')} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">Review and approve as draft</button>
                    <button disabled={busy} onClick={() => runAction(() => reviewChatbotSuggestion(suggestion.id, 'reject'), 'Suggestion rejected.')} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Reject</button>
                  </div>
                </article>
              ))}
              {!knowledge.suggestions.some((suggestion) => suggestion.review_status === 'pending') && <p className="text-sm text-slate-500">No pending suggestions. Unanswered questions are represented only as private aggregate counts.</p>}
            </div>
          </section>
        </>
      )}

      <section className="card mb-8">
        <h2 className="text-xl font-bold">Test a knowledge update</h2>
        <p className="mt-1 text-sm text-slate-500">A draft must pass a retrieval test before it can be published. This does not certify medical accuracy; have a qualified veterinarian review clinical guidance.</p>
        <form onSubmit={runEvaluation} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input required value={testQuestion} onChange={(event) => setTestQuestion(event.target.value)} placeholder="Enter a test question" className="min-w-0 flex-1 rounded-xl border border-slate-200 p-3" />
          <select value={testScope} onChange={(event) => setTestScope(event.target.value)} className="rounded-xl border border-slate-200 bg-white p-3">{scopes.map((scope) => <option key={scope}>{scope}</option>)}</select>
          <select required value={testFaqId} onChange={(event) => setTestFaqId(event.target.value)} className="rounded-xl border border-slate-200 bg-white p-3">
            <option value="">Select FAQ to test</option>
            {knowledge?.faqs.filter((item) => item.status === 'draft').map((item) => <option key={item.id} value={item.id}>{item.question}</option>)}
          </select>
          <button disabled={busy} className="btn-primary">Run test</button>
        </form>
        {testResult && <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-sm font-semibold">Evaluation: {testResult.result.evaluation_status}</p>{testResult.matched_faqs.map((match) => <p key={match.id} className="mt-2 text-sm">{match.question}</p>)}{testResult.matched_faqs.length === 0 && <p className="mt-2 text-sm text-slate-600">No FAQ matched the test question.</p>}</div>}
      </section>

      {history && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-label="FAQ version history">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs uppercase tracking-wide text-slate-500">Version history</p><h2 className="mt-1 text-xl font-bold">{history.faq.question}</h2></div>
              <button onClick={() => setHistory(null)} className="text-2xl text-slate-500" aria-label="Close history">×</button>
            </div>
            <div className="mt-4 space-y-3">
              {history.versions.map((version) => <article key={version.id} className="rounded-xl border border-slate-200 p-4"><p className="font-semibold">Version {version.version}</p><p className="mt-2 whitespace-pre-wrap text-sm">{version.revised_answer}</p><p className="mt-2 text-xs text-slate-500">{version.change_reason || 'No change reason recorded'}</p><button disabled={busy} onClick={() => runAction(() => rollbackChatbotFaq(history.faq.id, version.id), 'Rollback saved as a draft. Approve it to publish.') } className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Restore as draft</button></article>)}
              {history.versions.length === 0 && <p className="text-sm text-slate-500">No previous answer versions are recorded.</p>}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
