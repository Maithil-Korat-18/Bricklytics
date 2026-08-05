import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Download, MapPin, SlidersHorizontal, Sparkles, Trophy, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { buyerApi } from '../../services/buyerApi';
import { useToast } from '../../components/common/ToastContext';
import { getPropertyDetailsPath } from '../../constants/routes';
import { getPropertyMediaUrl } from '../../utils/propertyMedia';
import { getComparePropertyIds, removeComparePropertyId, saveComparePropertyIds } from '../../utils/compareSelection';

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'Not specified';
  const amount = Number(value);
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

const displayValue = (value, suffix = '') => {
  if (value === null || value === undefined || value === '') return 'Not specified';
  return `${value}${suffix}`;
};

const getAiPrice = (property) => property.ai_fair_price ?? property.predicted_price;
const amenityName = (amenity) => typeof amenity === 'string' ? amenity : amenity?.name;

const nearbyCategory = (place) => {
  const normalized = String(place || '').toLowerCase();
  if (/bank|atm/.test(normalized)) return 'Nearby banks & ATMs';
  if (/hospital|clinic|medical|health/.test(normalized)) return 'Nearby hospitals';
  if (/school|college|university|academy/.test(normalized)) return 'Nearby schools';
  if (/mall|market|shopping|store/.test(normalized)) return 'Nearby malls & shopping';
  if (/metro|train|railway/.test(normalized)) return 'Nearby metro & transit';
  return 'Other nearby places';
};

const nearbyPlacesFor = (property) => [
  ...(property.nearby_places || []),
  ...(property.amenities || []).map(amenityName).filter((name) => nearbyCategory(name) !== 'Other nearby places'),
].filter(Boolean);

