import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ScriptureActionSheet from '../components/scripture/ScriptureActionSheet';
import ScriptureBooksRail from '../components/scripture/ScriptureBooksRail';
import ScriptureComparisonModal from '../components/scripture/ScriptureComparisonModal';
import ScriptureCompactControls from '../components/scripture/ScriptureCompactControls';
import ScriptureDisplay from '../components/scripture/ScriptureDisplay';
import ScriptureFloatingControls from '../components/scripture/ScriptureFloatingControls';
import ScriptureMobilePanels from '../components/scripture/ScriptureMobilePanels';
import ScriptureReaderTopBar from '../components/scripture/ScriptureReaderTopBar';
import ScriptureSidePanel from '../components/scripture/ScriptureSidePanel';
import SiteHeader from '../components/navigation/SiteHeader';
import SiteSideNav from '../components/navigation/SiteSideNav';
import { useScriptureChapterMeta } from '../hooks/useScriptureChapterMeta';
import { useScriptureReader } from '../hooks/useScriptureReader';
import { useScriptureSearch } from '../hooks/useScriptureSearch';
import { useCompactHeader } from '../hooks/useCompactHeader';
import { useTheme } from '../hooks/useTheme';
import { useBibleComparison } from '../hooks/useBibleComparison';
import type { BibleVerse } from '../types/scripture';
import {
  buildChapterSharePayload,
  buildSelectionSharePayload,
  buildVerseSharePayload,
  parseVerseSelection,
} from '../utils/scriptureShare';
import { normalizeReferenceValue } from '../utils/scriptureReference';

