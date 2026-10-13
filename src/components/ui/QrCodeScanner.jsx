import React, { useEffect, useId, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export function QrCodeScanner({ active, onDecode, onError, className = '' }) {
  const scannerId = `qr-scanner-${useId().replace(/:/g, '')}`
  const scannerRef = useRef(null)
  const callbacksRef = useRef({ onDecode, onError })
  callbacksRef.current = { onDecode, onError }

  useEffect(() => {
    if (!active) return undefined

    let disposed = false
    const scanner = new Html5Qrcode(scannerId, { verbose: false })
    scannerRef.current = scanner

    const startPromise = scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
      (decodedText) => callbacksRef.current.onDecode?.(decodedText),
      () => {}
    ).catch((cameraError) => {
      if (!disposed) callbacksRef.current.onError?.(cameraError)
    })

    return () => {
      disposed = true
      if (scannerRef.current === scanner) scannerRef.current = null
      void startPromise.finally(async () => {
        try {
          if (scanner.isScanning) await scanner.stop()
        } catch {
          // The camera may already have stopped after decode or a start failure.
        }
        try {
          scanner.clear()
        } catch {
          // The scanner DOM may already be removed during unmount.
        }
      })
    }
  }, [active, scannerId])

  return <div id={scannerId} className={className} aria-label="QR code camera scanner" />
}

export default QrCodeScanner