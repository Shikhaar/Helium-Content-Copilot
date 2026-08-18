'use client';
import React from 'react';
import { api } from '@/lib/api';
import type {
  AnalyzeResponse,
  Brand,
  CalendarEntry,
  ContentDraft,
  GenerateContentRequest,
  Opportunity,
  PerformanceSummary,
  Product,
  ScheduleRequest,
} from '@/lib/types';

import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import OpportunityDetail from '@/components/OpportunityDetail';
import ContentStudio from '@/components/ContentStudio';
import CalendarView from '@/components/CalendarView';
import BrandView from '@/components/BrandView';

type Tab = 'dashboard' | 'opportunities' | 'create' | 'calendar' | 'brand';
type Screen =
  | { name: 'dashboard' }
  | { name: 'opportunity'; id: string }
  | { name: 'create'; opportunityId: string }
  | { name: 'calendar' }
  | { name: 'brand' };

export default function Home() {
  const [activeTab, setActiveTab] = React.useState<Tab>('dashboard');
  const [screen, setScreen] = React.useState<Screen>({ name: 'dashboard' });

  // Data state
  const [brand, setBrand] = React.useState<Brand | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [performance, setPerformance] = React.useState<PerformanceSummary | null>(null);
  const [analyzeResult, setAnalyzeResult] = React.useState<AnalyzeResponse | null>(null);
  const [calendarEntries, setCalendarEntries] = React.useState<CalendarEntry[]>([]);

  // Loading state
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Current selection
  const [selectedOpportunity, setSelectedOpportunity] = React.useState<Opportunity | null>(null);
  const [currentDraft, setCurrentDraft] = React.useState<ContentDraft | null>(null);
  const [generateRequest, setGenerateRequest] = React.useState<GenerateContentRequest | null>(null);

  // Error state
  const [error, setError] = React.useState<string | null>(null);

  // Load initial data
  React.useEffect(() => {
    const loadBootstrap = async () => {
      try {
        const [b, p, perf, cal] = await Promise.all([
          api.getBrand(),
          api.getProducts(),
          api.getPerformance(),
          api.getCalendar(),
        ]);
        setBrand(b);
        setProducts(p);
        setPerformance(perf);
        setCalendarEntries(cal);

        // Try to load existing opportunities
        const opps = await api.getOpportunities();
        if (opps.length > 0) {
          setAnalyzeResult({
            opportunities: opps,
            performance_summary: perf,
            is_demo: opps[0].is_demo,
          });
        }
      } catch (e) {
        console.error('Bootstrap failed:', e);
        setError('Could not connect to Helium backend. Is it running on port 8000?');
      }
    };
    loadBootstrap();
  }, []);

  // Navigation helpers
  const navigate = (s: Screen) => {
    setScreen(s);
    const tabMap: Record<string, Tab> = {
      dashboard: 'dashboard', opportunity: 'opportunities',
      create: 'create', calendar: 'calendar', brand: 'brand',
    };
    setActiveTab(tabMap[s.name] || 'dashboard');
    setError(null);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    const screenMap: Record<Tab, Screen> = {
      dashboard: { name: 'dashboard' },
      opportunities: { name: 'dashboard' }, // stays on dashboard until opp selected
      create: { name: 'dashboard' },
      calendar: { name: 'calendar' },
      brand: { name: 'brand' },
    };
    setScreen(screenMap[tab]);
    setError(null);
  };

  // Analysis
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await api.analyze();
      setAnalyzeResult(result);
    } catch (e: any) {
      setError(e.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // View opportunity
  const handleViewOpportunity = async (id: string) => {
    const opp = analyzeResult?.opportunities.find(o => o.id === id)
      || await api.getOpportunity(id).catch(() => null);
    if (opp) {
      setSelectedOpportunity(opp);
      navigate({ name: 'opportunity', id });
    }
  };

  // Generate content
  const handleGenerateContent = async (opportunityId?: string) => {
    const oppId = opportunityId || selectedOpportunity?.id;
    if (!oppId || !selectedOpportunity) return;

    const req: GenerateContentRequest = {
      opportunity_id: oppId,
      platform: 'Instagram',
      format: 'Carousel',
      audience: selectedOpportunity.audience,
      objective: selectedOpportunity.objective as any,
    };
    setGenerateRequest(req);
    setIsGenerating(true);
    navigate({ name: 'create', opportunityId: oppId });

    try {
      const draft = await api.generateContent(req);
      setCurrentDraft(draft);
    } catch (e: any) {
      setError(e.message || 'Content generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate
  const handleRegenerate = async () => {
    if (!generateRequest) return;
    setIsGenerating(true);
    try {
      const draft = await api.regenerateContent(generateRequest);
      setCurrentDraft(draft);
    } catch (e: any) {
      setError(e.message || 'Regeneration failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Approve
  const handleApprove = async () => {
    if (!currentDraft) return;
    try {
      const updated = await api.approveDraft(currentDraft.id);
      setCurrentDraft(updated);
    } catch (e: any) {
      setError(e.message || 'Approval failed.');
    }
  };

  // Schedule
  const handleSchedule = async (req: ScheduleRequest) => {
    if (!currentDraft) return;
    try {
      const updated = await api.scheduleDraft(currentDraft.id, req);
      setCurrentDraft(updated);
      const cal = await api.getCalendar();
      setCalendarEntries(cal);
    } catch (e: any) {
      setError(e.message || 'Scheduling failed.');
    }
  };

  // Update caption
  const handleUpdateCaption = async (caption: string) => {
    if (!currentDraft) return;
    try {
      const updated = await api.updateDraft(currentDraft.id, { caption });
      setCurrentDraft(updated);
    } catch (e: any) {
      setError(e.message || 'Update failed.');
    }
  };

  // Render current screen
  const renderScreen = () => {
    switch (screen.name) {
      case 'dashboard':
        return (
          <Dashboard
            brand={brand}
            productsCount={products.length}
            performance={performance}
            analyzeResult={analyzeResult}
            isAnalyzing={isAnalyzing}
            onAnalyze={handleAnalyze}
            onViewOpportunity={handleViewOpportunity}
            onViewCalendar={() => navigate({ name: 'calendar' })}
            scheduledCount={calendarEntries.length}
          />
        );

      case 'opportunity':
        return selectedOpportunity ? (
          <OpportunityDetail
            opportunity={selectedOpportunity}
            product={products.find(p => p.id === selectedOpportunity.suggested_product_id) || null}
            onBack={() => navigate({ name: 'dashboard' })}
            onGenerate={() => handleGenerateContent()}
          />
        ) : null;

      case 'create':
        return (
          <ContentStudio
            draft={currentDraft}
            opportunity={selectedOpportunity}
            isGenerating={isGenerating}
            onBack={() => navigate({ name: 'opportunity', id: selectedOpportunity?.id || '' })}
            onRegenerate={handleRegenerate}
            onApprove={handleApprove}
            onSchedule={handleSchedule}
            onUpdateCaption={handleUpdateCaption}
          />
        );

      case 'calendar':
        return <CalendarView entries={calendarEntries} />;

      case 'brand':
        return <BrandView brand={brand} products={products} performance={performance} />;

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {/* Error banner */}
        {error && (
          <div style={{
            margin: '20px 48px 0', padding: '12px 18px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8, color: '#ef4444', fontSize: 13,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
        )}
        {renderScreen()}
      </main>
    </div>
  );
}
