import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import DonorLayout from '../../components/layout/DonorLayout'
import { archiveDonorVerificationCode, getDonorVerificationCodes } from '../../services/relayService'

export function VerificationQrPage() {
  const [codes, setCodes] = useState([])
  const [qrImages, setQrImages] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState('active')
  const [archiving, setArchiving] = useState(null)

  useEffect(() => {
    getDonorVerificationCodes()
      .then(async (records) => {
        setCodes(records)
        const images = {}
        for (const record of records) {
          images[record.code_id] = await QRCode.toDataURL(record.qr_payload, {
            width: 240,
            margin: 2,
            errorCorrectionLevel: 'M',
          })
        }
        setQrImages(images)
      })
      .catch(() => setError('Unable to load your verification QR codes.'))
      .finally(() => setLoading(false))
  }, [])

  const archive = async (codeId) => {
    setArchiving(codeId)
    try {
      await archiveDonorVerificationCode(codeId)
      setCodes((current) => current.map((record) => record.code_id === codeId ? { ...record, status: 'void' } : record))
    } catch {
      setError('Unable to archive this verification record.')
    } finally {
      setArchiving(null)
    }
  }

  const visibleCodes = codes.filter((record) => view === 'active'
    ? !['expired', 'void'].includes(record.status)
    : ['expired', 'void'].includes(record.status))

  return (
    <DonorLayout>
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blood-red">Emergency coordination</p>
        <h1 className="mt-2 text-4xl font-extrabold text-gray-900">Verification QR Codes</h1>
        <p className="mt-2 max-w-2xl text-gray-600">Your accepted donor requests are saved here for quick clinic verification.</p>
        <div className="mt-5 inline-flex rounded-xl border border-red-100 bg-white p-1 shadow-sm">
          <button type="button" onClick={() => setView('active')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === 'active' ? 'bg-blood-red text-white' : 'text-gray-600 hover:bg-red-50'}`}>Active QR codes</button>
          <button type="button" onClick={() => setView('archive')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === 'archive' ? 'bg-blood-red text-white' : 'text-gray-600 hover:bg-red-50'}`}>Archive</button>
        </div>
      </div>

      {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading ? (
        <div className="card py-16 text-center text-gray-500">Loading verification codes...</div>
      ) : visibleCodes.length === 0 ? (
        <div className="card py-16 text-center">
          <h2 className="text-xl font-bold text-gray-900">{view === 'active' ? 'No active QR codes' : 'Archive is empty'}</h2>
          <p className="mt-2 text-gray-500">{view === 'active' ? 'Accept an approved emergency donor request to generate a QR code.' : 'Expired and manually archived verification records will appear here.'}</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {visibleCodes.map((record) => (
            <article key={record.code_id} className="card flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left gap-6">
              {record.status === 'void' ? <div className="flex h-44 w-44 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-500">Archived</div> : <img src={qrImages[record.code_id]} alt={`Verification QR code ${record.code}`} className="h-44 w-44 rounded-2xl border border-gray-100 p-2" />}
              <div>
                <p className={`text-xs font-bold uppercase tracking-wide ${record.status === 'expired' ? 'text-amber-700' : record.status === 'void' ? 'text-slate-500' : 'text-emerald-700'}`}>{record.status}</p>
                <h2 className="mt-1 text-3xl font-extrabold tracking-widest text-blood-red">{record.code}</h2>
                <p className="mt-3 text-sm text-gray-600">Patient: <strong>{record.patient_name}</strong></p>
                <p className="text-sm text-gray-600">Clinic: <strong>{record.clinic_name}</strong></p>
                <p className="mt-3 text-xs text-gray-500">Expires {new Date(record.expires_at).toLocaleString()}</p>
                {view === 'active' && <button type="button" onClick={() => archive(record.code_id)} disabled={archiving === record.code_id} className="btn-secondary mt-4 text-sm">{archiving === record.code_id ? 'Archiving...' : 'Archive record'}</button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </DonorLayout>
  )
}

export default VerificationQrPage
