import { useCallback, useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import type { Action, Command, CommandType } from '@/types';
import type { ResolvedActionButton, ActionExecutionResult } from '@/types/actionConfig';
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  HelpCircle,
  Link,
  Loader2,
  ListTodo,
  Search,
  X,
} from 'lucide-react';
import { useActionConfig } from '@/hooks/useActionConfig';
import { ConfigurableActionButton } from './ConfigurableActionButton';
import { Button } from './ui/Button';
import { useAuth } from '@/context/AuthContext';
import { updateAction, resolveDuplicateAction } from '@/services/commandsApi';
import { BookmarkConflictModal } from './BookmarkConflictModal';

interface ActionDetailModalProps {
  action: Action;
  command: Command | undefined;
  onClose: () => void;
  onActionSuccess: (button: ResolvedActionButton) => void;
  onActionUpdated?: (action: Action) => void;
  onExecutionResult?: (result: {
    actionId: string;
    resourceUrl: string;
    message: string;
    linkLabel: string;
  }) => void;
}

// Types that can be selected (excludes 'unclassified')
const ACTION_TYPES: Exclude<CommandType, 'unclassified'>[] = [
  'todo',
  'research',
  'note',
  'link',
  'calendar',
  'reminder',
];

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

export function ActionDetailModal({
  action,
  command,
  onClose,
  onActionSuccess,
  onActionUpdated,
  onExecutionResult,
}: ActionDetailModalProps): React.JSX.Element {
  const { buttons, isLoading } = useActionConfig(action);
  const { getAccessToken } = useAuth();
  const [executionResult, setExecutionResult] = useState<{
    actionId: string;
    status: 'completed' | 'failed' | 'rejected';
    resource_url?: string;
    message?: string;
    linkLabel?: string;
  } | null>(null);
  const [selectedType, setSelectedType] = useState<CommandType>(action.type);
  const [isChangingType, setIsChangingType] = useState(false);
  const [typeChangeError, setTypeChangeError] = useState<string | null>(null);
  // Track if current action result has resource_url (used to prevent modal close)
  const hasResourceUrlRef = useRef(false);
  // Conflict modal state for duplicate bookmarks
  const [conflictInfo, setConflictInfo] = useState<{
    url: string;
    existingBookmarkId: string;
  } | null>(null);

  const canChangeType = action.status === 'pending' || action.status === 'awaiting_approval';

  const handleTypeChange = useCallback(
    async (newType: CommandType): Promise<void> => {
      if (newType === selectedType) return;
      if (newType === 'unclassified') return; // Can't select unclassified

      setIsChangingType(true);
      setTypeChangeError(null);
      try {
        const token = await getAccessToken();
        const updatedAction = await updateAction(token, action.id, { type: newType });
        setSelectedType(newType);
        onActionUpdated?.(updatedAction);
      } catch (error) {
        setTypeChangeError(error instanceof Error ? error.message : 'Failed to change type');
        // Revert selection
        setSelectedType(action.type);
      } finally {
        setIsChangingType(false);
      }
    },
    [getAccessToken, action.id, action.type, onActionUpdated, selectedType]
  );

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

  /**
   * Normalizes resource_url for HashRouter.
   * Backend returns URLs like "/#/research/..." but HashRouter's Link component
   * expects just "/research/..." (it handles the # prefix automatically).
   */
  const normalizeResourceUrl = (url: string): string => {
    // Strip leading /# or # prefix if present
    if (url.startsWith('/#')) {
      return url.slice(2);
    }
    if (url.startsWith('#')) {
      return url.slice(1);
    }
    return url;
  };

  const handleResult = (result: ActionExecutionResult, button: ResolvedActionButton): void => {
    // Check for duplicate bookmark conflict
    if (result.existingBookmarkId !== undefined) {
      const urlFromPayload = typeof action.payload['url'] === 'string' ? action.payload['url'] : action.title;
      setConflictInfo({
        url: urlFromPayload,
        existingBookmarkId: result.existingBookmarkId,
      });
      return;
    }

    if (result.resource_url !== undefined) {
      const normalizedUrl = normalizeResourceUrl(result.resource_url);
      const message = button.onSuccess?.message ?? 'Action completed successfully';
      const linkLabel = button.onSuccess?.linkLabel ?? `Open ${action.type}`;

      // Report execution result to parent for global notification
      onExecutionResult?.({
        actionId: result.actionId,
        resourceUrl: normalizedUrl,
        message,
        linkLabel,
      });

      const newResult: typeof executionResult = {
        actionId: result.actionId,
        status: result.status,
        resource_url: normalizedUrl,
        message,
        linkLabel,
      };
      setExecutionResult(newResult);
    }
  };

  const handleSkipConflict = useCallback(async (): Promise<void> => {
    if (conflictInfo === null) return;
    try {
      const token = await getAccessToken();
      await resolveDuplicateAction(token, action.id, 'skip');
      onActionUpdated?.({ ...action, status: 'rejected' });
      setConflictInfo(null);
      onClose();
    } catch {
      // Error handled by modal
    }
  }, [conflictInfo, action, getAccessToken, onActionUpdated, onClose]);

  const handleUpdateConflict = useCallback(async (): Promise<void> => {
    if (conflictInfo === null) return;
    try {
      const token = await getAccessToken();
      const result = await resolveDuplicateAction(token, action.id, 'update');
      onActionUpdated?.({
        ...action,
        status: result.status,
        payload: {
          ...action.payload,
          resource_url: result.resource_url,
        },
      });
      setConflictInfo(null);
      // Show success view
      if (result.resource_url !== undefined) {
        setExecutionResult({
          actionId: result.actionId,
          status: result.status,
          resource_url: normalizeResourceUrl(result.resource_url),
        });
      }
    } catch {
      // Error handled by modal
    }
  }, [conflictInfo, action, getAccessToken, onActionUpdated]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
        {/* Header */}
        <div className="flex items-start justify-between border-b-4 border-black bg-yellow-400 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 border-2 border-black bg-white p-2 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {getTypeIcon(selectedType)}
            </div>
            <div>
              <h2 className="font-mono text-lg font-black uppercase tracking-tight text-black">{action.title}</h2>
              <div className="mt-1 flex items-center gap-2 text-sm font-bold">
                {canChangeType ? (
                  <div className="relative inline-flex items-center">
                    <select
                      value={selectedType}
                      onChange={(e): void => {
                        void handleTypeChange(e.target.value as CommandType);
                      }}
                      disabled={isChangingType}
                      className="appearance-none border-2 border-black bg-white py-0.5 pl-2 pr-6 text-sm font-bold uppercase text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {ACTION_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {getTypeLabel(t)}
                        </option>
                      ))}
                    </select>
                    {isChangingType && (
                      <Loader2 className="absolute right-1.5 h-3 w-3 animate-spin text-black" />
                    )}
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 border-2 border-black bg-white px-2 py-0.5 font-bold uppercase text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {getTypeLabel(selectedType)}
                  </span>
                )}
                <span className="font-mono text-black">{String(Math.round(action.confidence * 100))}% CONFIDENCE</span>
              </div>
              {typeChangeError !== null && (
                <p className="mt-1 font-mono text-xs font-bold text-red-600 bg-white px-1 border border-black inline-block">{typeChangeError}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="border-2 border-black bg-white p-2 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 p-6 bg-white">
          {/* Original command text */}
          {command !== undefined && (
            <div>
              <h3 className="mb-2 font-mono text-xs font-bold uppercase text-black">
                Original Command
              </h3>
              <div className="break-words border-2 border-black bg-neutral-100 p-3 font-mono text-sm font-medium text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {command.text}
              </div>
            </div>
          )}

          {/* Classification reasoning */}
          {command?.classification?.reasoning !== undefined && (
            <div>
              <h3 className="mb-2 font-mono text-xs font-bold uppercase text-black">
                Classification Reasoning
              </h3>
              <div className="break-words border-2 border-black bg-white p-3 text-sm font-medium text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {command.classification.reasoning}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex items-center gap-4 font-mono text-xs font-bold text-neutral-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>CREATED {formatDate(action.createdAt).toUpperCase()}</span>
            </div>
            {action.updatedAt !== action.createdAt && (
              <div className="flex items-center gap-1">
                <span>UPDATED {formatDate(action.updatedAt).toUpperCase()}</span>
              </div>
            )}
          </div>

          {/* Status badge */}
          <div className="border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-sm font-bold uppercase text-black">
              Status:{' '}
              <span
                className={
                  action.status === 'completed'
                    ? 'bg-green-100 px-1 text-black'
                    : action.status === 'processing'
                      ? 'bg-blue-100 px-1 text-black'
                      : action.status === 'failed' || action.status === 'rejected'
                        ? 'bg-red-100 px-1 text-black'
                        : 'bg-neutral-100 px-1 text-black'
                }
              >
                {action.status.toUpperCase()}
              </span>
            </span>
          </div>
        </div>

        {/* Actions or Success View */}
        {executionResult !== null ? (
          <div className="border-t-4 border-black bg-neutral-100 p-6">
            <div className="border-2 border-black bg-green-100 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-black" />
                <div className="flex-1">
                  <h4 className="font-bold uppercase text-black">
                    {executionResult.message ?? 'Action completed successfully'}
                  </h4>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <RouterLink
                      to={executionResult.resource_url ?? '#'}
                      className="inline-flex items-center gap-2 border-2 border-black bg-black px-4 py-2 text-sm font-bold uppercase text-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {executionResult.linkLabel ?? `Open ${action.type}`}
                    </RouterLink>
                    <Button variant="secondary" onClick={onClose}>
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 border-t-4 border-black bg-neutral-100 p-6 flex-wrap">
            {isLoading ? (
              <div className="font-mono text-sm font-bold text-neutral-500">LOADING ACTIONS...</div>
            ) : (
              buttons.map((button) => (
                <ConfigurableActionButton
                  key={button.id}
                  button={button}
                  onSuccess={(): void => {
                    // Note: onResult is called before onSuccess, but React state
                    // updates are batched, so executionResult may not be updated yet.
                    // The hasResourceUrl ref tells us if we should stay open.
                    if (!hasResourceUrlRef.current) {
                      onActionSuccess(button);
                    }
                    hasResourceUrlRef.current = false; // Reset for next action
                  }}
                  onResult={(result, btn): void => {
                    handleResult(result, btn);
                    // Track if this result has resource_url (for onSuccess check)
                    hasResourceUrlRef.current = result.resource_url !== undefined;
                  }}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Conflict Modal */}
      {conflictInfo !== null && (
        <BookmarkConflictModal
          isOpen
          url={conflictInfo.url}
          onSkip={(): void => {
            void handleSkipConflict();
          }}
          onUpdate={async (): Promise<void> => {
            await handleUpdateConflict();
          }}
          onClose={(): void => {
            setConflictInfo(null);
          }}
        />
      )}
    </div>
  );
}
