import { ScriptureIcon } from '../../constants/siteIcons';
import { CalendarDays, X } from 'lucide-react';

import { useEffect, useState } from 'react';
import type { BibleBook, BibleChapter, BibleVersion } from '../../types/scripture';
import BibleToolsPanel from './bibleTools/BibleToolsPanel';
import ScriptureProject52Card from './ScriptureProject52Card';

type ScriptureMobilePanelsProps = {
  books: BibleBook[];
  darkMode: boolean;
  selectedBook?: BibleBook;
  selectedChapter?: BibleChapter;
  selectedVersion?: BibleVersion;
  studyMode: boolean;
  versions: BibleVersion[];
  onStudyModeChange: (enabled: boolean) => void;
};

type ActivePanel = 'tools' | 'project52' | null;

const ScriptureMobilePanels = ({
  books,
  darkMode,
  selectedBook,
  selectedChapter,
  selectedVersion,
  studyMode,
  versions,
  onStudyModeChange,
}: ScriptureMobilePanelsProps) => {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  useEffect(() => {
    if (!activePanel) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActivePanel(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePanel]);

  const modalTitle = activePanel === 'tools' ? 'Bible Tools' : 'Project 52';
  const dockClass = darkMode
    ? 'border-white/10 bg-[#080808]/95 shadow-black/30'
    : 'border-black/10 bg-[#f8f5ef]/95 shadow-zinc-900/10';
  const secondaryDockButtonClass = darkMode
    ? 'border-white/10 bg-white/10 text-stone-100 shadow-black/25 hover:bg-white/15'
    : 'border-black/10 bg-white text-zinc-950 shadow-zinc-900/10 hover:bg-[#fffaf0]';

  return (
    <>
      <nav className={`fixed inset-x-0 bottom-0 z-40 border-t px-4 py-3 shadow-2xl backdrop-blur-xl transition-colors xl:hidden ${dockClass}`}>
        <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setActivePanel('tools')}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-red-800 px-4 text-sm font-black text-white shadow-lg shadow-red-950/25 transition hover:bg-red-700 active:scale-[0.98]"
          >
            <ScriptureIcon size={18} />
            Bible Tools
          </button>
          <button
            type="button"
            onClick={() => setActivePanel('project52')}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-4 text-sm font-black shadow-lg transition active:scale-[0.98] ${secondaryDockButtonClass}`}
          >
            <CalendarDays size={18} />
            Project 52
          </button>
        </div>
      </nav>

      {activePanel ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 backdrop-blur-sm sm:items-center"
          onClick={() => setActivePanel(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="scripture-mobile-panel-title"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className={`max-h-[calc(100dvh-4.5rem)] w-full max-w-2xl overflow-hidden rounded-[1.75rem] border shadow-2xl sm:max-h-[86vh] sm:rounded-[2rem] ${darkMode ? 'border-white/10 bg-[#080808] text-stone-100' : 'border-black/10 bg-[#f8f5ef] text-zinc-950'
              }`}
          >
            <div className={`flex items-center justify-between gap-4 border-b px-4 py-3 sm:p-4 ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-red-200' : 'text-red-900'}`}>Scripture</p>
                <h2 id="scripture-mobile-panel-title" className="mt-1 text-xl font-black">{modalTitle}</h2>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className={`grid size-11 place-items-center rounded-full border transition ${darkMode ? 'border-white/10 bg-white/10 hover:bg-white/15' : 'border-black/10 bg-white hover:bg-[#fffaf0]'
                  }`}
                aria-label={`Close ${modalTitle}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[calc(100dvh-9.5rem)] overflow-y-auto px-4 pb-4 pt-3 sm:max-h-[calc(86vh-5rem)] sm:p-4">
              {activePanel === 'tools' ? (
                <BibleToolsPanel
                  books={books}
                  darkMode={darkMode}
                  embedded
                  selectedBook={selectedBook}
                  selectedChapter={selectedChapter}
                  selectedVersion={selectedVersion}
                  studyMode={studyMode}
                  versions={versions}
                  onStudyModeChange={onStudyModeChange}
                />
              ) : <ScriptureProject52Card darkMode={darkMode} onOpenReading={() => setActivePanel(null)} />}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default ScriptureMobilePanels;
