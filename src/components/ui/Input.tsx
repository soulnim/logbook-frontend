import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-body font-medium text-secondary uppercase tracking-widest">
          {label}
        </label>
      )}
      <input
        className={`
          w-full bg-surface border border-border rounded-md px-3 py-2
          text-sm text-primary font-body placeholder:text-muted
          focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20
          transition-colors duration-150
          ${error ? 'border-red-400/50' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-body font-medium text-secondary uppercase tracking-widest">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full bg-surface border border-border rounded-md px-3 py-2
          text-sm text-primary font-body placeholder:text-muted
          focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20
          transition-colors duration-150 resize-none
          ${error ? 'border-red-400/50' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-body font-medium text-secondary uppercase tracking-widest">
          {label}
        </label>
      )}
      <select
        className={`
          w-full bg-surface border border-border rounded-md px-3 py-2
          text-sm text-primary font-body
          focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20
          transition-colors duration-150
          ${className}
        `}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}