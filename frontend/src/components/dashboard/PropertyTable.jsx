import React from 'react';
import { Building2, Edit, Eye, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../common/Badge';
import { ROUTES, getEditPropertyPath, getSellerPropertyDetailsPath } from '../../constants/routes';

const formatDate = (value) => value ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : '—';
const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export default function PropertyTable({ properties = [], onDelete }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card-soft">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">Recent Properties</h2>
          <p className="mt-0.5 text-xs text-slate-400">Your added property listings</p>
        </div>
        <Link to={ROUTES.MANAGE_PROPERTIES} className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">View All Properties →</Link>
      </div>

      {properties.length === 0 ? (
        <div className="space-y-3 px-6 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Building2 className="h-6 w-6" /></div>
          <p className="text-sm font-semibold text-slate-800">No Properties Found</p>
          <p className="mx-auto max-w-sm text-xs text-slate-400">Start building your portfolio by adding your first property.</p>
          <Link to={ROUTES.ADD_PROPERTY} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700"><Plus className="h-4 w-4" />Add Property</Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left">
            <thead><tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3">Property</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Price</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Created</th><th className="px-5 py-3 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {properties.map((property) => {
                const propertyId = property.id;
                const coverImage = property.images?.find((image) => image.is_cover)?.url || property.images?.[0]?.url;
                return <tr key={propertyId} className="group transition-colors hover:bg-slate-50/50">
                  <td className="px-5 py-4"><div className="flex items-center gap-3">{coverImage ? <img src={coverImage} alt={property.title} className="h-12 w-12 rounded-xl object-cover ring-1 ring-slate-200" /> : <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><Building2 className="h-5 w-5" /></div>}<div><p className="font-semibold text-slate-900 transition-colors group-hover:text-blue-600">{property.title || 'Untitled Property'}</p><p className="text-xs text-slate-400">{property.locality || property.city || '—'}</p></div></div></td>
                  <td className="px-5 py-4 font-medium capitalize text-slate-600">{property.property_type || 'Property'}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{formatPrice(property.price)}</td>
                  <td className="px-5 py-4"><Badge status={property.status || 'draft'} /></td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(property.created_at)}</td>
                  <td className="px-5 py-4"><div className="flex items-center justify-end gap-1"><Link aria-label={`View ${property.title}`} to={getSellerPropertyDetailsPath(propertyId)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"><Eye className="h-4 w-4" /></Link><Link aria-label={`Edit ${property.title}`} to={getEditPropertyPath(propertyId)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"><Edit className="h-4 w-4" /></Link><button type="button" aria-label={`Delete ${property.title}`} onClick={() => onDelete?.(property)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
