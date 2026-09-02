import SiteFooter from '../../navigation/SiteFooter';
import SiteHeader from '../../navigation/SiteHeader';
import { useTheme } from '../../../hooks/useTheme';
import AutoplayControls from './AutoplayControls';
import MediaWatchStatus from './MediaWatchStatus';
import RelatedMediaRow from './RelatedMediaRow';
import { useMediaWatchController } from './useMediaWatchController';
import VideoPlayer from './VideoPlayer';
import WatchBackButton from './WatchBackButton';
import WatchDetails from './WatchDetails';

const MediaWatchPage = () => {
  const { darkMode, toggleTheme } = useTheme();
  const controller = useMediaWatchController();

  return (
    <div className={`flex min-h-screen flex-col overflow-x-clip transition-colors duration-500 ${darkMode ? 'bg-[#080808] text-stone-100' : 'bg-[#f8f5ef] text-zinc-950'}`}>
      <SiteHeader darkMode={darkMode} onToggleTheme={toggleTheme} />

      <main className={`relative flex-1 ${darkMode ? 'bg-[#080808]' : 'bg-[#f8f5ef]'}`}>
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_50%_0%,rgba(127,29,29,0.32),transparent_36%)]" />
        <div className="relative px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <WatchBackButton darkMode={darkMode} onBack={controller.handleBack} />
          </div>

          {controller.status !== 'ready' && (
            <MediaWatchStatus darkMode={darkMode} onBack={controller.handleBack} status={controller.status} />
          )}

          {controller.item && (
            <div className="grid gap-10">
              <VideoPlayer
                autoPlay={controller.autoPlayNext}
                darkMode={darkMode}
                isShort={controller.isShort}
                item={controller.item}
                onEnded={controller.handlePlayerEnded}
                pausePlayback={controller.pauseEndedPlayback}
              />

              <AutoplayControls
                autoplayEnabled={controller.autoplayEnabled}
                autoplayMode={controller.autoplayMode}
                countdown={controller.countdown}
                darkMode={darkMode}
                onCancelCountdown={controller.cancelAutoplayCountdown}
                onContinue={controller.continueAfterStillWatching}
                onPlayNow={controller.playNextItem}
                onStopAutoplay={controller.stopAutoplay}
                onToggleAutoplay={() => controller.setAutoplayEnabled((enabled) => !enabled)}
                pendingNextItem={controller.pendingNextItem}
                showStillWatching={controller.showStillWatching}
              />

              <WatchDetails
                darkMode={darkMode}
                item={controller.item}
                onShare={controller.handleShare}
                scriptureReferences={controller.scriptureReferences}
                shareStatus={controller.shareStatus}
              />

              <RelatedMediaRow
                canLoadMore={controller.canLoadMoreRelated}
                darkMode={darkMode}
                items={controller.relatedItems}
                loadingMore={controller.relatedStatus === 'loading-more'}
                ordering={controller.relatedOrdering}
                onLoadMore={controller.handleRelatedLoadMore}
                onOrderingChange={controller.setRelatedOrdering}
              />
            </div>
          )}
        </div>
      </main>

      <SiteFooter darkMode={darkMode} />
    </div>
  );
};

export default MediaWatchPage;