const ScripturePage = () => {
  const { darkMode, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [forceSearchBarOpen, setForceSearchBarOpen] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<BibleVerse[]>([]);
  const [focusVerseNumber, setFocusVerseNumber] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [studyMode, setStudyMode] = useState(false);
  const compactHeader = useCompactHeader(true, { observeNestedScroll: true });
  const {
    books,
    chapters,
    displayPassageTitle,
    error,
    goToNextChapter,
    goToPreviousChapter,
    isResolvingReference,
    loading,
    openScripture,
    canGoNext,
    canGoPrevious,
    selectedVerseNumber,
    selectedBook,
    selectedBookId,
    selectedChapter,
    selectedChapterId,
    selectedVersion,
    selectedVersionId,
    setSelectedBookId,
    setSelectedChapterId,
    setSelectedVerseNumber,
    setSelectedVersionId,
    versions,
    verses,
  } = useScriptureReader();
  const bibleComparison = useBibleComparison({
    books,
    selectedBook,
    selectedChapter,
    selectedVersion,
    versions,
  });

  const isLoading =
    isResolvingReference ||
    loading.versions ||
    loading.books ||
    loading.chapters ||
    loading.verses;
  const { chapterCredit, crossReferences, footnotes, licenseNote } = useScriptureChapterMeta(verses);
  const scriptureSearch = useScriptureSearch(searchTerm, selectedVersionId);
  const returnTo = searchParams.get('returnTo') || '';
  const messageReturnPath = returnTo.startsWith('/media/watch/') ? returnTo : '';
  const chapterVerses = useMemo(
    () => verses.filter((verse) => verse.number > 0),
    [verses],
  );
  const chapterSharePayload = buildChapterSharePayload({
    book: selectedBook,
    chapter: selectedChapter,
    chapterVerses,
    version: selectedVersion,
  });
  const verseSharePayload = buildVerseSharePayload({
    book: selectedBook,
    chapter: selectedChapter,
    verse: selectedVerses[0] || undefined,
    version: selectedVersion,
  });
  const selectionSharePayload = buildSelectionSharePayload({
    book: selectedBook,
    chapter: selectedChapter,
    verses: selectedVerses,
    version: selectedVersion,
  });
  const canCompareVerse = selectedVerses.length > 0 && Boolean(selectedBook && selectedChapter && selectedVersionId);
  const sharedVerseNumbers = useMemo(() => {
    const explicitSelection = parseVerseSelection(searchParams.get('verses'));

    if (explicitSelection.length > 0) {
      return explicitSelection;
    }

    const verseValue = Number(searchParams.get('verse'));
    return Number.isFinite(verseValue) && verseValue > 0 ? [verseValue] : [];
  }, [searchParams]);
  const sharedSelectionKey = useMemo(() => {
    const book = searchParams.get('book');
    const chapter = searchParams.get('chapter');
    const version = searchParams.get('version') || selectedVersionId || '';

    if (!book || !chapter || sharedVerseNumbers.length === 0) {
      return '';
    }

    return [
      normalizeReferenceValue(book),
      chapter,
      normalizeReferenceValue(version),
      sharedVerseNumbers.join(','),
    ].join('|');
  }, [searchParams, selectedVersionId, sharedVerseNumbers]);
  const [appliedSharedSelectionKey, setAppliedSharedSelectionKey] = useState('');

  useEffect(() => {
    if (!actionMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setActionMessage(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [actionMessage]);

  useEffect(() => {
    setSelectedVerses((current) =>
      {
        const next = current.filter((verse) =>
          chapterVerses.some((chapterVerse) => chapterVerse.id === verse.id),
        );

        return next.length === current.length &&
          next.every((verse, index) => verse.id === current[index]?.id)
          ? current
          : next;
      },
    );

    if (selectedVerseNumber && !chapterVerses.some((verse) => verse.number === selectedVerseNumber)) {
      setSelectedVerseNumber(null);
    }

    if (focusVerseNumber && !chapterVerses.some((verse) => verse.number === focusVerseNumber)) {
      setFocusVerseNumber(null);
    }
  }, [chapterVerses, focusVerseNumber, selectedVerseNumber, setSelectedVerseNumber]);

  useEffect(() => {
    if (selectedVerseNumber && selectedVerses.length === 0) {
      setFocusVerseNumber(selectedVerseNumber);
      setSelectedVerseNumber(null);
    }
  }, [selectedVerseNumber, selectedVerses.length, setSelectedVerseNumber]);

  useEffect(() => {
    if (!sharedSelectionKey) {
      if (appliedSharedSelectionKey) {
        setAppliedSharedSelectionKey('');
      }
      return;
    }

    if (!selectedBook || !selectedChapter || chapterVerses.length === 0) {
      return;
    }

    const requestedBook = searchParams.get('book');
    const requestedChapter = Number(searchParams.get('chapter'));
    const requestedVersion = searchParams.get('version');
    const selectedBookKeys = [
      selectedBook.id,
      selectedBook.name,
      selectedBook.abbreviation,
      selectedBook.canonicalName,
      selectedBook.canonicalAbbreviation,
    ]
      .filter(Boolean)
      .map((value) => normalizeReferenceValue(value || ''));

    const matchesPassage =
      requestedBook &&
      Number.isFinite(requestedChapter) &&
      requestedChapter > 0 &&
      selectedBookKeys.includes(normalizeReferenceValue(requestedBook)) &&
      selectedChapter.number === requestedChapter &&
      (!requestedVersion ||
        normalizeReferenceValue(selectedVersion?.abbreviation || selectedVersion?.id || selectedVersionId) ===
          normalizeReferenceValue(requestedVersion));

    if (!matchesPassage || appliedSharedSelectionKey === sharedSelectionKey) {
      return;
    }

    const nextSelectedVerses = sharedVerseNumbers
      .map((verseNumber) => chapterVerses.find((verse) => verse.number === verseNumber))
      .filter(Boolean) as BibleVerse[];

    if (nextSelectedVerses.length === 0) {
      return;
    }

    setSelectedVerses(nextSelectedVerses);
    setFocusVerseNumber(nextSelectedVerses[0].number);
    setAppliedSharedSelectionKey(sharedSelectionKey);
  }, [
    appliedSharedSelectionKey,
    chapterVerses,
    searchParams,
    selectedBook,
    selectedChapter,
    selectedVersion,
    selectedVersionId,
    sharedSelectionKey,
    sharedVerseNumbers,
  ]);

  const closeActionSheet = () => {
    setSelectedVerses([]);
    setFocusVerseNumber(null);
  };

  const handleVerseSelect = (verse: BibleVerse) => {
    const exists = selectedVerses.some((item) => item.id === verse.id);
    const next = exists
      ? selectedVerses.filter((item) => item.id !== verse.id)
      : [...selectedVerses, verse].sort((left, right) => left.number - right.number);

    setSelectedVerses(next);
    setFocusVerseNumber(null);
  };

  const writeToClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'absolute';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  };

  const copyText = async (text: string | null | undefined, successMessage: string) => {
    if (!text) {
      return;
    }

    await writeToClipboard(text);
    setActionMessage(successMessage);
  };

  const openChapterComparison = async (highlightedVerseNumbers: number[] = []) => {
    if (!selectedBook || !selectedChapter || !selectedVersionId) {
      return;
    }

    const nextComparison = await bibleComparison.loadComparison({
      bookId: selectedBook.id,
      chapterNumber: selectedChapter.number,
      highlightedVerseNumbers,
      openModal: true,
    });

    if (!nextComparison) {
      setActionMessage('Unable to compare this chapter right now.');
    }
  };

  const openSearchResult = (result: (typeof scriptureSearch.results)[number]) => {
    if (!result.book.osisId || !result.chapter) {
      return;
    }

    setSearchTerm('');
    setForceSearchBarOpen(false);
    openScripture({
      book: result.book.osisId,
      chapter: result.chapter,
      verse: result.verseNumber,
      versionId: result.version || selectedVersionId,
    });
  };

  const openVerseComparison = async () => {
    if (!canCompareVerse) {
      return;
    }

    const highlightedVerseNumbers = selectedVerses.map((verse) => verse.number);
    closeActionSheet();
    await openChapterComparison(highlightedVerseNumbers);
  };

  const selectionDescription =
    selectedVerses.length > 0 && selectedBook && selectedChapter
      ? `${selectedVerses
          .slice()
          .sort((left, right) => left.number - right.number)
          .map((verse) => `${verse.number}. ${verse.text}`)
          .join('\n\n')}\n\n${selectedBook.name} ${selectedChapter.number}`
      : 'Choose what you would like to do with this passage.';

  return (
    <div className={`h-screen overflow-hidden transition-colors duration-500 ${darkMode ? 'bg-[#080808] text-stone-100' : 'bg-[#f8f5ef] text-zinc-950'}`}>
      <div className="flex h-screen overflow-hidden">
        <SiteSideNav activePath="/scripture" darkMode={darkMode} onToggleTheme={toggleTheme} />
        <ScriptureBooksRail
          books={books}
          darkMode={darkMode}
          selectedBookId={selectedBookId}
          onBookChange={setSelectedBookId}
        />

        <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          <div className="lg:hidden">
            <SiteHeader
              activePath="/scripture"
              darkMode={darkMode}
              onToggleTheme={toggleTheme}
            />
          </div>
          <ScriptureReaderTopBar
            autoFocusSearch={forceSearchBarOpen}
            compact={compactHeader && !forceSearchBarOpen}
            darkMode={darkMode}
            searchTerm={searchTerm}
            selectedVersionId={selectedVersionId}
            versions={versions}
            onSearchBlur={() => {
              if (!searchTerm.trim()) {
                setForceSearchBarOpen(false);
              }
            }}
            onSearchChange={setSearchTerm}
            onVersionChange={setSelectedVersionId}
          />
          {messageReturnPath && (
            <div className={`shrink-0 border-b px-4 py-3 sm:px-6 ${
              darkMode ? 'border-white/10 bg-black/20' : 'border-black/10 bg-white/35'
            }`}>
              <Link
                to={messageReturnPath}
                className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-black shadow-lg backdrop-blur-2xl transition hover:-translate-y-0.5 ${
                  darkMode
                    ? 'border-white/15 bg-white/[0.09] text-white shadow-black/25 ring-1 ring-white/10 hover:bg-white/[0.13]'
                    : 'border-white/70 bg-white/70 text-zinc-950 shadow-zinc-900/10 ring-1 ring-black/5 hover:bg-white'
                }`}
              >
                <span className={`grid size-7 place-items-center rounded-full ${
                  darkMode ? 'bg-white/10 text-red-100' : 'bg-red-950/5 text-red-800'
                }`}>
                  <ArrowLeft size={15} />
                </span>
                Back to message
              </Link>
            </div>
          )}

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden xl:flex-row">
            <ScriptureDisplay
              chapterCredit={chapterCredit}
              darkMode={darkMode}
              displayPassageTitle={displayPassageTitle}
              error={error}
              focusVerseNumber={focusVerseNumber}
              footnotes={footnotes}
              licenseNote={licenseNote}
              loading={isLoading}
              onSearchLoadMore={scriptureSearch.loadMore}
              onSearchResultOpen={openSearchResult}
              searchError={scriptureSearch.error}
              searchCount={scriptureSearch.count}
              searchHasFuzzyResults={scriptureSearch.hasFuzzyResults}
              searchHasMore={scriptureSearch.hasMore}
              searchLoading={scriptureSearch.loading}
              searchLoadingMore={scriptureSearch.loadingMore}
              searchResults={scriptureSearch.results}
              searchSuggestions={scriptureSearch.suggestions}
              searchTerm={searchTerm}
              onVerseSelect={handleVerseSelect}
              selectedVerseNumbers={selectedVerses.map((verse) => verse.number)}
              selectedBook={selectedBook}
              selectedChapter={selectedChapter}
              selectedVersion={selectedVersion}
              studyMode={studyMode}
              verses={verses}
            />
            <ScriptureSidePanel
              books={books}
              canGoNext={canGoNext}
              canGoPrevious={canGoPrevious}
              darkMode={darkMode}
              selectedBook={selectedBook}
              selectedChapter={selectedChapter}
              selectedVersion={selectedVersion}
              studyMode={studyMode}
              versions={versions}
              crossReferences={crossReferences}
              onNext={goToNextChapter}
              onPrevious={goToPreviousChapter}
              onStudyModeChange={setStudyMode}
            />
          </div>
        </main>
      </div>
      <ScriptureFloatingControls
        books={books}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        chapters={chapters}
        darkMode={darkMode}
        selectedBookId={selectedBookId}
        selectedChapterId={selectedChapterId}
        selectedVersionId={selectedVersionId}
        versions={versions}
        onBookChange={setSelectedBookId}
        onChapterChange={setSelectedChapterId}
        onNext={goToNextChapter}
        onPrevious={goToPreviousChapter}
        onVersionChange={setSelectedVersionId}
      />
      <ScriptureMobilePanels
        books={books}
        darkMode={darkMode}
        selectedBook={selectedBook}
        selectedChapter={selectedChapter}
        selectedVersion={selectedVersion}
        studyMode={studyMode}
        versions={versions}
        onStudyModeChange={setStudyMode}
      />
      <ScriptureCompactControls
        compact={compactHeader && !forceSearchBarOpen}
        darkMode={darkMode}
        selectedVersionId={selectedVersionId}
        versions={versions}
        onSearchOpen={() => setForceSearchBarOpen(true)}
        onVersionChange={setSelectedVersionId}
      />
      <ScriptureActionSheet
        canCompareVerse={canCompareVerse}
        compareVerseLabel={selectedVerses.length > 1 ? 'Compare selection' : 'Compare verse'}
        darkMode={darkMode}
        copySelectionLabel={selectedVerses.length > 1 ? 'Copy selection' : 'Copy verse'}
        description={selectionDescription}
        open={selectedVerses.length > 0 && !bibleComparison.open}
        onCompareChapter={async () => {
          closeActionSheet();
          await openChapterComparison();
        }}
        onCompareVerse={openVerseComparison}
        onCopySelection={async () => {
          await copyText(
            (selectedVerses.length > 1 ? selectionSharePayload : verseSharePayload)?.copyText,
            selectedVerses.length > 1 ? 'Selection copied.' : 'Verse copied.',
          );
        }}
        title={
          selectionSharePayload?.title ||
          (selectedBook && selectedChapter ? `${selectedBook.name} ${selectedChapter.number}` : 'Scripture actions')
        }
        onClose={closeActionSheet}
        onCopyChapter={async () => {
          await copyText(chapterSharePayload?.copyText, 'Chapter copied.');
        }}
      />
      <ScriptureComparisonModal
        books={books}
        chapters={bibleComparison.chapters}
        comparison={bibleComparison.comparison}
        comparisonNavigationLoading={bibleComparison.loading}
        darkMode={darkMode}
        highlightedVerseNumbers={bibleComparison.highlightedVerseNumbers}
        open={bibleComparison.open}
        selectedBookId={bibleComparison.bookId || selectedBook?.id}
        selectedChapterNumber={bibleComparison.chapterNumber || selectedChapter?.number}
        selectedCompareVersions={bibleComparison.selectedVersions}
        versions={versions}
        versionLabelFor={bibleComparison.versionLabelFor}
        onClose={() => bibleComparison.setOpen(false)}
        onComparisonReferenceChange={bibleComparison.changeReference}
        onSelectedCompareVersionsChange={bibleComparison.changeVersions}
      />
      {actionMessage ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[75] flex justify-center px-4">
          <div
            className={`rounded-full border px-4 py-2 text-sm font-bold shadow-lg ${
              darkMode
                ? 'border-white/10 bg-zinc-950/95 text-stone-100'
                : 'border-black/10 bg-white/95 text-zinc-900'
            }`}
            role="status"
            aria-live="polite"
          >
            {actionMessage}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ScripturePage;
