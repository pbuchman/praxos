interface RefreshIndicatorProps {
  show: boolean;
  message?: string;
}

export function RefreshIndicator({ show, message = 'Updating...' }: RefreshIndicatorProps): React.JSX.Element {
  if (!show) return <></>;

  return (
    <div className="mb-4 flex items-center gap-2 border-2 border-black bg-cyan-100 px-3 py-2 text-sm font-bold uppercase text-black shadow-hard-sm">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
      <span>{message}</span>
    </div>
  );
}
