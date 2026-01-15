import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useSyncQueue } from '@/context';
import { ChevronDown, LogOut, User, RefreshCw } from 'lucide-react';

export function Header(): React.JSX.Element {
  const { user, logout } = useAuth();
  const { pendingCount, isSyncing } = useSyncQueue();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (menuRef.current !== null && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const userEmail = user?.email ?? 'User';
  const userPicture = user?.picture;

  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b-4 border-black bg-white px-4 md:px-6">
      {/* Logo - with left padding on mobile to account for menu button */}
      <div className="flex items-center gap-3 pl-12 md:pl-0">
        <img
          src="/logo.png"
          alt="IntexuraOS Logo"
          className="h-8 w-8"
          onError={(e): void => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <h1 className="text-xl font-black uppercase tracking-tighter">
          <span className="text-black">Intexura</span>
          <span className="bg-black px-1 text-white">OS</span>
          <span className="ml-2 font-mono text-xs font-bold text-neutral-500">
            ver. {import.meta.env.INTEXURAOS_BUILD_VERSION}
          </span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {pendingCount > 0 && (
          <Link
            to="/settings/share-history"
            className="flex items-center gap-2 border-2 border-black bg-amber-100 px-3 py-1 font-mono text-sm font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            title="Pending shares - click to view history"
          >
            <RefreshCw
              className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
            />
            <span>{pendingCount} pending</span>
          </Link>
        )}

        <div className="relative" ref={menuRef}>
          <button
            onClick={(): void => {
              setIsMenuOpen(!isMenuOpen);
            }}
            className={`flex items-center gap-2 border-2 border-transparent px-2 py-1 text-sm font-bold uppercase transition-all hover:border-black hover:bg-neutral-100 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:px-3 ${isMenuOpen ? 'border-black bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}`}
          >
            {userPicture !== undefined && userPicture !== '' ? (
              <img src={userPicture} alt="" className="h-6 w-6 border border-black" />
            ) : (
              <User className="h-5 w-5" />
            )}
            <span className="hidden max-w-32 truncate sm:inline md:max-w-48">{userEmail}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isMenuOpen ? (
            <div className="absolute right-0 top-full mt-2 w-48 border-2 border-black bg-white py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="border-b-2 border-black px-4 py-2 sm:hidden">
                <span className="font-mono text-sm font-bold">{userEmail}</span>
              </div>
              <button
                onClick={(): void => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm font-bold uppercase hover:bg-black hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
