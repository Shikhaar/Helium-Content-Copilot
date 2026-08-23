'use client';
import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { api, setApiAuthToken, setTokenGetter } from '../lib/api';
import type {
  AnalyzeResponse,
  Brand,
  CalendarEntry,
  ContentDraft,
  CreateBrandRequest,
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

  // Multi-brand state
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = React.useState<string>('snitch');

  // Data state
  const [brand, setBrand] = React.useState<Brand | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [performance, setPerformance] = React.useState<PerformanceSummary | null>(null);
  const [analyzeResult, setAnalyzeResult] = React.useState<AnalyzeResponse | null>(null);
  const [calendarEntries, setCalendarEntries] = React.useState<CalendarEntry[]>([]);

  // Loading state
  const [analyzingBrandId, setAnalyzingBrandId] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Current selection
  const [selectedOpportunity, setSelectedOpportunity] = React.useState<Opportunity | null>(null);
  const [currentDraft, setCurrentDraft] = React.useState<ContentDraft | null>(null);
  const [generateRequest, setGenerateRequest] = React.useState<GenerateContentRequest | null>(null);

  // Error state
  const [error, setError] = React.useState<string | null>(null);

  // Ref to track latest selected brand for async callbacks
  const selectedBrandIdRef = React.useRef(selectedBrandId);
  selectedBrandIdRef.current = selectedBrandId;

  // Ref to scrollable main content container
  const mainRef = React.useRef<HTMLElement | null>(null);

  // Automatically scroll viewport to top whenever the active screen or opportunity changes
  React.useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [screen]);

  // Function to load all data for a specific brand
  const loadBrandData = React.useCallback(async (brandId: string) => {
    try {
      setError(null);
      const [b, p, perf, cal, opps] = await Promise.all([
        api.getBrand(brandId),
        api.getProducts(brandId),
        api.getPerformance(brandId),
        api.getCalendar(brandId),
        api.getOpportunities(brandId),
      ]);

      // Only apply state if this brand is still the active one
      if (selectedBrandIdRef.current === brandId) {
        setBrand(b);
        setProducts(p);
        setPerformance(perf);
        setCalendarEntries(cal);

        if (opps.length > 0) {
          setAnalyzeResult({
            opportunities: opps,
            performance_summary: perf,
            is_demo: opps[0].is_demo,
          });
        } else {
          setAnalyzeResult(null);
        }
      }
    } catch (e) {
      console.error(`Failed to load brand data for '${brandId}':`, e);
      if (selectedBrandIdRef.current === brandId) {
        setError(`Could not load brand data for '${brandId}'.`);
      }
    }
  }, []);

  // Register Clerk's getToken as a live getter so every API request
  // fetches a fresh JWT — avoids "token expired" errors after ~60s.
  React.useEffect(() => {
    if (isLoaded && isSignedIn && getToken) {
      setTokenGetter(() => getToken());
    } else {
      setTokenGetter(null);
    }
    return () => setTokenGetter(null);
  }, [isLoaded, isSignedIn, getToken]);

  // Load initial brands list and active brand data
  React.useEffect(() => {
    if (!isLoaded) return;
    const loadBootstrap = async () => {
      try {
        const brandsList = await api.listBrands();
        setBrands(brandsList);
        const initialBrandId = brandsList.length > 0 ? brandsList[0].id : 'snitch';
        setSelectedBrandId(initialBrandId);
        await loadBrandData(initialBrandId);
      } catch (e) {
        console.error('Bootstrap failed:', e);
        setError('Could not connect to BrandBrew backend. Is it running on port 8000?');
      }
    };
    loadBootstrap();
  }, [isLoaded, isSignedIn, getToken, loadBrandData]);

  // Brand Switcher Handler
  const handleBrandChange = async (brandId: string) => {
    setSelectedBrandId(brandId);
    setSelectedOpportunity(null);
    setCurrentDraft(null);
    setGenerateRequest(null);

    // Preserve the current tab so switching from Brand & Catalog, Calendar, etc. keeps the user in place
    if (activeTab === 'brand') {
      setScreen({ name: 'brand' });
    } else if (activeTab === 'calendar') {
      setScreen({ name: 'calendar' });
    } else if (activeTab === 'create') {
      setScreen({ name: 'create' });
    } else {
      setScreen({ name: 'dashboard' });
      setActiveTab('opportunities');
    }

    await loadBrandData(brandId);
  };

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
      setScreen({ name: 'dashboard' });
    } else if (tab === 'create') {
      if (currentDraft && selectedOpportunity) {
        navigate({ name: 'create', opportunityId: selectedOpportunity.id });
      } else if (selectedOpportunity) {
        handleGenerateContent(selectedOpportunity.id);
      } else {
        navigate({ name: 'create' });
      }
    } else if (tab === 'calendar') {
      setScreen({ name: 'calendar' });
      // Refresh calendar entries so newly scheduled posts appear
      api.getCalendar(selectedBrandId)
        .then(cal => setCalendarEntries(cal))
        .catch(() => {/* non-fatal */});
    } else if (tab === 'brand') {
      setScreen({ name: 'brand' });
    }
  };

  // Analysis (Runs 2-Stage Recommendation Engine for the selected brand)
  const handleAnalyze = async () => {
    const targetBrand = selectedBrandId;
    setAnalyzingBrandId(targetBrand);
    setError(null);
    try {
      const result = await api.analyze(targetBrand);
      if (selectedBrandIdRef.current === targetBrand) {
        setAnalyzeResult(result);
      }
    } catch (e: any) {
      if (selectedBrandIdRef.current === targetBrand) {
        setError(e.message || 'Analysis failed. Please try again.');
      }
    } finally {
      setAnalyzingBrandId(curr => (curr === targetBrand ? null : curr));
    }
  };

  // View opportunity
  const handleViewOpportunity = async (id: string) => {
    const opp = analyzeResult?.opportunities.find(o => o.id === id)
      || await api.getOpportunity(id, selectedBrandId).catch(() => null);
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
    setCurrentDraft(null);

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
      const cal = await api.getCalendar(selectedBrandId);
      setCalendarEntries(cal);
      // Navigate to calendar so the user sees the scheduled post
      navigate({ name: 'calendar' });
      return updated;
    } catch (e: any) {
      setError(e.message || 'Scheduling failed.');
      throw e;
    }
  };

  // Update draft
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
      const cal = await api.getCalendar(selectedBrandId);
      setCalendarEntries(cal);
    } catch (e: any) {
      setError(e.message || 'Failed to remove calendar entry.');
    }
  };

  // Reschedule Calendar Entry
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
      const cal = await api.getCalendar(selectedBrandId);
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
          || await api.getOpportunity(draft.opportunity_id, selectedBrandId).catch(() => null)
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
      const updated = await api.updateBrand(updates, selectedBrandId);
      setBrand(updated);
      const updatedBrands = await api.listBrands();
      setBrands(updatedBrands);
    } catch (e: any) {
      setError(e.message || 'Failed to update brand guidelines.');
    }
  };

  // Create Product in Catalog
  const handleCreateProduct = async (req: CreateProductRequest) => {
    try {
      const newProd = await api.createProduct(req, selectedBrandId);
      setProducts(prev => [newProd, ...prev]);
    } catch (e: any) {
      setError(e.message || 'Failed to add product to catalog.');
    }
  };

  // Delete Product from Catalog
  const handleDeleteProduct = async (id: string) => {
    try {
      await api.deleteProduct(id, selectedBrandId);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e: any) {
      setError(e.message || 'Failed to delete product.');
    }
  };

  // Create a new Brand
  const handleCreateBrand = async (req: CreateBrandRequest) => {
    try {
      const newBrand = await api.createBrand(req);
      const updatedBrands = await api.listBrands();
      setBrands(updatedBrands);
      // Switch to the newly created brand
      setSelectedBrandId(newBrand.id);
      setSelectedOpportunity(null);
      setCurrentDraft(null);
      setGenerateRequest(null);
      await loadBrandData(newBrand.id);
    } catch (e: any) {
      setError(e.message || 'Failed to create brand.');
      throw e; // Re-throw so BrandView modal can show validation errors
    }
  };

  // Delete a Brand (with cascade)
  const handleDeleteBrand = async (brandId: string) => {
    try {
      await api.deleteBrand(brandId);
      const updatedBrands = await api.listBrands();
      setBrands(updatedBrands);
      // Switch to the first remaining brand
      if (updatedBrands.length > 0) {
        const nextBrandId = updatedBrands[0].id;
        setSelectedBrandId(nextBrandId);
        setSelectedOpportunity(null);
        setCurrentDraft(null);
        setGenerateRequest(null);
        if (activeTab === 'brand') {
          setScreen({ name: 'brand' });
        } else if (activeTab === 'calendar') {
          setScreen({ name: 'calendar' });
        } else {
          setScreen({ name: 'dashboard' });
          setActiveTab('opportunities');
        }
        await loadBrandData(nextBrandId);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to delete brand.');
      throw e; // Re-throw so BrandView can show the error in the confirm modal
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
            isAnalyzing={analyzingBrandId === selectedBrandId}
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
            brands={brands}
            activeBrandId={selectedBrandId}
            onUpdateBrand={handleUpdateBrand}
            onCreateProduct={handleCreateProduct}
            onDeleteProduct={handleDeleteProduct}
            onCreateBrand={handleCreateBrand}
            onDeleteBrand={handleDeleteBrand}
            onSelectBrand={handleBrandChange}
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
          <img
            src="/brandbrew-icon.png"
            alt="BrandBrew"
            style={{ width: 28, height: 'auto', objectFit: 'contain' }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Loading BrandBrew workspace...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Responsive Sidebar with Multi-Brand Workspace Selector */}
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
        brands={brands}
        activeBrandId={selectedBrandId}
        onSelectBrand={handleBrandChange}
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
              <img
                src="/brandbrew-icon.png"
                alt="BrandBrew Cup"
                style={{ width: 28, height: 28, objectFit: 'contain' }}
              />
              <img
                src="/brandbrew-text.png"
                alt="BrandBrew"
                style={{ height: 16, width: 'auto', objectFit: 'contain' }}
              />
            </button>
          </div>

          <span className="badge badge-neutral" style={{ fontSize: 10 }}>
            {activeTab === 'create' ? 'Studio' : activeTab === 'opportunities' ? 'Opportunities' : activeTab === 'calendar' ? 'Calendar' : 'Brand'}
          </span>
        </header>

        <main ref={mainRef} style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
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
