import React from 'react'

/**
 * Modal Component
 * Reusable modal dialog component for displaying content in a popup
 * Features: title, content, action buttons, close button, backdrop
 */
export function Modal({
  isOpen = false,
  title = '',
  children,
  onClose,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
}) {
  // Don't render if not open
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-[990] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[calc(100vh-2rem)] overflow-hidden animate-slideUp flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4 p-6 border-b border-gray-200">
            <h2 id="modal-title" className="text-xl font-bold text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition"
              title="Close"
            >
              Close
            </button>
          </div>

          {/* Body (scrollable) */}
          <div className="p-6 text-base leading-7 text-gray-700 overflow-auto">{children}</div>

          {/* Footer (always visible) */}
          <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-200 bg-gray-50/70">
            <button
              onClick={onClose}
              className="btn-secondary flex-1 justify-center"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm?.()
                onClose?.()
              }}
              className={`btn-primary flex-1 justify-center ${isDangerous ? 'bg-red-600 hover:bg-red-700' : ''}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Modal
