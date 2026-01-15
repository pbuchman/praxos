import { useEffect } from 'react';
import type { Command, CommandType } from '@/types';
import {
  Bell,
  Calendar,
  Clock,
  FileText,
  HelpCircle,
  Link,
  ListTodo,
  Mic,
  MessageSquare,
  Search,
  X,
} from 'lucide-react';

interface CommandDetailModalProps {
  command: Command;
  onClose: () => void;
}

function getTypeIcon(type: CommandType): React.JSX.Element {
  const iconClass = 'h-5 w-5';
  switch (type) {
    case 'todo':
      return <ListTodo className={iconClass} />;
    case 'research':
      return <Search className={iconClass} />;
    case 'note':
      return <FileText className={iconClass} />;
    case 'link':
      return <Link className={iconClass} />;
    case 'calendar':
      return <Calendar className={iconClass} />;
    case 'reminder':
      return <Bell className={iconClass} />;
    default:
      return <HelpCircle className={iconClass} />;
  }
}

function getTypeLabel(type: CommandType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CommandDetailModal({
  command,
  onClose,
}: CommandDetailModalProps): React.JSX.Element {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return (): void => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isVoice = command.sourceType === 'whatsapp_voice';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
        {/* Header */}
        <div className="flex items-start justify-between border-b-4 border-black bg-blue-400 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 border-2 border-black bg-white p-2 text-black shadow-hard-sm">
              {isVoice ? (
                <Mic className="h-5 w-5 text-black" />
              ) : (
                <MessageSquare className="h-5 w-5 text-black" />
              )}
            </div>
            <div>
              <h2 className="font-mono text-lg font-black uppercase tracking-tight text-black">
                {isVoice ? 'Voice Command' : 'Text Command'}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-sm font-bold">
                {command.classification !== undefined && (
                  <span className="inline-flex items-center gap-1 border-2 border-black bg-white px-2 py-0.5 font-bold uppercase text-black shadow-hard-sm">
                    {getTypeIcon(command.classification.type)}
                    {getTypeLabel(command.classification.type)}
                  </span>
                )}
                <span className="font-mono uppercase text-black">{command.status}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="border-2 border-black bg-white p-2 text-black shadow-hard-sm transition-transform hover:-translate-y-0.5 hover:shadow-hard"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 p-6 bg-white">
          {/* Command text */}
          <div>
            <h3 className="mb-2 font-mono text-xs font-bold uppercase text-black">
              Command Text
            </h3>
            <div className="break-words border-2 border-black bg-neutral-100 p-3 font-mono text-sm font-medium text-black shadow-hard-sm">
              {command.text}
            </div>
          </div>

          {/* Classification confidence */}
          {command.classification?.confidence !== undefined && (
            <div>
              <h3 className="mb-2 font-mono text-xs font-bold uppercase text-black">
                Classification Confidence
              </h3>
              <div className="border-2 border-black bg-white p-3 font-mono text-sm font-bold text-black shadow-hard-sm">
                {String(Math.round(command.classification.confidence * 100))}% CONFIDENT
              </div>
            </div>
          )}

          {/* Classification reasoning */}
          {command.classification?.reasoning !== undefined && (
            <div>
              <h3 className="mb-2 font-mono text-xs font-bold uppercase text-black">
                Classification Reasoning
              </h3>
              <div className="break-words border-2 border-black bg-white p-3 text-sm font-medium text-black shadow-hard-sm">
                {command.classification.reasoning}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex items-center gap-4 font-mono text-xs font-bold text-neutral-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>CREATED {formatDate(command.createdAt).toUpperCase()}</span>
            </div>
            {command.updatedAt !== command.createdAt && (
              <div className="flex items-center gap-1">
                <span>UPDATED {formatDate(command.updatedAt).toUpperCase()}</span>
              </div>
            )}
          </div>

          {/* Status badge */}
          <div className="border-2 border-black bg-white p-3 shadow-hard-sm">
            <span className="text-sm font-bold uppercase text-black">
              Status:{' '}
              <span
                className={
                  command.status === 'classified'
                    ? 'bg-green-100 px-1 text-black'
                    : command.status === 'pending_classification' || command.status === 'received'
                      ? 'bg-yellow-100 px-1 text-black'
                      : command.status === 'failed'
                        ? 'bg-red-100 px-1 text-black'
                        : 'bg-neutral-100 px-1 text-black'
                }
              >
                {command.status.toUpperCase().replace('_', ' ')}
              </span>
            </span>
          </div>
        </div>

        {/* Footer - Close button */}
        <div className="flex items-center justify-end border-t-4 border-black bg-neutral-100 p-6">
          <button
            onClick={onClose}
            className="border-2 border-black bg-white px-4 py-2 text-sm font-bold uppercase text-black shadow-hard-sm transition-transform hover:-translate-y-0.5 hover:shadow-hard"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