function ComparisonTable({ title, properties, rows }) {
  const gridStyle = { gridTemplateColumns: `180px repeat(${properties.length}, minmax(220px, 1fr))` };
  const tableMinWidth = Math.max(760, 180 + properties.length * 230);

  return (
    <section>
      <h2 className="font-headline-md text-on-surface mb-4">{title}</h2>
      <div className="comparison-print-table overflow-x-auto rounded-xl border border-outline-variant/50 bg-surface-container-lowest shadow-ambient">
        <div className="comparison-table-content" style={{ minWidth: `${tableMinWidth}px` }}>
          <div className="grid bg-inverse-surface px-4 py-3 text-[11px] font-mono uppercase tracking-wide text-inverse-on-surface" style={gridStyle}>
            <div>Comparison item</div>
            {properties.map((property) => <div key={property.id} className="truncate px-2">{property.title}</div>)}
          </div>

          {rows.map((row, index) => (
            <div key={row.label} className={`grid items-center px-4 py-3 text-sm ${index % 2 === 0 ? 'bg-surface-container-low/50' : ''}`} style={gridStyle}>
              <div className="font-semibold text-on-surface-variant">{row.label}</div>
              {properties.map((property, propertyIndex) => (
                <div key={property.id} className={`px-2 font-mono text-on-surface ${row.bestIndex === propertyIndex ? 'font-bold text-tertiary' : ''}`}>
                  {row.render(property)}
                  {row.bestIndex === propertyIndex && (
                    <span className="ml-2 rounded-full bg-tertiary px-1.5 py-0.5 font-sans text-[10px] text-white">
                      {row.bestLabel || 'Best'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ComparePropertiesPage() {
  const { showError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  useEffect(() => {
    const urlIds = (searchParams.get('ids') || '').split(',').map((id) => id.trim()).filter(Boolean);
    const ids = saveComparePropertyIds([...getComparePropertyIds(), ...urlIds]);
    setSelectedIds(ids);
  }, [searchParams]);

  useEffect(() => {
    async function loadComparison() {
      if (selectedIds.length === 0) {
        setProperties([]);
        return;
      }
      setComparisonLoading(true);
      try {
        const response = await buyerApi.compareProperties(selectedIds);
        const results = response.success ? response.data || [] : [];
        const resultById = new Map(results.map((property) => [String(property.id), property]));
        setProperties(selectedIds.map((id) => resultById.get(String(id))).filter(Boolean));
      } catch {
        setProperties([]);
        showError('Failed to load the selected properties.');
      } finally {
        setComparisonLoading(false);
      }
    }
    loadComparison();
  }, [selectedIds, showError]);

  const removeProperty = (propertyId) => {
    const ids = removeComparePropertyId(propertyId);
    setSearchParams(ids.length ? { ids: ids.join(',') } : {});
  };

  const recommended = useMemo(() => {
    const scoredProperties = properties.filter((property) => Number.isFinite(Number(property.investment_score)));
    if (!scoredProperties.length) return null;
    return [...scoredProperties].sort((a, b) => Number(b.investment_score) - Number(a.investment_score))[0];
  }, [properties]);

  const priceRows = useMemo(() => {
    const aiPrices = properties.map(getAiPrice);
    const futureFiveYearPrices = properties.map((p) => p.future_price_5yr);
    const futureThreeYearPrices = properties.map((p) => p.future_price_3yr);

    const minPriceIndex = properties.length
      ? properties.reduce((best, p, i) => Number(p.price) < Number(properties[best].price) ? i : best, 0)
      : -1;
    const maxScoreIndex = properties.length
      ? properties.reduce((best, p, i) => Number(p.investment_score ?? 0) > Number(properties[best].investment_score ?? 0) ? i : best, 0)
      : -1;
    const maxAppr1Index = properties.length
      ? properties.reduce((best, p, i) => Number(p.appreciation_1yr ?? 0) > Number(properties[best].appreciation_1yr ?? 0) ? i : best, 0)
      : -1;
    const maxAppr3Index = properties.length
      ? properties.reduce((best, p, i) => Number(p.appreciation_3yr ?? 0) > Number(properties[best].appreciation_3yr ?? 0) ? i : best, 0)
      : -1;
    const maxAppr5Index = properties.length
      ? properties.reduce((best, p, i) => Number(p.appreciation_5yr ?? 0) > Number(properties[best].appreciation_5yr ?? 0) ? i : best, 0)
      : -1;
    const maxFuture3Index = futureThreeYearPrices.some((v) => v != null)
      ? futureThreeYearPrices.reduce((best, v, i) => Number(v ?? -Infinity) > Number(futureThreeYearPrices[best] ?? -Infinity) ? i : best, 0)
      : -1;
    const maxFuture5Index = futureFiveYearPrices.some((v) => v != null)
      ? futureFiveYearPrices.reduce((best, v, i) => Number(v ?? -Infinity) > Number(futureFiveYearPrices[best] ?? -Infinity) ? i : best, 0)
      : -1;

    return [
      {
        label: 'Asking Price',
        bestIndex: minPriceIndex,
        bestLabel: 'Lowest',
        render: (p) => formatCurrency(p.price),
      },
      {
        label: 'AI Estimated Value',
        render: (p) => formatCurrency(getAiPrice(p)),
      },
      {
        label: 'Price vs AI Value',
        render: (p) => {
          const ai = getAiPrice(p);
          if (!Number.isFinite(Number(p.price)) || !Number.isFinite(Number(ai)) || Number(ai) === 0) return 'N/A';
          const pct = ((Number(p.price) - Number(ai)) / Number(ai)) * 100;
          const color = pct <= 0 ? 'text-emerald-600' : 'text-red-500';
          return <span className={`font-bold ${color}`}>{pct > 0 ? '+' : ''}{pct.toFixed(1)}%</span>;
        },
      },
      {
        label: 'AI Investment Score',
        bestIndex: maxScoreIndex,
        bestLabel: 'Highest',
        render: (p) => p.investment_score != null
          ? <span className="font-extrabold">{p.investment_score}<span className="font-normal text-slate-400">/100</span></span>
          : 'N/A',
      },
      {
        label: 'Investment Rating',
        render: (p) => {
          const ratingColors = { Excellent: 'text-emerald-600', Good: 'text-blue-600', Moderate: 'text-amber-600', Cautious: 'text-red-500' };
          return <span className={`font-bold ${ratingColors[p.investment_rating] || ''}`}>{p.investment_rating || 'N/A'}</span>;
        },
      },
      {
        label: '1-Year Appreciation',
        bestIndex: maxAppr1Index,
        bestLabel: 'Highest',
        render: (p) => p.appreciation_1yr != null
          ? <span className="text-emerald-600 font-bold">+{Number(p.appreciation_1yr).toFixed(1)}%</span>
          : 'N/A',
      },
      {
        label: '3-Year Appreciation',
        bestIndex: maxAppr3Index,
        bestLabel: 'Highest',
        render: (p) => p.appreciation_3yr != null
          ? <span className="text-emerald-600 font-bold">+{Number(p.appreciation_3yr).toFixed(1)}%</span>
          : 'N/A',
      },
      {
        label: '5-Year Appreciation',
        bestIndex: maxAppr5Index,
        bestLabel: 'Highest',
        render: (p) => p.appreciation_5yr != null
          ? <span className="text-emerald-600 font-bold">+{Number(p.appreciation_5yr).toFixed(1)}%</span>
          : 'N/A',
      },
      {
        label: 'Estimated Price (3 Yrs)',
        bestIndex: maxFuture3Index,
        bestLabel: 'Highest',
        render: (p) => formatCurrency(p.future_price_3yr),
      },
      {
        label: 'Estimated Price (5 Yrs)',
        bestIndex: maxFuture5Index,
        bestLabel: 'Highest',
        render: (p) => formatCurrency(p.future_price_5yr),
      },
    ];
  }, [properties]);

  const detailRows = useMemo(() => [
    ['Project name', (property) => property.project_name || property.title],
    ['Property type', (property) => property.property_type],
    ['Configuration', (property) => property.bhk ? `${property.bhk} BHK` : null],
    ['Bedrooms', (property) => property.bedrooms],
    ['Bathrooms', (property) => property.bathrooms],
    ['Area', (property) => property.area_sqft ? `${Number(property.area_sqft).toLocaleString('en-IN')} sq ft` : null],
    ['Possession', (property) => property.possession_status],
    ['Builder', (property) => property.builder_name],
    ['Parking', (property) => property.parking],
  ].map(([label, getValue]) => ({
    label,
    values: properties.map(getValue),
    render: (property) => displayValue(getValue(property)),
  })), [properties]);

  const projectAmenities = useMemo(() => {
    const names = new Set();
    properties.forEach((property) => (property.amenities || []).forEach((amenity) => {
      const name = amenityName(amenity);
      if (name && nearbyCategory(name) === 'Other nearby places') names.add(name);
    }));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [properties]);

  const nearbyCategories = ['Nearby Bank / ATM', 'Nearby Hospital', 'Nearby School', 'Nearby Mall / Shopping', 'Nearby Metro / Transit'];

  const hasNearbyCategory = (property, category) => {
    const targetCategory = {
      'Nearby Bank / ATM': 'Nearby banks & ATMs',
      'Nearby Hospital': 'Nearby hospitals',
      'Nearby School': 'Nearby schools',
      'Nearby Mall / Shopping': 'Nearby malls & shopping',
      'Nearby Metro / Transit': 'Nearby metro & transit',
    }[category];
    return nearbyPlacesFor(property).some((place) => nearbyCategory(place) === targetCategory);
  };

  return (
    <div id="comparison-export" className="space-y-8 animate-fadeIn">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-headline-lg text-on-surface flex items-center gap-2"><SlidersHorizontal className="h-6 w-6 text-primary" />Compare Properties</h1>
          <p className="mt-1 text-body-md text-secondary">Compare the selected Bricklytics projects using their real listing and AI analysis data.</p>
        </div>
        <div className="print-hide flex gap-2">
          <button onClick={() => window.print()} className="hidden items-center gap-1.5 rounded-full bg-inverse-surface px-4 py-2 text-xs font-bold text-white hover:opacity-90 sm:flex"><Download className="h-3.5 w-3.5" />Export PDF</button>
        </div>
      </header>

      {comparisonLoading ? (
        <div className="h-80 rounded-xl border border-outline-variant/50 bg-surface-container-low animate-pulse" />
      ) : properties.length === 0 ? (
        <section className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-14 text-center">
          <SlidersHorizontal className="mx-auto h-11 w-11 text-outline" />
          <h2 className="mt-4 font-headline-md text-on-surface">Choose properties to compare</h2>
          <p className="mx-auto mt-2 max-w-md text-body-md text-secondary">Select properties using Compare on a property details page or from your wishlist.</p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {properties.map((property) => {
              const image = property.images?.find((item) => item.is_cover)?.url || property.images?.[0]?.url;
              const isRecommended = recommended?.id === property.id;
              return (
                <article key={property.id} className={`overflow-hidden rounded-xl border bg-surface-container-lowest shadow-ambient ${isRecommended ? 'border-tertiary ring-1 ring-tertiary/30' : 'border-outline-variant/50'}`}>
                  <div className="relative h-28 bg-surface-container-high">
                    {image && <img src={getPropertyMediaUrl(image)} alt={property.title} className="h-full w-full object-cover" />}
                    <button onClick={() => removeProperty(property.id)} className="print-hide absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-secondary hover:text-error" aria-label={`Remove ${property.title}`}><X className="h-4 w-4" /></button>
                    {isRecommended && <span className="absolute left-2 top-2 rounded-full bg-tertiary px-2 py-1 text-[10px] font-bold text-white">AI PICK</span>}
                  </div>
                  <div className="space-y-2 p-3">
                    <h2 className="truncate text-sm font-bold text-on-surface">{property.title}</h2>
                    <p className="flex items-center gap-1 truncate text-xs text-secondary"><MapPin className="h-3.5 w-3.5" />{property.locality || 'Location not specified'}, {property.city || ''}</p>
                    <div className="grid grid-cols-2 gap-2 border-t border-outline-variant/40 pt-2 font-mono text-xs"><div><p className="text-outline">Listed</p><p className="font-semibold text-on-surface">{formatCurrency(property.price)}</p></div><div><p className="text-outline">AI price</p><p className="font-semibold text-primary">{formatCurrency(getAiPrice(property))}</p></div></div>
                  </div>
                </article>
              );
            })}
          </section>

          <ComparisonTable title="Price Comparison" properties={properties} rows={priceRows} />
          <ComparisonTable title="Project Details" properties={properties} rows={detailRows} />

          <section>
            <h2 className="font-headline-md text-on-surface mb-4">Project Amenities & Nearby Places</h2>
            <div className="comparison-print-table overflow-x-auto rounded-xl border border-outline-variant/50 bg-surface-container-lowest shadow-ambient">
              <div className="comparison-table-content min-w-[760px]">
                <div className="grid bg-inverse-surface px-4 py-3 text-[11px] font-mono uppercase tracking-wide text-inverse-on-surface" style={{ gridTemplateColumns: `180px repeat(${properties.length}, minmax(0, 1fr))` }}><div>Feature / nearby place</div>{properties.map((property) => <div key={property.id} className="truncate px-2">{property.title}</div>)}</div>
                {projectAmenities.map((name, index) => (
                  <div key={`amenity-${name}`} className={`grid items-center px-4 py-3 text-sm ${index % 2 === 0 ? 'bg-surface-container-low/50' : ''}`} style={{ gridTemplateColumns: `180px repeat(${properties.length}, minmax(0, 1fr))` }}><div className="font-semibold text-on-surface-variant">{name}</div>{properties.map((property) => { const hasAmenity = (property.amenities || []).some((amenity) => amenityName(amenity) === name); return <div key={property.id} className="px-2">{hasAmenity ? <Check className="h-5 w-5 text-tertiary" /> : <X className="h-5 w-5 text-error" />}</div>; })}</div>
                ))}
                {/* <div className="border-y border-outline-variant/40 bg-primary/5 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-primary">Nearby places</div> */}
                {nearbyCategories.map((category, index) => (
                  <div key={category} className={`grid items-center px-4 py-3 text-sm ${(projectAmenities.length + index) % 2 === 0 ? 'bg-surface-container-low/50' : ''}`} style={{ gridTemplateColumns: `180px repeat(${properties.length}, minmax(0, 1fr))` }}><div className="font-semibold text-on-surface-variant">{category}</div>{properties.map((property) => <div key={property.id} className="px-2">{hasNearbyCategory(property, category) ? <Check className="h-5 w-5 text-tertiary" /> : <X className="h-5 w-5 text-error" />}</div>)}</div>
                ))}
              </div>
            </div>
          </section>

          {recommended && <section className="relative overflow-hidden rounded-2xl bg-inverse-surface p-6 text-white shadow-soft-lg md:p-8"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-center"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-inverse-primary"><Sparkles className="h-4 w-4" />Final AI decision</p><h2 className="mt-3 text-2xl font-bold">Highest available AI score: {recommended.title}</h2><p className="mt-2 max-w-2xl text-sm text-slate-300">This recommendation is based on the investment score returned for the properties currently selected. It does not add any unavailable project information.</p><Link to={getPropertyDetailsPath(recommended.id)} className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-hover">View full details <ArrowRight className="h-4 w-4" /></Link></div><div className="flex shrink-0 flex-col items-center rounded-xl border border-white/15 bg-white/5 px-7 py-5"><Trophy className="mb-2 h-5 w-5 text-yellow-300" /><span className="text-xs uppercase tracking-wide text-slate-400">AI score</span><span className="mt-1 text-3xl font-bold">{recommended.investment_score}<span className="text-lg text-slate-400">/100</span></span></div></div></section>}
        </>
      )}
    </div>
  );
}
