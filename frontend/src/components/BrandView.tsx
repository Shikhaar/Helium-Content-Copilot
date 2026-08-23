'use client';
import React from 'react';
import {
  Edit3, Check, X, Plus, Trash2, Sparkles, Tag, Users,
  ChevronDown, AlertTriangle, Building2, Layers
} from 'lucide-react';
import { api } from '../lib/api';
import BrandAvatar from './BrandAvatar';
import type {
  Brand, BrandStats, CreateBrandRequest, CreateProductRequest,
  PerformanceSummary, Product, UpdateBrandRequest
} from '../lib/types';

interface BrandViewProps {
  brand: Brand | null;
  products: Product[];
  performance: PerformanceSummary | null;
  brands: Brand[];
  activeBrandId: string;
  onUpdateBrand?: (updates: UpdateBrandRequest) => Promise<void> | void;
  onCreateProduct?: (product: CreateProductRequest) => Promise<void> | void;
  onDeleteProduct?: (id: string) => Promise<void> | void;
  onCreateBrand?: (req: CreateBrandRequest) => Promise<void>;
  onDeleteBrand?: (brandId: string) => Promise<void>;
  onSelectBrand?: (brandId: string) => void;
}

const TONE_PRESETS = ['Confident', 'Playful', 'Minimal', 'Bold', 'Youthful', 'Modern', 'Premium', 'Edgy', 'Warm', 'Witty'];

