import React, { useState } from 'react';
import { Download, X, WifiOff, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { usePwa } from '../hooks/usePwa';

export function InstallPwaBanner() {
  const { isInstallable, isInstalled, isOnline, installApp } = usePwa();
  const [dismissed, setDismissed] = useState(false);

  return (
    <>
      {/* Offline Alert Strip */}
      {!isOnline && (
        <div className="brutal-sm mb-4 flex items-center justify-between gap-2 bg-obsidian border-2 border-acid p-2.5 text-[12px] font-bold text-acid">
          <div className="flex items-center gap-2">
            <WifiOff className="size-4 shrink-0 text-hyper animate-pulse" />
            <span>Offline Mode Active — Accessing cached timetable & room databases.</span>
          </div>
          <span className="font-mono text-[10px] uppercase bg-acid/20 px-1.5 py-0.5 border border-acid">
            Cached
          </span>
        </div>
      )}

      {/* Install Floating Banner (Shown if installable and not dismissed/installed) */}
      {isInstallable && !isInstalled && !dismissed && (
        <div className="brutal-sm mb-4 flex flex-wrap items-center justify-between gap-3 bg-acid p-3 text-obsidian border-2 border-black shadow-[4px_4px_0px_#000]">
          <div className="flex items-center gap-2.5">
            <div className="brutal-flat flex size-8 items-center justify-center bg-black text-acid font-display font-black text-sm">
              C!
            </div>
            <div>
              <p className="font-display text-sm font-extrabold uppercase tracking-tight">
                Install Campus Chaos
              </p>
              <p className="font-mono text-[11px] font-semibold opacity-90">
                Add to your phone for instant offline timetable & room access.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant="ink"
              className="text-xs font-bold uppercase tracking-wider"
              onClick={installApp}
            >
              <Download className="size-3.5 mr-1" /> Install App
            </Button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-black/10 rounded transition-colors"
              aria-label="Dismiss install prompt"
            >
              <X className="size-4 text-obsidian" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function SidebarInstallButton() {
  const { isInstallable, isInstalled, installApp } = usePwa();

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 font-mono text-[10px] font-bold uppercase text-mint tracking-wider">
        <CheckCircle className="size-3.5 text-mint" /> App Installed
      </div>
    );
  }

  if (!isInstallable) return null;

  return (
    <Button
      size="sm"
      variant="acid"
      onClick={installApp}
      className="w-full text-xs font-extrabold tracking-wider uppercase border-2 border-black shadow-[2px_2px_0px_#000]"
    >
      <Download className="size-3.5 mr-1.5" /> Install App
    </Button>
  );
}
