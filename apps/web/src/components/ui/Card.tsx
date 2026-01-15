import type { ReactNode } from 'react';

type CardVariant = 'default' | 'success' | 'warning' | 'error';

interface CardProps {
  title?: string;
  variant?: CardVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
  success: 'border-black bg-green-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
  warning: 'border-black bg-yellow-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
  error: 'border-black bg-red-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
};

export function Card({
  title,
  variant = 'default',
  children,
  className = '',
}: CardProps): React.JSX.Element {
  return (
    <div className={`border-2 p-6 transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${variantStyles[variant]} ${className}`}>
      {title !== undefined && title !== '' ? (
        <div className="mb-4 border-b-2 border-black pb-2">
          <h3 className="font-mono text-lg font-bold uppercase tracking-tight text-black">{title}</h3>
        </div>
      ) : null}
      {children}
    </div>
  );
}
