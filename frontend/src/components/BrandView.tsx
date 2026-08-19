'use client';
import React from 'react';
import { Edit3, Check, X, Plus, Trash2, Sparkles, Tag, Users } from 'lucide-react';
import type { Brand, CreateProductRequest, PerformanceSummary, Product, UpdateBrandRequest } from '../lib/types';

interface BrandViewProps {
  brand: Brand | null;
  products: Product[];
  performance: PerformanceSummary | null;
  onUpdateBrand?: (updates: UpdateBrandRequest) => Promise<void> | void;
  onCreateProduct?: (product: CreateProductRequest) => Promise<void> | void;
  onDeleteProduct?: (id: string) => Promise<void> | void;
}

export default function BrandView({
  brand,
  products,
  performance,
  onUpdateBrand,
  onCreateProduct,
  onDeleteProduct,
}: BrandViewProps) {
  // Brand Guidelines Editing state
  const [isEditingBrand, setIsEditingBrand] = React.useState(false);
  const [name, setName] = React.useState('');
  const [campaign, setCampaign] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [toneText, setToneText] = React.useState('');
  const [ageRange, setAgeRange] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [interestsText, setInterestsText] = React.useState('');
  const [isSavingBrand, setIsSavingBrand] = React.useState(false);

  // Add Product state
  const [showAddProduct, setShowAddProduct] = React.useState(false);
  const [prodName, setProdName] = React.useState('');
  const [prodCategory, setProdCategory] = React.useState('Shirts');
  const [prodPrice, setProdPrice] = React.useState('');
  const [prodSeason, setProdSeason] = React.useState('Summer 2026');
  const [prodStock, setProdStock] = React.useState<'In Stock' | 'Low Stock' | 'Out of Stock'>('In Stock');
  const [prodDesc, setProdDesc] = React.useState('');
  const [isAddingProd, setIsAddingProd] = React.useState(false);
  const [deletingProdId, setDeletingProdId] = React.useState<string | null>(null);

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

  if (!brand) {
    return (
      <div className="page-container">
        <div className="skeleton" style={{ width: 200, height: 24, marginBottom: 32 }} />
        <div className="skeleton" style={{ width: '100%', height: 200, borderRadius: 8 }} />
      </div>
    );
  }

  const handleSaveBrand = async () => {
    if (!onUpdateBrand) return;
    setIsSavingBrand(true);
    try {
      const tone = toneText.split(',').map(t => t.trim()).filter(Boolean);
      const interests = interestsText.split(',').map(i => i.trim()).filter(Boolean);
      await onUpdateBrand({
        name,
        campaign,
        description,
        tone,
        audience: {
          ...brand.audience,
          age_range: ageRange,
          location: location,
          interests: interests,
        },
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
      setProdName('');
      setProdPrice('');
      setProdDesc('');
      setShowAddProduct(false);
    } finally {
      setIsAddingProd(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!onDeleteProduct) return;
    setDeletingProdId(id);
    try {
      await onDeleteProduct(id);
    } finally {
      setDeletingProdId(null);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Brand Guidelines & Catalog
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Configure active campaigns, brand voice, audience profile, and e-commerce catalog.
          </p>
        </div>
      </div>

      {/* Brand Guidelines Card */}
      <div className="card" style={{ padding: 28, marginBottom: 24, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 8,
              background: 'var(--text-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800, color: 'var(--bg-primary)',
            }}>
              {brand.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{brand.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Active campaign: <strong style={{ color: 'var(--accent)' }}>{brand.campaign}</strong>
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
              <button
                className="btn-ghost"
                onClick={handleCancelBrand}
                disabled={isSavingBrand}
                style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <X size={13} /> Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveBrand}
                disabled={isSavingBrand}
                style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 4 }}
              >
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
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Brand Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{
                    width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                    borderRadius: 6, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Active Campaign
                </label>
                <input
                  type="text"
                  value={campaign}
                  onChange={e => setCampaign(e.target.value)}
                  placeholder="e.g. Summer 2026, Monsoon Drops, Festive Streetwear"
                  style={{
                    width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                    borderRadius: 6, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Brand Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                style={{
                  width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                  borderRadius: 6, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.5,
                  outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Tone of Voice (comma-separated tags)
              </label>
              <input
                type="text"
                value={toneText}
                onChange={e => setToneText(e.target.value)}
                placeholder="e.g. Minimal, Confident, Modern, Bold, Youthful"
                style={{
                  width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                  borderRadius: 6, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Audience Age Range & Location
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={ageRange}
                    onChange={e => setAgeRange(e.target.value)}
                    placeholder="18-28"
                    style={{
                      width: '40%', background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                      borderRadius: 6, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                    }}
                  />
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Metro & Tier 1 India"
                    style={{
                      width: '60%', background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                      borderRadius: 6, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Audience Interests (comma-separated)
                </label>
                <input
                  type="text"
                  value={interestsText}
                  onChange={e => setInterestsText(e.target.value)}
                  placeholder="Streetwear, Fast Fashion, Nightlife, Pop Culture"
                  style={{
                    width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
                    borderRadius: 6, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                  }}
                />
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

      {/* Product Catalog Section */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
              Product Catalog ({products.length} items)
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Products evaluated by the 5-factor scoring engine for content recommendations.
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => setShowAddProduct(!showAddProduct)}
            style={{ fontSize: 12, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} /> Add Product
          </button>
        </div>

        {/* Add Product Inline Modal/Form */}
        {showAddProduct && (
          <form
            onSubmit={handleAddProductSubmit}
            style={{
              padding: 18, marginBottom: 20, background: 'var(--bg-subtle)',
              border: '1px solid var(--border)', borderRadius: 8,
              display: 'flex', flexDirection: 'column', gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                + Add New Product to Catalog
              </div>
              <button
                type="button"
                onClick={() => setShowAddProduct(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vintage Oversized Denim Jacket"
                  value={prodName}
                  onChange={e => setProdName(e.target.value)}
                  style={{
                    width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '8px 10px', color: 'var(--text-primary)', fontSize: 12, outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Category</label>
                <select
                  value={prodCategory}
                  onChange={e => setProdCategory(e.target.value)}
                  style={{
                    width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '8px 10px', color: 'var(--text-primary)', fontSize: 12, outline: 'none',
                  }}
                >
                  <option value="Shirts">Shirts</option>
                  <option value="T-Shirts">T-Shirts</option>
                  <option value="Pants">Pants</option>
                  <option value="Hoodies">Hoodies</option>
                  <option value="Jackets">Jackets</option>
                  <option value="Co-ords">Co-ords</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Price (₹ INR)</label>
                <input
                  type="number"
                  required
                  placeholder="2499"
                  value={prodPrice}
                  onChange={e => setProdPrice(e.target.value)}
                  style={{
                    width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '8px 10px', color: 'var(--text-primary)', fontSize: 12, outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Season</label>
                <input
                  type="text"
                  value={prodSeason}
                  onChange={e => setProdSeason(e.target.value)}
                  style={{
                    width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '8px 10px', color: 'var(--text-primary)', fontSize: 12, outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Stock Status</label>
                <select
                  value={prodStock}
                  onChange={e => setProdStock(e.target.value as any)}
                  style={{
                    width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '8px 10px', color: 'var(--text-primary)', fontSize: 12, outline: 'none',
                  }}
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Short Description</label>
                <input
                  type="text"
                  placeholder="Key selling points & style angle"
                  value={prodDesc}
                  onChange={e => setProdDesc(e.target.value)}
                  style={{
                    width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '8px 10px', color: 'var(--text-primary)', fontSize: 12, outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowAddProduct(false)}
                style={{ fontSize: 12 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isAddingProd}
                style={{ fontSize: 12, padding: '6px 16px' }}
              >
                {isAddingProd ? 'Adding...' : 'Add to Catalog'}
              </button>
            </div>
          </form>
        )}

        {/* Product Cards Grid */}
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
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {p.name}
                    </div>
                    <div style={{
                      fontSize: 11, flexShrink: 0, marginLeft: 8, fontWeight: 600,
                      color: p.inventory_status === 'In Stock' ? 'var(--green)' : p.inventory_status === 'Low Stock' ? 'var(--amber)' : 'var(--red)',
                    }}>
                      {p.inventory_status}
                    </div>
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
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      disabled={isDeleting}
                      className="btn-danger"
                      style={{ padding: '4px 7px' }}
                      title="Delete product"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
