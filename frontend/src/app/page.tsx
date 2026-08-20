'use client';
import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { api, setApiAuthToken } from '../lib/api';
import type {
  AnalyzeResponse,
  Brand,
  CalendarEntry,
  ContentDraft,
  CreateProductRequest,
  GenerateContentRequest,
  Objective,
  Opportunity,
  PerformanceSummary,
  Platform,
  PostFormat,
  Product,
  ScheduleRequest,
  UpdateBrandRequest,
} from '../lib/types';

import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import OpportunityDetail from '../components/OpportunityDetail';
import ContentStudio from '../components/ContentStudio';
import CalendarView from '../components/CalendarView';
import BrandView from '../components/BrandView';

type Tab = 'opportunities' | 'create' | 'calendar' | 'brand';
type Screen =
  | { name: 'dashboard' }
  | { name: 'opportunity'; id: string }
  | { name: 'create'; opportunityId?: string }
  | { name: 'calendar' }
  | { name: 'brand' };

export default function Home() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [activeTab, setActiveTab] = React.useState<Tab>('opportunities');
  const [screen, setScreen] = React.useState<Screen>({ name: 'dashboard' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

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
        if (isSignedIn) {
          const token = await getToken();
          setApiAuthToken(token);
        }

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
        setError('Could not connect to BrandBrew backend. Is it running on port 8000?');
      }
    };
    loadBootstrap();
  }, [isSignedIn, getToken]);

  // Navigation helpers
  const navigate = (s: Screen) => {
    setScreen(s);
    const tabMap: Record<string, Tab> = {
      dashboard: 'opportunities',
      opportunity: 'opportunities',
      create: 'create',
      calendar: 'calendar',
      brand: 'brand',
    };
    setActiveTab(tabMap[s.name] || 'opportunities');
    setError(null);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setError(null);

    if (tab === 'opportunities') {
      // Go to the main opportunities list hub
      setScreen({ name: 'dashboard' });
    } else if (tab === 'create') {
      // If we have a draft already, go straight to the studio
      if (currentDraft && selectedOpportunity) {
        navigate({ name: 'create', opportunityId: selectedOpportunity.id });
      } else if (selectedOpportunity) {
        // Have an opportunity chosen — trigger generation
        handleGenerateContent(selectedOpportunity.id);
      } else {
        // Direct to Content Studio's Opportunity Picker screen
        navigate({ name: 'create' });
      }
    } else if (tab === 'calendar') {
      setScreen({ name: 'calendar' });
    } else if (tab === 'brand') {
      setScreen({ name: 'brand' });
    }
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
    const targetOpp = (opportunityId && analyzeResult?.opportunities.find(o => o.id === opportunityId))
      || (selectedOpportunity?.id === opportunityId ? selectedOpportunity : null)
      || selectedOpportunity;

    if (!targetOpp) return;

    setSelectedOpportunity(targetOpp);
    setCurrentDraft(null); // Clear previous draft so user doesn't see old slides while generating

    const req: GenerateContentRequest = {
      opportunity_id: targetOpp.id,
      platform: targetOpp.platform as Platform,
      format: targetOpp.format as PostFormat,
      audience: targetOpp.audience,
      objective: targetOpp.objective as Objective,
    };
    setGenerateRequest(req);
    setIsGenerating(true);
    navigate({ name: 'create', opportunityId: targetOpp.id });

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
      return updated;
    } catch (e: any) {
      setError(e.message || 'Approval failed.');
      throw e;
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
      return updated;
    } catch (e: any) {
      setError(e.message || 'Scheduling failed.');
      throw e;
    }
  };

  // Update draft (caption, cta, hashtags, slides)
  const handleUpdateDraft = async (updates: Partial<Pick<ContentDraft, 'caption' | 'cta' | 'hashtags' | 'slides'>>) => {
    if (!currentDraft) return;
    try {
      const updated = await api.updateDraft(currentDraft.id, updates);
      setCurrentDraft(updated);
      return updated;
    } catch (e: any) {
      setError(e.message || 'Update failed.');
      throw e;
    }
  };

  // Backwards compatibility alias
  const handleUpdateCaption = (caption: string) => handleUpdateDraft({ caption });

  // Delete Calendar Entry
  const handleDeleteCalendarEntry = async (id: string) => {
    try {
      await api.deleteCalendarEntry(id);
      const cal = await api.getCalendar();
      setCalendarEntries(cal);
    } catch (e: any) {
      setError(e.message || 'Failed to remove calendar entry.');
    }
  };

  // Reschedule Calendar Entry (Drag and drop or quick edit)
  const handleRescheduleCalendarEntry = async (entryId: string, draftId: string, newDate: string, newTime?: string) => {
    try {
      const existing = calendarEntries.find(c => c.id === entryId);
      const currentTime = newTime || (existing ? existing.scheduled_datetime.split('T')[1]?.slice(0, 5) : '19:00');
      const updated = await api.scheduleDraft(draftId, {
        scheduled_date: newDate,
        scheduled_time: currentTime,
        platform: (existing?.platform as Platform) || 'Instagram',
      });
      if (currentDraft && currentDraft.id === draftId) {
        setCurrentDraft(updated);
      }
      const cal = await api.getCalendar();
      setCalendarEntries(cal);
      return updated;
    } catch (e: any) {
      setError(e.message || 'Failed to reschedule post.');
      throw e;
    }
  };

  // View Draft from Calendar
  const handleViewDraft = async (draftId: string) => {
    try {
      const draft = await api.getDraft(draftId);
      if (draft) {
        setCurrentDraft(draft);
        const opp = analyzeResult?.opportunities.find(o => o.id === draft.opportunity_id)
          || await api.getOpportunity(draft.opportunity_id).catch(() => null)
          || (analyzeResult?.opportunities.find(o => o.format.toLowerCase() === draft.format.toLowerCase()) || analyzeResult?.opportunities[0] || null);
        if (opp) {
          setSelectedOpportunity(opp);
        }
        navigate({ name: 'create', opportunityId: draft.opportunity_id });
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load post draft.');
    }
  };

  // Brand Guidelines Update
  const handleUpdateBrand = async (updates: UpdateBrandRequest) => {
    try {
      const updated = await api.updateBrand(updates);
      setBrand(updated);
    } catch (e: any) {
      setError(e.message || 'Failed to update brand guidelines.');
    }
  };

  // Create Product in Catalog
  const handleCreateProduct = async (req: CreateProductRequest) => {
    try {
      const newProd = await api.createProduct(req);
      setProducts(prev => [newProd, ...prev]);
    } catch (e: any) {
      setError(e.message || 'Failed to add product to catalog.');
    }
  };

  // Delete Product from Catalog
  const handleDeleteProduct = async (id: string) => {
    try {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e: any) {
      setError(e.message || 'Failed to delete product.');
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
            opportunities={analyzeResult?.opportunities || []}
            isGenerating={isGenerating}
            onBack={() => navigate({ name: 'dashboard' })}
            onSelectOpportunity={(opp) => {
              setSelectedOpportunity(opp);
              handleGenerateContent(opp.id);
            }}
            onRegenerate={handleRegenerate}
            onApprove={handleApprove}
            onSchedule={handleSchedule}
            onUpdateCaption={handleUpdateCaption}
            onUpdateDraft={handleUpdateDraft}
          />
        );

      case 'calendar':
        return (
          <CalendarView
            entries={calendarEntries}
            onDeleteEntry={handleDeleteCalendarEntry}
            onSelectDraft={handleViewDraft}
            onRescheduleEntry={handleRescheduleCalendarEntry}
          />
        );

      case 'brand':
        return (
          <BrandView
            brand={brand}
            products={products}
            performance={performance}
            onUpdateBrand={handleUpdateBrand}
            onCreateProduct={handleCreateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        );

      default:
        return null;
    }
  };

  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !isLoaded) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'var(--brown-dark)',
              color: 'var(--surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            B
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Loading BrandBrew workspace...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Responsive Sidebar & Drawer */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onHome={() => navigate({ name: 'dashboard' })}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(c => !c)}
        brandName={brand?.name || 'SNITCH'}
        campaign={brand?.campaign || 'Summer 2026'}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile Top Navigation Header */}
        <header
          className="mobile-only"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '6px 8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Open navigation menu"
            >
              <Menu size={16} />
            </button>
            <button
              onClick={() => navigate({ name: 'dashboard' })}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: 5,
                background: 'var(--brown-dark)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--surface)' }}>H</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brown-dark)', letterSpacing: '0.08em' }}>
                HELIUM
              </span>
            </button>
          </div>

          <span className="badge badge-neutral" style={{ fontSize: 10 }}>
            {activeTab === 'create' ? 'Studio' : activeTab === 'opportunities' ? 'Opportunities' : activeTab === 'calendar' ? 'Calendar' : 'Brand'}
          </span>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          {/* Error banner */}
          {error && (
            <div style={{
              margin: '16px 16px 0', padding: '12px 16px',
              background: 'var(--red-subtle)', border: '1px solid var(--red-border)',
              borderRadius: 7, color: 'var(--red)', fontSize: 13,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
          )}
          {renderScreen()}
        </main>
      </div>
    </div>
  );
}
