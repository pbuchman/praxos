import { AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Card } from './ui/Card.js';

type StatusType = 'connected' | 'disconnected' | 'error' | 'loading';

interface StatusWidgetProps {
  title: string;
  status: StatusType;
  description: string;
  details?: string;
}

const statusConfig: Record<
  StatusType,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    variant: 'default' | 'success' | 'warning' | 'error';
  }
> = {
  connected: { icon: CheckCircle, label: 'Connected', variant: 'success' },
  disconnected: { icon: XCircle, label: 'Not Connected', variant: 'warning' },
  error: { icon: AlertCircle, label: 'Error', variant: 'error' },
  loading: { icon: Loader2, label: 'Loading...', variant: 'default' },
};

export function StatusWidget({
  title,
  status,
  description,
  details,
}: StatusWidgetProps): React.JSX.Element {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card variant={config.variant}>
      <div className="flex items-start gap-4">
        <div className={`shrink-0 border-2 border-black bg-white p-2 shadow-hard-sm ${status === 'loading' ? 'animate-spin' : ''}`}>
          <Icon
            className="h-6 w-6 text-black"
          />
        </div>
        <div className="flex-1">
          <h3 className="font-mono text-lg font-bold uppercase tracking-tight text-black">{title}</h3>
          <p className="font-bold uppercase text-black">
            {config.label}
          </p>
          {description ? <p className="mt-2 text-sm font-medium text-black">{description}</p> : null}
          {details !== undefined && details !== '' ? (
            <p className="mt-2 border-t-2 border-black pt-2 font-mono text-xs font-bold text-black">{details}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
