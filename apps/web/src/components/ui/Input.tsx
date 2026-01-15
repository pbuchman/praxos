import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({
  label,
  error,
  id,
  className = '',
  ...props
}: InputProps): React.JSX.Element {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-bold uppercase tracking-wide text-black">
        {label}
      </label>
      <input
        id={inputId}
        className={`block w-full border-2 px-3 py-2 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-neutral-500 focus:translate-y-[-2px] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none ${
          error !== undefined && error !== '' ? 'border-red-500 bg-red-50' : 'border-black bg-white focus:border-black'
        } ${className}`}
        {...props}
      />
      {error !== undefined && error !== '' ? <p className="font-mono text-sm font-bold text-red-600">{error}</p> : null}
    </div>
  );
}
