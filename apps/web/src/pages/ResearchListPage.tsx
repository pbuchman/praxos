import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Button, Card, Layout, RefreshIndicator } from '@/components';
import { useAuth } from '@/context';
import { useResearches } from '@/hooks';
import { toggleResearchFavourite } from '@/services/researchAgentApi';
import {
  getProviderForModel,
  type Research,
  type ResearchStatus,
} from '@/services/researchAgentApi.types';

/**
 * Strip markdown formatting from text for clean display.
 * Handles bold, italic, headers, code markers, and surrounding quotes.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, '') // Remove bold markers
    .replace(/__/g, '') // Remove bold (underscore)
    .replace(/(?<!\*)\*(?!\*)/g, '') // Remove italic markers (single asterisk)
    .replace(/(?<!_)_(?!_)/g, '') // Remove italic (single underscore)
    .replace(/^#+\s*/gm, '') // Remove headers
    .replace(/`/g, '') // Remove code markers
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .trim();
}

interface StatusStyle {
  bg: string;
  text: string;
  label: string;
}

const STATUS_STYLES: Record<ResearchStatus, StatusStyle> = {
  draft: { bg: 'bg-yellow-100', text: 'text-black', label: 'DRAFT' },
  pending: { bg: 'bg-neutral-100', text: 'text-black', label: 'PENDING' },
  processing: { bg: 'bg-blue-100', text: 'text-black', label: 'PROCESSING' },
  awaiting_confirmation: { bg: 'bg-orange-100', text: 'text-black', label: 'ACTION REQUIRED' },
  retrying: { bg: 'bg-blue-100', text: 'text-black', label: 'RETRYING' },
  synthesizing: { bg: 'bg-purple-100', text: 'text-black', label: 'SYNTHESIZING' },
  completed: { bg: 'bg-green-100', text: 'text-black', label: 'COMPLETED' },
  failed: { bg: 'bg-red-100', text: 'text-black', label: 'FAILED' },
};

export function ResearchListPage(): React.JSX.Element {
  const { researches, loading, loadingMore, refreshing, error, hasMore, loadMore, deleteResearch, refresh } =
    useResearches();
  const { getAccessToken } = useAuth();
  const [updatingFavourite, setUpdatingFavourite] = useState<string | null>(null);

  const handleToggleFavourite = (researchId: string, favourite: boolean): void => {
    setUpdatingFavourite(researchId);
    void (async (): Promise<void> => {
      try {
        const token = await getAccessToken();
        await toggleResearchFavourite(token, researchId, favourite);
        await refresh();
      } catch {
        // Error handling - silently fail for now
      } finally {
        setUpdatingFavourite(null);
      }
    })();
  };

  if (loading && researches.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Previous Researches</h2>
          <p className="text-slate-600">View and manage your research history</p>
        </div>
        <Link to="/research/new">
          <Button>New Research</Button>
        </Link>
      </div>

      <RefreshIndicator show={refreshing} />

      {error !== null && error !== '' ? (
        <div className="mb-6 break-words rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : null}

      {researches.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <p className="mb-4 text-slate-600">No researches yet</p>
            <Link to="/research/new" className="text-blue-600 underline">
              Start your first research
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {researches.map((research) => (
            <ResearchCard
              key={research.id}
              research={research}
              onDelete={(): void => {
                void deleteResearch(research.id);
              }}
              onToggleFavourite={handleToggleFavourite}
              updatingFavourite={updatingFavourite}
            />
          ))}

          {hasMore ? (
            <div className="flex justify-center pt-4">
              <Button
                variant="secondary"
                onClick={(): void => {
                  void loadMore();
                }}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-transparent" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </Layout>
  );
}

interface ResearchCardProps {
  research: Research;
  onDelete: () => void;
  onToggleFavourite: (researchId: string, favourite: boolean) => void;
  updatingFavourite: string | null;
}

function ResearchCard({ research, onDelete, onToggleFavourite, updatingFavourite }: ResearchCardProps): React.JSX.Element {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const status = STATUS_STYLES[research.status];
  const isDraft = research.status === 'draft';
  const isCompleted = research.status === 'completed';
  const deleteLabel = isDraft ? 'Discard' : 'Delete';

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCardClick = (): void => {
    void navigate(`/research/${research.id}`);
  };

  const getDateLabel = (): string => {
    if (isDraft) {
      return `Draft saved: ${formatDate(research.startedAt)}`;
    }
    return `Research started: ${formatDate(research.startedAt)}`;
  };

  return (
    <div
      onClick={handleCardClick}
      className="cursor-pointer border-2 border-black bg-white p-4 transition-all hover:-translate-y-1 hover:shadow-hard"
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(e): void => {
            e.stopPropagation();
            onToggleFavourite(research.id, !(research.favourite ?? false));
          }}
          disabled={updatingFavourite === research.id}
          className="p-1 border-2 border-transparent hover:border-black transition-all disabled:opacity-50 flex-shrink-0"
          aria-label={research.favourite === true ? 'Unfavourite' : 'Favourite'}
        >
          <Star
            className={`h-5 w-5 ${research.favourite === true ? 'text-black fill-black' : 'text-neutral-300'}`}
          />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-black uppercase tracking-tight text-black">
            {research.title !== '' ? stripMarkdown(research.title) : 'UNTITLED RESEARCH'}
          </h3>
          <p className="mt-1 line-clamp-2 font-mono text-sm text-neutral-600">{research.prompt}</p>
        </div>
        <span
          className={`inline-flex items-center border-2 border-black px-2.5 py-0.5 text-xs font-bold uppercase shadow-hard-sm ${status.bg} ${status.text} flex-shrink-0`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between font-mono text-xs font-bold text-neutral-500 uppercase">
        <div className="flex gap-4">
          <span>{getDateLabel()}</span>
          {isCompleted && research.completedAt !== undefined ? (
            <span>Completed: {formatDate(research.completedAt)}</span>
          ) : null}
        </div>
        <div className="flex gap-2">
          {[...new Set(research.selectedModels.map(getProviderForModel))].map((provider) => (
            <span key={provider} className="border border-black bg-white px-2 py-0.5 text-black">
              {provider}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        {showDeleteConfirm ? (
          <div
            className="flex gap-2"
            onClick={(e): void => {
              e.stopPropagation();
            }}
          >
            <Button variant="danger" onClick={onDelete} size="sm">
              Confirm {deleteLabel}
            </Button>
            <Button
              variant="secondary"
              onClick={(): void => {
                setShowDeleteConfirm(false);
              }}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <button
            onClick={(e): void => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="font-bold uppercase text-neutral-400 hover:text-red-600 text-xs"
          >
            {deleteLabel}
          </button>
        )}
      </div>
    </div>
  );
}
