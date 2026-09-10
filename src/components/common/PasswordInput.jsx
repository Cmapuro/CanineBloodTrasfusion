import React, { useState } from 'react'

export function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder,
  className = 'form-control',
  required = false,
}) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative">
      <input
        id={id || name}
        type={isVisible ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${className} pr-12`}
        required={required}
      />
      <button
        type="button"
        onClick={() => setIsVisible((visible) => !visible)}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-500 hover:text-blood-red"
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        title={isVisible ? 'Hide password' : 'Show password'}
      >
        {isVisible ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a2 2 0 002.8 2.8" />
            <path d="M9.9 4.2A10.8 10.8 0 0112 4c5 0 8.5 4 9.5 6a16.5 16.5 0 01-3.2 3.8M6.6 6.6A16.4 16.4 0 002.5 10c1 2 4.5 6 9.5 6a10.4 10.4 0 003.4-.6" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default PasswordInput