export default function BrandView({
  brand,
  products,
  performance,
  brands,
  activeBrandId,
  onUpdateBrand,
  onCreateProduct,
  onDeleteProduct,
  onCreateBrand,
  onDeleteBrand,
  onSelectBrand,
}: BrandViewProps) {

  // ── Brand Guidelines Editing State ───────────────────────────────────────────
  const [isEditingBrand, setIsEditingBrand] = React.useState(false);
  const [name, setName] = React.useState('');
  const [campaign, setCampaign] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [toneText, setToneText] = React.useState('');
  const [ageRange, setAgeRange] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [interestsText, setInterestsText] = React.useState('');
  const [isSavingBrand, setIsSavingBrand] = React.useState(false);

  // ── Brand Switcher State ──────────────────────────────────────────────────────
  const [isSwitcherOpen, setIsSwitcherOpen] = React.useState(false);
  const switcherRef = React.useRef<HTMLDivElement>(null);

  // ── Add Brand Modal State ─────────────────────────────────────────────────────
  const [showAddBrand, setShowAddBrand] = React.useState(false);
  const [newBrandName, setNewBrandName] = React.useState('');
  const [newBrandDesc, setNewBrandDesc] = React.useState('');
  const [newBrandTone, setNewBrandTone] = React.useState<string[]>(['Confident']);
  const [newBrandCampaign, setNewBrandCampaign] = React.useState('');
  const [newBrandAge, setNewBrandAge] = React.useState('18-28');
  const [newBrandLocation, setNewBrandLocation] = React.useState('India');
  const [newBrandInterests, setNewBrandInterests] = React.useState('');
  const [isCreatingBrand, setIsCreatingBrand] = React.useState(false);
  const [createBrandError, setCreateBrandError] = React.useState<string | null>(null);

  // ── Delete Brand State ────────────────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [brandStats, setBrandStats] = React.useState<BrandStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = React.useState(false);
  const [isDeletingBrand, setIsDeletingBrand] = React.useState(false);
  const [deleteBrandError, setDeleteBrandError] = React.useState<string | null>(null);

  // ── Add Product State ─────────────────────────────────────────────────────────
  const [showAddProduct, setShowAddProduct] = React.useState(false);
  const [prodName, setProdName] = React.useState('');
  const [prodCategory, setProdCategory] = React.useState('Shirts');
  const [prodPrice, setProdPrice] = React.useState('');
  const [prodSeason, setProdSeason] = React.useState('Summer 2026');
  const [prodStock, setProdStock] = React.useState<'In Stock' | 'Low Stock' | 'Out of Stock'>('In Stock');
  const [prodDesc, setProdDesc] = React.useState('');
  const [isAddingProd, setIsAddingProd] = React.useState(false);
  const [deletingProdId, setDeletingProdId] = React.useState<string | null>(null);

  // Sync brand edit form on brand change
  React.useEffect(() => {
    if (brand) {
      setName(brand.name);
      setCampaign(brand.campaign);
      setDescription(brand.description);
      setToneText(brand.tone.join(', '));
      setAgeRange(brand.audience.age_range);
      setLocation(brand.audience.location);
      setInterestsText(brand.audience.interests.join(', '));
    }
  }, [brand]);

  // Close switcher on outside click
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setIsSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!brand) {
    return (
      <div className="page-container">
        <div className="skeleton" style={{ width: 200, height: 24, marginBottom: 32 }} />
        <div className="skeleton" style={{ width: '100%', height: 200, borderRadius: 8 }} />
      </div>
    );
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSaveBrand = async () => {
    if (!onUpdateBrand) return;
    setIsSavingBrand(true);
    try {
      const tone = toneText.split(',').map(t => t.trim()).filter(Boolean);
      const interests = interestsText.split(',').map(i => i.trim()).filter(Boolean);
      await onUpdateBrand({
        name, campaign, description, tone,
        audience: { ...brand.audience, age_range: ageRange, location, interests },
      });
      setIsEditingBrand(false);
    } finally {
      setIsSavingBrand(false);
    }
  };

  const handleCancelBrand = () => {
    setName(brand.name);
    setCampaign(brand.campaign);
    setDescription(brand.description);
    setToneText(brand.tone.join(', '));
    setAgeRange(brand.audience.age_range);
    setLocation(brand.audience.location);
    setInterestsText(brand.audience.interests.join(', '));
    setIsEditingBrand(false);
  };

  const toggleNewTone = (t: string) => {
    setNewBrandTone(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : prev.length < 5 ? [...prev, t] : prev
    );
  };

  const handleCreateBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreateBrand || !newBrandName.trim() || !newBrandCampaign.trim()) return;
    setIsCreatingBrand(true);
    setCreateBrandError(null);
    try {
      const interests = newBrandInterests.split(',').map(i => i.trim()).filter(Boolean);
      await onCreateBrand({
        name: newBrandName.trim(),
        description: newBrandDesc.trim(),
        tone: newBrandTone.length > 0 ? newBrandTone : ['Confident'],
        campaign: newBrandCampaign.trim(),
        audience: {
          age_range: newBrandAge,
          location: newBrandLocation,
          interests,
          shopping_behavior: [],
        },
      });
      // Reset and close modal on success
      setShowAddBrand(false);
      setNewBrandName('');
      setNewBrandDesc('');
      setNewBrandTone(['Confident']);
      setNewBrandCampaign('');
      setNewBrandInterests('');
    } catch (err: any) {
      setCreateBrandError(err.message || 'Failed to create brand.');
    } finally {
      setIsCreatingBrand(false);
    }
  };

  const handleOpenDeleteConfirm = async () => {
    setDeleteBrandError(null);
    setIsLoadingStats(true);
    setShowDeleteConfirm(true);
    try {
      const stats = await api.getBrandStats(activeBrandId);
      setBrandStats(stats);
    } catch {
      setBrandStats(null);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDeleteBrand) return;
    setIsDeletingBrand(true);
    setDeleteBrandError(null);
    try {
      await onDeleteBrand(activeBrandId);
      setShowDeleteConfirm(false);
    } catch (err: any) {
      setDeleteBrandError(err.message || 'Failed to delete brand.');
    } finally {
      setIsDeletingBrand(false);
    }
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice || !onCreateProduct) return;
    setIsAddingProd(true);
    try {
      await onCreateProduct({
        name: prodName,
        category: prodCategory,
        price_inr: parseInt(prodPrice, 10) || 1999,
        description: prodDesc || `${prodName} by ${brand.name}`,
        season: prodSeason,
        inventory_status: prodStock,
        target_audience: ageRange || 'Young Millennial',
      });
      setProdName(''); setProdPrice(''); setProdDesc('');
      setShowAddProduct(false);
    } finally {
      setIsAddingProd(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!onDeleteProduct) return;
    setDeletingProdId(id);
    try { await onDeleteProduct(id); } finally { setDeletingProdId(null); }
  };

  const isLastBrand = brands.length <= 1;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* ── Page Header with Brand Switcher ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Brand &amp; Catalog
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Configure campaigns, brand voice, audience profile, and product catalog.
          </p>
        </div>

        {/* Brand Switcher + Add Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Brand Switcher Dropdown */}
          <div ref={switcherRef} style={{ position: 'relative' }}>
            <button
              id="brand-switcher-btn"
              onClick={() => setIsSwitcherOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 12px', borderRadius: 8,
                background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                transition: 'border-color 0.15s',
              }}
            >
              <BrandAvatar brandId={activeBrandId} brandName={brand.name} size={22} borderRadius={5} />
              <span>{brand.name}</span>
              <ChevronDown size={14} style={{ opacity: 0.6, transition: 'transform 0.2s', transform: isSwitcherOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>

            {isSwitcherOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200,
                background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                borderRadius: 10, minWidth: 240, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '8px 12px 6px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Switch Brand
                </div>
                {brands.map(b => (
                  <button
                    key={b.id}
                    onClick={() => { onSelectBrand?.(b.id); setIsSwitcherOpen(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', border: 'none',
                      cursor: 'pointer', textAlign: 'left',
                      background: b.id === activeBrandId ? 'var(--bg-subtle)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <BrandAvatar brandId={b.id} brandName={b.name} size={28} borderRadius={6} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 1 }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.campaign}</div>
                    </div>
                    {b.id === activeBrandId && (
                      <Check size={13} style={{ color: 'var(--brown-dark)', flexShrink: 0 }} />
                    )}
                  </button>
                ))}
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                <button
                  onClick={() => { setShowAddBrand(true); setIsSwitcherOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 13, color: 'var(--brown-primary)', fontWeight: 600,
                  }}
                >
                  <Plus size={14} /> Add new brand
                </button>
              </div>
            )}
          </div>

          {/* Add Brand CTA */}
          <button
            id="add-brand-btn"
            className="btn-primary"
            onClick={() => setShowAddBrand(true)}
            style={{ fontSize: 12, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} /> Add Brand
          </button>
        </div>
      </div>

      {/* ── Brand Guidelines Card ── */}
      <div className="card" style={{ padding: 28, marginBottom: 24, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <BrandAvatar brandId={activeBrandId} brandName={brand.name} size={42} borderRadius={8} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{brand.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Active campaign: <strong style={{ color: 'var(--brown-primary)' }}>{brand.campaign}</strong>
              </div>
            </div>
          </div>

          {!isEditingBrand ? (
            <button
              className="btn-ghost"
              onClick={() => setIsEditingBrand(true)}
              style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Edit3 size={14} /> Edit Guidelines
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" onClick={handleCancelBrand} disabled={isSavingBrand}
                style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <X size={13} /> Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveBrand} disabled={isSavingBrand}
                style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Check size={13} /> {isSavingBrand ? 'Saving...' : 'Save Guidelines'}
              </button>
            </div>
          )}
        </div>

        {/* Guidelines View / Edit Form */}
        {isEditingBrand ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Brand Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Active Campaign</label>
                <input type="text" value={campaign} onChange={e => setCampaign(e.target.value)}
                  placeholder="e.g. Summer 2026, Monsoon Drops, Festive Streetwear" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Brand Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Tone of Voice (comma-separated tags)
              </label>
              <input type="text" value={toneText} onChange={e => setToneText(e.target.value)}
                placeholder="e.g. Minimal, Confident, Modern, Bold, Youthful" style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Audience Age Range &amp; Location</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" value={ageRange} onChange={e => setAgeRange(e.target.value)} placeholder="18-28"
                    style={{ ...inputStyle, width: '40%' }} />
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Metro &amp; Tier 1 India"
                    style={{ ...inputStyle, width: '60%' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Audience Interests (comma-separated)</label>
                <input type="text" value={interestsText} onChange={e => setInterestsText(e.target.value)}
                  placeholder="Streetwear, Fast Fashion, Nightlife, Pop Culture" style={inputStyle} />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
              {brand.description}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {brand.tone.map(t => (
                <span key={t} className="badge badge-accent" style={{ fontSize: 12 }}>
                  <Tag size={10} /> {t}
                </span>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="signal-card">
                <div className="label" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Users size={11} /> Target Audience
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {brand.audience.age_range} · {brand.audience.location}
                </div>
                <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {brand.audience.interests.map(i => (
                    <span key={i} style={{ fontSize: 11, color: 'var(--text-muted)', padding: '2px 7px', background: 'var(--bg-card)', borderRadius: 4, border: '1px solid var(--border)' }}>
                      {i}
                    </span>
                  ))}
                </div>
              </div>
              {performance && (
                <div className="signal-card">
                  <div className="label" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Sparkles size={11} /> Top Performing Format
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', marginBottom: 3 }}>
                    {performance.top_performing_format}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Top audience: {performance.top_performing_audience}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Product Catalog Section ── */}
      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
              Product Catalog ({products.length} items)
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Products evaluated by the 5-factor scoring engine for content recommendations.
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowAddProduct(!showAddProduct)}
            style={{ fontSize: 12, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Add Product
          </button>
        </div>

        {showAddProduct && (
          <form onSubmit={handleAddProductSubmit} style={{
            padding: 18, marginBottom: 20, background: 'var(--bg-subtle)',
            border: '1px solid var(--border)', borderRadius: 8,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>+ Add New Product to Catalog</div>
              <button type="button" onClick={() => setShowAddProduct(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Product Name</label>
                <input type="text" required placeholder="e.g. Vintage Oversized Denim Jacket" value={prodName}
                  onChange={e => setProdName(e.target.value)} style={compactInputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Category</label>
                <select value={prodCategory} onChange={e => setProdCategory(e.target.value)} style={compactInputStyle}>
                  {['Shirts', 'T-Shirts', 'Pants', 'Hoodies', 'Jackets', 'Co-ords', 'Dresses', 'Leggings', 'Sports Bras', 'Accessories'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Price (₹ INR)</label>
                <input type="number" required placeholder="2499" value={prodPrice}
                  onChange={e => setProdPrice(e.target.value)} style={compactInputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Season</label>
                <input type="text" value={prodSeason} onChange={e => setProdSeason(e.target.value)} style={compactInputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Stock Status</label>
                <select value={prodStock} onChange={e => setProdStock(e.target.value as any)} style={compactInputStyle}>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Short Description</label>
                <input type="text" placeholder="Key selling points &amp; style angle" value={prodDesc}
                  onChange={e => setProdDesc(e.target.value)} style={compactInputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button type="button" className="btn-ghost" onClick={() => setShowAddProduct(false)} style={{ fontSize: 12 }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={isAddingProd} style={{ fontSize: 12, padding: '6px 16px' }}>
                {isAddingProd ? 'Adding...' : 'Add to Catalog'}
              </button>
            </div>
          </form>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {products.map(p => {
            const isDeleting = deletingProdId === p.id;
            return (
              <div key={p.id} style={{
                padding: '14px 16px', border: '1px solid var(--border)',
                borderRadius: 7, background: 'var(--bg-card)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{p.name}</div>
                    <div style={{
                      fontSize: 11, flexShrink: 0, marginLeft: 8, fontWeight: 600,
                      color: p.inventory_status === 'In Stock' ? 'var(--green)' : p.inventory_status === 'Low Stock' ? 'var(--amber)' : 'var(--red)',
                    }}>{p.inventory_status}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                    {p.category} · ₹{p.price_inr.toLocaleString()} · {p.season}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>{p.views.toLocaleString()} views</span>
                    <span>{p.sales.toLocaleString()} sales</span>
                  </div>
                  {onDeleteProduct && (
                    <button onClick={() => handleDeleteProduct(p.id)} disabled={isDeleting}
                      className="btn-danger" style={{ padding: '4px 7px' }} title="Delete product">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <div className="card" style={{
        padding: 24, border: '1px solid var(--red-border, #fca5a5)',
        background: 'var(--red-subtle, rgba(239,68,68,0.04))',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <AlertTriangle size={15} style={{ color: 'var(--red, #ef4444)' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--red, #ef4444)' }}>Danger Zone</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Permanently remove <strong>{brand.name}</strong> and its entire catalog, opportunities, drafts, and history.
            </p>
          </div>
          <button
            id="delete-brand-btn"
            onClick={handleOpenDeleteConfirm}
            disabled={isLastBrand}
            title={isLastBrand ? 'Cannot delete the last remaining brand' : `Delete ${brand.name}`}
            style={{
              padding: '8px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600,
              cursor: isLastBrand ? 'not-allowed' : 'pointer', flexShrink: 0,
              border: '1.5px solid var(--red-border, #fca5a5)',
              background: 'none', color: 'var(--red, #ef4444)',
              opacity: isLastBrand ? 0.4 : 1,
              transition: 'background 0.15s',
            }}
          >
            Delete Brand
          </button>
        </div>
        {isLastBrand && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Add at least one more brand before deleting this one.
          </p>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════════════════ */}

      {/* ── Add Brand Modal ── */}
      {showAddBrand && (
        <ModalOverlay onClose={() => !isCreatingBrand && setShowAddBrand(false)}>
          <form onSubmit={handleCreateBrandSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 7, background: 'var(--brown-dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Building2 size={16} style={{ color: 'var(--surface)' }} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Create your brand</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>You can configure deeper settings after creation.</div>
                </div>
              </div>
              <button type="button" onClick={() => setShowAddBrand(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}>
                ×
              </button>
            </div>

            {/* Error */}
            {createBrandError && (
              <div style={{ padding: '10px 14px', background: 'var(--red-subtle, rgba(239,68,68,0.06))', border: '1px solid var(--red-border, #fca5a5)', borderRadius: 7, fontSize: 13, color: 'var(--red, #ef4444)' }}>
                {createBrandError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Brand Name <span style={{ color: 'var(--red, #ef4444)' }}>*</span></label>
                <input type="text" required minLength={2} maxLength={100} value={newBrandName}
                  onChange={e => setNewBrandName(e.target.value)} placeholder="e.g. Urban Monkey" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Campaign <span style={{ color: 'var(--red, #ef4444)' }}>*</span></label>
                <input type="text" required minLength={2} maxLength={100} value={newBrandCampaign}
                  onChange={e => setNewBrandCampaign(e.target.value)} placeholder="e.g. Monsoon Drop 2026" style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea value={newBrandDesc} onChange={e => setNewBrandDesc(e.target.value)}
                rows={2} maxLength={500} placeholder="What does this brand stand for? (optional)"
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />
            </div>

            <div>
              <label style={labelStyle}>Tone of Voice <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>(pick 1–5)</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {TONE_PRESETS.map(t => (
                  <button
                    key={t} type="button"
                    onClick={() => toggleNewTone(t)}
                    style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', border: '1.5px solid',
                      borderColor: newBrandTone.includes(t) ? 'var(--brown-dark)' : 'var(--border)',
                      background: newBrandTone.includes(t) ? 'var(--brown-dark)' : 'var(--bg-card)',
                      color: newBrandTone.includes(t) ? 'var(--surface)' : 'var(--text-secondary)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Audience</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 10, marginTop: 6 }}>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Age Range</label>
                  <select value={newBrandAge} onChange={e => setNewBrandAge(e.target.value)} style={compactInputStyle}>
                    {['13-17', '18-24', '18-28', '25-34', '25-40', '30-45', '35-55', 'All Ages'].map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Location</label>
                  <select value={newBrandLocation} onChange={e => setNewBrandLocation(e.target.value)} style={compactInputStyle}>
                    {['India', 'Metro Cities', 'Pan India', 'Tier 1 India', 'Global'].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Interests (comma-separated)</label>
                  <input type="text" value={newBrandInterests} onChange={e => setNewBrandInterests(e.target.value)}
                    placeholder="Streetwear, Music, Travel" style={compactInputStyle} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn-ghost" onClick={() => setShowAddBrand(false)} disabled={isCreatingBrand} style={{ fontSize: 13 }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isCreatingBrand || !newBrandName.trim() || !newBrandCampaign.trim()}
                style={{ fontSize: 13, padding: '8px 20px' }}>
                {isCreatingBrand ? 'Creating...' : 'Create Brand'}
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/* ── Delete Brand Confirmation Modal ── */}
      {showDeleteConfirm && (
        <ModalOverlay onClose={() => !isDeletingBrand && setShowDeleteConfirm(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8, background: 'var(--red-subtle, rgba(239,68,68,0.1))',
                border: '1.5px solid var(--red-border, #fca5a5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <AlertTriangle size={18} style={{ color: 'var(--red, #ef4444)' }} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Delete {brand.name}?
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  This will permanently remove the brand and <strong>all its data</strong>. This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div style={{
              padding: '14px 16px', background: 'var(--bg-subtle)',
              border: '1px solid var(--border)', borderRadius: 8,
            }}>
              {isLoadingStats ? (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading affected records...</div>
              ) : brandStats ? (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    This will permanently remove:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { label: 'Products', count: brandStats.products, icon: <Layers size={13} /> },
                      { label: 'Historical posts', count: brandStats.historical_posts, icon: <Layers size={13} /> },
                      { label: 'Opportunities', count: brandStats.opportunities, icon: <Layers size={13} /> },
                      { label: 'Content drafts', count: brandStats.content_drafts, icon: <Layers size={13} /> },
                      { label: 'Calendar entries', count: brandStats.calendar_entries, icon: <Layers size={13} /> },
                    ].map(({ label, count }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>• {label}</span>
                        <span style={{ fontWeight: 700, color: count > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Could not load affected record counts.</div>
              )}
            </div>

            {/* Error */}
            {deleteBrandError && (
              <div style={{ padding: '10px 14px', background: 'var(--red-subtle, rgba(239,68,68,0.06))', border: '1px solid var(--red-border, #fca5a5)', borderRadius: 7, fontSize: 13, color: 'var(--red, #ef4444)' }}>
                {deleteBrandError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn-ghost" onClick={() => setShowDeleteConfirm(false)} disabled={isDeletingBrand} style={{ fontSize: 13 }}>
                Cancel
              </button>
              <button
                id="confirm-delete-brand-btn"
                onClick={handleConfirmDelete}
                disabled={isDeletingBrand || isLoadingStats}
                style={{
                  padding: '8px 20px', borderRadius: 7, fontSize: 13, fontWeight: 700,
                  cursor: isDeletingBrand || isLoadingStats ? 'not-allowed' : 'pointer',
                  border: 'none', background: 'var(--red, #ef4444)', color: '#fff',
                  opacity: isDeletingBrand || isLoadingStats ? 0.6 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {isDeletingBrand ? 'Deleting...' : `Delete ${brand.name}`}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── Shared Style Constants ──────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
  borderRadius: 6, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
};

const compactInputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 6, padding: '8px 10px', color: 'var(--text-primary)', fontSize: 12, outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4,
};

// ── Modal Overlay Component ─────────────────────────────────────────────────────
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--bg-card)', borderRadius: 12, padding: 28,
        width: '100%', maxWidth: 520,
        border: '1px solid var(--border-medium)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {children}
      </div>
    </div>
  );
}
