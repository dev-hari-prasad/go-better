import React, { useState, useEffect } from 'react';
import { NavTab, Sidebar } from './components/layout/Sidebar';
import { HeaderBar } from './components/layout/HeaderBar';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { PullRequestsListView } from './components/pullrequests/PullRequestsListView';
import { PullRequestReviewView } from './components/review/PullRequestReviewView';
import { RepositoriesView } from './components/repositories/RepositoriesView';
import { ActivityLogView } from './components/activity/ActivityLogView';
import { WorkspaceSettingsView } from './components/settings/WorkspaceSettingsView';
import { BYOKKeysView } from './components/settings/BYOKKeysView';
import { AIChatView } from './components/chat/AIChatView';
import { SearchModal } from './components/search/SearchModal';
import { LoadingState } from './components/ui/LoadingState';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { LandingModal } from './components/landing/LandingModal';
import {
  mockRepositories,
  mockPullRequests,
  mockDiffFiles,
  mockFindings,
  mockActivityEvents,
  mockUserSettings,
} from './mockData/codeReviewData';
import { PullRequest, AIFinding, UserSettings, Repository } from './types/codeReview';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [selectedRepoId, setSelectedRepoId] = useState<string>('all');
  const [selectedPR, setSelectedPR] = useState<PullRequest>(mockPullRequests[0]);
  const [repositories] = useState<Repository[]>(mockRepositories);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>(mockPullRequests);
  const [findings, setFindings] = useState<AIFinding[]>(mockFindings);
  const [activities] = useState(mockActivityEvents);
  const [settings, setSettings] = useState<UserSettings>(mockUserSettings);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [isLandingOpen, setIsLandingOpen] = useState<boolean>(true);

  // Handle Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDismissFinding = (findingId: string) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === findingId ? { ...f, status: 'dismissed' as const } : f))
    );
  };

  const handleSimulateReview = () => {
    setIsScanning(true);
    setScanStep('Fetching git diff & AST syntax tree...');

    setTimeout(() => {
      setScanStep('Executing security rules & crypto validation checks...');
    }, 1000);

    setTimeout(() => {
      setScanStep('Generating review comments with Claude 3.5 Sonnet...');
    }, 2000);

    setTimeout(() => {
      setIsScanning(false);
      setPullRequests((prev) =>
        prev.map((pr) =>
          pr.id === selectedPR.id ? { ...pr, status: 'approved' as const } : pr
        )
      );
      setSelectedPR((prev) => ({ ...prev, status: 'approved' as const }));
    }, 3000);
  };

  const selectedRepo = repositories.find((r) => r.id === selectedRepoId) || null;

  return (
    <div className="flex flex-col h-screen bg-[#16171d] text-zinc-100 font-sans overflow-hidden antialiased">
      {/* Top Header spans full width */}
      <HeaderBar
        currentTab={activeTab}
        selectedRepo={selectedRepo}
        selectedPR={selectedPR}
        pullRequests={pullRequests}
        findings={findings}
        onSelectPR={setSelectedPR}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onTabChange={setActiveTab}
        onOpenLanding={() => setIsLandingOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          repositories={repositories}
          selectedRepoId={selectedRepoId}
          onSelectRepo={setSelectedRepoId}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          onSimulateReview={handleSimulateReview}
        />

        {/* View Router */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-[#0d1117]">
          <>
              {activeTab === 'overview' && (
                <OverviewDashboard
                  repositories={repositories}
                  pullRequests={pullRequests}
                  findings={findings}
                  activities={activities}
                  onSelectPR={setSelectedPR}
                  onNavigateToTab={setActiveTab}
                />
              )}

              {activeTab === 'ai-chat' && (
                <AIChatView
                  pullRequests={pullRequests}
                  repositories={repositories}
                  onSelectPR={(pr) => {
                    setSelectedPR(pr);
                    setActiveTab('reviews');
                  }}
                />
              )}

              {activeTab === 'pull-requests' && (
                <PullRequestsListView
                  pullRequests={pullRequests}
                  onSelectPR={(pr) => {
                    setSelectedPR(pr);
                    setActiveTab('reviews');
                  }}
                />
              )}

              {activeTab === 'reviews' && (
                <PullRequestReviewView
                  pullRequest={selectedPR}
                  diffFiles={mockDiffFiles}
                  findings={findings}
                  onApplyFix={() => {}}
                  onDismissFinding={handleDismissFinding}
                  onReTriggerReview={handleSimulateReview}
                  onBackToPullRequests={() => setActiveTab('pull-requests')}
                />
              )}

              {activeTab === 'repositories' && <RepositoriesView repositories={repositories} />}

              {activeTab === 'activity' && <ActivityLogView activities={activities} />}

              {activeTab === 'byok' && (
                <BYOKKeysView settings={settings} onSaveSettings={setSettings} />
              )}

              {activeTab === 'analytics' && <AnalyticsView />}

              {activeTab === 'settings' && (
                <WorkspaceSettingsView settings={settings} onSaveSettings={setSettings} />
              )}
            </>
        </main>
      </div>

      {/* Code Review Loading Overlay */}
      {isScanning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-apple-fade">
          <div className="bg-[#16171d] border border-[#232530] rounded-2xl p-8 max-w-md w-full shadow-2xl animate-apple-scale">
            <LoadingState message="CodeRabbit AI Review Running" step={scanStep} />
          </div>
        </div>
      )}

      {/* Global Cmd+K Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        findings={findings}
        pullRequests={pullRequests}
        onSelectFinding={() => {
          setActiveTab('reviews');
        }}
      />

      {/* Krater-style Landing Page Modal Popup */}
      <LandingModal
        isOpen={isLandingOpen}
        onClose={() => setIsLandingOpen(false)}
      />
    </div>
  );
};
