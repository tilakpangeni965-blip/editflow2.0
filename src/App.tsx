/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Project } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { ProjectList } from './components/ProjectList';
import { Workbench } from './components/Workbench';
import { UploadModal } from './components/UploadModal';
import { AuthModal } from './components/AuthModal';
import { PricingBillingModal } from './components/PricingBillingModal';
import { BillingHistoryView } from './components/BillingHistoryView';
import { UserProfileModal } from './components/UserProfileModal';
import { AiEditingWorkspace } from './components/AiEditingWorkspace';
import { AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { language, t } = useLanguage();
  const { user, token } = useAuth();

  const [currentView, setCurrentView] = useState<'landing' | 'projects' | 'workbench' | 'billing' | 'ai_editor'>('landing');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // AI Editor state prefilled from transcript / outside
  const [aiEditorContent, setAiEditorContent] = useState<string>('');
  const [aiEditorTitle, setAiEditorTitle] = useState<string>('');
  const [aiEditorInstruction, setAiEditorInstruction] = useState<string>('');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup' | 'verify' | 'forgot_password'>('login');
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);


  // Load projects belonging strictly to the logged-in user
  const fetchUserProjects = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.projects) {
          setProjects(data.projects);
          // If we had an active project, refresh its reference
          if (activeProject) {
            const found = data.projects.find((p: Project) => p.id === activeProject.id);
            if (found) setActiveProject(found);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch user projects:', err);
    }
  };

  useEffect(() => {
    fetchUserProjects();
  }, [token, user?.id]);

  const handleSelectProject = (project: Project) => {
    setActiveProject(project);
    setCurrentView('workbench');
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
    setActiveProject(newProject);
    setCurrentView('workbench');
  };

  const handleUpdateProject = async (updatedFields: Partial<Project>) => {
    if (!activeProject) return;
    const updated = { ...activeProject, ...updatedFields };
    setActiveProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

    try {
      await fetch(`/api/projects/${activeProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedFields),
      });
    } catch (err) {
      console.error('Failed to sync project update:', err);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (activeProject?.id === projectId) {
        setActiveProject(null);
        setCurrentView('projects');
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] dark:bg-[#0b1020] text-[#0f1c2d] dark:text-[#f8f9ff] flex flex-col font-bilingual selection:bg-[#b6152e] selection:text-white transition-colors duration-200">
      {/* Email Verification Warning Banner if unverified */}
      {user && !user.isEmailVerified && (
        <div className="bg-[#ffdcc5] dark:bg-[#472000] border-b border-[#ffb783] dark:border-[#703700] px-4 py-2 text-xs text-[#703700] dark:text-[#ffdcc5] flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-2xl font-medium">
            <AlertTriangle className="w-4 h-4 text-[#e07a1e] shrink-0" />
            <span>
              {language === 'ne'
                ? 'तपाईंको इमेल ठेगाना अझै प्रमाणित भएको छैन। आफ्ना फाइलहरू सधैं सुरक्षित राख्न कृपया प्रमाणीकरण गर्नुहोस्।'
                : 'Your email address is not verified yet. Please verify your account to ensure private media access.'}
            </span>
          </div>
          <button
            onClick={() => {
              setAuthInitialMode('verify');
              setIsAuthOpen(true);
            }}
            className="px-3 py-1 rounded-lg bg-white dark:bg-[#1b2a4a] border border-[#ffb783] text-[#b6152e] dark:text-[#ffdad9] font-bold font-heading hover:bg-[#ffdad9]/40 transition-colors shadow-sm"
          >
            {language === 'ne' ? 'कोड हाल्नुहोस् (Verify Now)' : 'Verify Now'}
          </button>
        </div>
      )}

      {/* Primary Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          if (view === 'projects' || view === 'landing') setActiveProject(null);
        }}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenAuth={() => {
          setAuthInitialMode('login');
          setIsAuthOpen(true);
        }}
        onOpenPricing={() => setIsPricingOpen(true)}
        onOpenVerifyModal={() => {
          setAuthInitialMode('verify');
          setIsAuthOpen(true);
        }}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentView === 'landing' && (
          <LandingPage
            onStartCreating={() => setCurrentView('projects')}
            onOpenPricing={() => setIsPricingOpen(true)}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenAiEditor={() => setCurrentView('ai_editor')}
          />
        )}

        {currentView === 'projects' && (
          <ProjectList
            projects={projects}
            onSelectProject={handleSelectProject}
            onOpenUpload={() => setIsUploadOpen(true)}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {currentView === 'workbench' && activeProject && (
          <Workbench
            project={activeProject}
            onBack={() => {
              setActiveProject(null);
              setCurrentView('projects');
            }}
            onUpdateProject={handleUpdateProject}
            onOpenAiEditor={(text, title, instruction) => {
              setAiEditorContent(text);
              setAiEditorTitle(title);
              setAiEditorInstruction(instruction);
              setCurrentView('ai_editor');
            }}
          />
        )}

        {currentView === 'ai_editor' && (
          <AiEditingWorkspace
            initialContent={aiEditorContent}
            initialTitle={aiEditorTitle}
            initialInstruction={aiEditorInstruction}
            onOpenPricing={() => setIsPricingOpen(true)}
            onBackToProjects={() => setCurrentView('projects')}
          />
        )}

        {currentView === 'billing' && (
          <BillingHistoryView
            onOpenPricing={() => setIsPricingOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#dde9ff] dark:border-[#1b2a4a] bg-white dark:bg-[#041534] py-6 text-xs text-[#75777f] dark:text-[#8392b7] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1b2a4a] dark:text-white font-heading">Editflow (शिक्षा स्टुडियो नेपाल)</span>
            <span>•</span>
            <span className="font-bilingual">नेपालका शिक्षक, क्रिएटर तथा परीक्षा कोचिङ इन्स्टिच्युटहरूका लागि निर्मित</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[#45464e] dark:text-[#cddbf2] font-mono">
            <span className="text-[#2d7d1b] dark:text-emerald-400 font-bold">MBL • connectIPS • NepalPay QR • eSewa</span>
            <span>•</span>
            <span>HMAC-SHA256 Private Links</span>
            <span>•</span>
            <span>SEE • +2 • Lok Sewa • Entrance</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onProjectCreated={handleProjectCreated}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authInitialMode}
      />

      <PricingBillingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenPricing={() => setIsPricingOpen(true)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
