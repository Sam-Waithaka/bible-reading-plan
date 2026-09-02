import type { ReactNode } from "react";
import { CalendarDays, CircleHelp, Settings } from "lucide-react";
import { Route, Routes } from "react-router-dom";
import RouteTransition from "./components/routing/RouteTransition";
import MobileBottomActionsProvider from "./components/navigation/MobileBottomActionsProvider";
import RequireAuth from "./components/auth/RequireAuth";
import { PortalToastProvider } from "./components/portal/PortalToast";
import AboutPage from "./pages/AboutPage";
import AccountPage from "./pages/AccountPage";
import ContactPage from "./pages/ContactPage";
import GivePage from "./pages/GivePage";
import LandingPage from "./pages/LandingPage";
import MediaPage from "./pages/MediaPage";
import MediaWatchPage from "./components/media/watch/MediaWatchPage";
import MinistriesPage from "./pages/MinistriesPage";
import Project52Page from "./pages/Project52Page";
import PortalPage from "./pages/PortalPage";
import PlannedDestinationPage from "./pages/PlannedDestinationPage";
import ResourcesBrowsePage from "./pages/ResourcesBrowsePage";
import ResourcesDetailPage from "./pages/ResourcesDetailPage";
import ResourcesPage from "./pages/ResourcesPage";
import ScripturePage from "./pages/ScripturePage";
import WritingArticlesPage from "./pages/portal/writing/WritingArticlesPage";
import WritingEditorPage from "./pages/portal/writing/WritingEditorPage";
import WritingEditorialPage from "./pages/portal/writing/WritingEditorialPage";
import WritingLibraryPage from "./pages/portal/writing/WritingLibraryPage";
import WritingNewArticlePage from "./pages/portal/writing/WritingNewArticlePage";
import WritingStudioPage from "./pages/portal/writing/WritingStudioPage";
import { AuthProvider } from "./contexts/AuthContext";
import { Project52Provider } from "./contexts/Project52Context";
import { ScriptureReaderProvider } from "./contexts/ScriptureReaderContext";
import { ThemeProvider } from "./contexts/ThemeContext";

const PortalRoute = ({ children }: { children: ReactNode }) => (
  <RequireAuth>
    <PortalToastProvider>{children}</PortalToastProvider>
  </RequireAuth>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Project52Provider>
          <ScriptureReaderProvider>
            <MobileBottomActionsProvider>
              <RouteTransition>
                <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/events" element={<PlannedDestinationPage eyebrow="Church life" icon={CalendarDays} title="Events" description="Upcoming services, gatherings, ministry activities, and important church dates will be shared here." />} />
                <Route path="/give" element={<GivePage />} />
                <Route path="/help" element={<PlannedDestinationPage eyebrow="Support" icon={CircleHelp} title="Help" description="Guidance for using Scripture, Project 52, Resources, Media, and your church account will live here." />} />
                <Route path="/media" element={<MediaPage />} />
                <Route path="/media/watch/:slug" element={<MediaWatchPage />} />
                <Route path="/ministries" element={<MinistriesPage />} />
                <Route path="/settings" element={<PlannedDestinationPage eyebrow="Preferences" icon={Settings} title="Settings" description="Site preferences, accessibility options, notifications, and personal defaults will be managed here." />} />
                <Route path="/account" element={<PortalRoute><AccountPage /></PortalRoute>} />
                <Route path="/account/profile" element={<PortalRoute><AccountPage profile /></PortalRoute>} />
                <Route
                  path="/portal"
                  element={
                    <PortalRoute>
                      <PortalPage />
                    </PortalRoute>
                  }
                />
                <Route
                  path="/portal/writing"
                  element={
                    <PortalRoute>
                      <WritingStudioPage />
                    </PortalRoute>
                  }
                />
                <Route
                  path="/portal/writing/articles"
                  element={
                    <PortalRoute>
                      <WritingArticlesPage />
                    </PortalRoute>
                  }
                />
                <Route
                  path="/portal/writing/new"
                  element={
                    <PortalRoute>
                      <WritingNewArticlePage />
                    </PortalRoute>
                  }
                />
                <Route
                  path="/portal/writing/library"
                  element={
                    <PortalRoute>
                      <WritingLibraryPage />
                    </PortalRoute>
                  }
                />
                <Route
                  path="/portal/writing/editorial"
                  element={
                    <PortalRoute>
                      <WritingEditorialPage />
                    </PortalRoute>
                  }
                />
                <Route
                  path="/portal/writing/:id"
                  element={
                    <PortalRoute>
                      <WritingEditorPage />
                    </PortalRoute>
                  }
                />
                <Route path="/project52" element={<Project52Page />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route
                  path="/resources/type/:slug"
                  element={<ResourcesBrowsePage mode="type" />}
                />
                <Route
                  path="/resources/category/:slug"
                  element={<ResourcesBrowsePage mode="category" />}
                />
                <Route
                  path="/resources/series/:slug"
                  element={<ResourcesBrowsePage mode="series" />}
                />
                <Route
                  path="/resources/book/:osisId"
                  element={<ResourcesBrowsePage mode="book" />}
                />
                <Route
                  path="/resources/ministry/:slug"
                  element={<ResourcesBrowsePage mode="ministry" />}
                />
                <Route
                  path="/resources/:slug"
                  element={<ResourcesDetailPage />}
                />
                <Route path="/scripture" element={<ScripturePage />} />
                <Route path="*" element={<LandingPage />} />
                </Routes>
              </RouteTransition>
            </MobileBottomActionsProvider>
          </ScriptureReaderProvider>
        </Project52Provider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
