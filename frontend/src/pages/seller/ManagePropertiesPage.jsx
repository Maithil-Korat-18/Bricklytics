import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProperties } from '../../hooks/useProperties';
import { propertyApi } from '../../services/propertyApi';
import { useToast } from '../../components/common/ToastContext';

import PageHeader from '../../components/common/PageHeader';
import ContentContainer from '../../components/common/ContentContainer';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { getPropertyMediaUrl, getPropertyCoverImage } from '../../utils/propertyMedia';

import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit,
  Eye,
  Building,
  MapPin,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function ManagePropertiesPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedListing, setSelectedListing] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [sortBy, setSortBy] = useState('-created_at');

  const {
    properties,
    pagination,
    loading,
    error,
    updateFilters,
    changePage,
    refetch,
    setProperties,
  } = useProperties();

  // Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [soldModalOpen, setSoldModalOpen] = useState(false);
  const [targetProperty, setTargetProperty] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleSoldToggleClick = (prop) => {
    setTargetProperty(prop);
    setSoldModalOpen(true);
  };

  const confirmSoldToggle = async () => {
    if (!targetProperty) return;
    setUpdatingStatus(true);
    const nextStatus = targetProperty.status === 'sold' ? 'active' : 'sold';
    try {
      const res = await propertyApi.updatePropertyStatus(targetProperty.id, nextStatus);
      if (res.success || res.data) {
        showSuccess(
          nextStatus === 'sold'
            ? `Property "${targetProperty.title}" marked as SOLD. It will no longer be visible to buyers.`
            : `Property "${targetProperty.title}" reactivated as UNSOLD/ACTIVE.`
        );
        setProperties((prev) =>
          prev.map((p) => (p.id === targetProperty.id ? { ...p, status: nextStatus } : p))
        );
      } else {
        throw new Error(res.message || 'Failed to update property status.');
      }
    } catch (err) {
      showError(err.message || 'Error updating status.');
    } finally {
      setUpdatingStatus(false);
      setSoldModalOpen(false);
      setTargetProperty(null);
    }
  };


  // Trigger search on filter change
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({
      search: searchTerm,
      property_type: selectedType,
      listing_type: selectedListing,
      city: selectedCity,
      sort_by: sortBy,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedListing('');
    setSelectedCity('');
    setSortBy('-created_at');
    updateFilters({
      search: '',
      property_type: '',
      listing_type: '',
      city: '',
      sort_by: '-created_at',
    });
  };

  // Optimistic Delete
  const handleDeleteClick = (prop) => {
    setTargetProperty(prop);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!targetProperty) return;
    setDeleting(true);

    const previousProperties = [...properties];
    setProperties((prev) => prev.filter((p) => p.id !== targetProperty.id));

    try {
      const response = await propertyApi.deleteProperty(targetProperty.id);
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to delete property.');
      }

      showSuccess(`Property "${targetProperty.title}" deleted successfully.`);
      setDeleteModalOpen(false);
      setTargetProperty(null);
      refetch();
    } catch (err) {
      setProperties(previousProperties);
      showError(err.response?.data?.message || err.message || 'Failed to delete property.');
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteModalOpen(false);
    setTargetProperty(null);
  };

  return (
    <ContentContainer>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader
          title="Manage Properties"
          description="View, search, filter, and manage your complete property portfolio in real-time."
        />
        <Link
          to="/seller/add-property"
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          <span>Add Property</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Field */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Property Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option value="">All Property Types</option>
            <option value="apartment">Flat / Apartment</option>
            <option value="villa">Villa / House</option>
          </select>

          {/* Listing Type Filter */}
          <select
            value={selectedListing}
            onChange={(e) => setSelectedListing(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option value="">All Listing Types</option>
            <option value="sell">For Sale</option>
            <option value="rent">For Rent</option>
            <option value="lease">For Lease</option>
          </select>

          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option value="-created_at">Newest First</option>
            <option value="created_at">Oldest First</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            Clear All Filters
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs flex items-center space-x-2 transition-colors"
          >
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span>Apply Filters</span>
          </button>
        </div>
      </form>

      {/* Property List / Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 animate-pulse shadow-sm">
              <div className="w-full h-48 bg-slate-100 rounded-xl" />
              <div className="h-5 bg-slate-100 rounded-md w-3/4" />
              <div className="h-4 bg-slate-100 rounded-md w-1/2" />
              <div className="h-8 bg-slate-100 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
            <Building className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No Properties Found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Try adjusting your search terms or filters to find what you are looking for.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => {
            const coverImage = getPropertyCoverImage(prop);
            return (
              <div key={prop.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 space-y-1">
                        <Building className="w-10 h-10 stroke-[1.5]" />
                        <span className="text-xs font-semibold">No Image Uploaded</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex items-center space-x-2">
                      <span className="px-3 py-1 rounded-full bg-white/90 border border-gray-200 text-blue-600 text-xs font-bold backdrop-blur-md uppercase tracking-wider shadow-sm">
                        {prop.listing_type}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-white/90 border border-gray-200 text-gray-700 text-xs font-semibold backdrop-blur-md capitalize shadow-sm">
                        {prop.property_type}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h4 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {prop.title}
                    </h4>
                    

                    <div className="flex items-center text-xs text-gray-500 space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{prop.locality || prop.city}, {prop.state}</span>
                      
                    </div>

                    <div className="flex items-baseline justify-between pt-2 border-t border-gray-100">
                      <div>
                        <span className="text-xs text-gray-500">Price</span>
                        <p className="text-lg font-black text-blue-600">
                          {prop.price >= 10000000 
                            ? `₹${(prop.price / 10000000).toFixed(2)} Cr` 
                            : prop.price >= 100000 
                            ? `₹${(prop.price / 100000).toFixed(2)} Lakhs` 
                            : `₹${prop.price?.toLocaleString('en-IN')}`}
                        </p>
                      </div>
                    
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-5 pt-0 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/seller/property/${prop.id}`}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </Link>
                    <Link
                      to={`/seller/edit-property/${prop.id}`}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(prop)}
                      className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mark as Sold / Unsold Toggle */}
                  <button
                    onClick={() => handleSoldToggleClick(prop)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                      prop.status === 'sold'
                        ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{prop.status === 'sold' ? 'Mark as Unsold (Reactivate)' : 'Mark as Sold'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* Pagination Footer */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
          <p className="text-xs text-gray-500">
            Page <span className="font-semibold text-gray-900">{pagination.page}</span> of{' '}
            <span className="font-semibold text-gray-900">{pagination.totalPages}</span> ({pagination.count} total items)
          </p>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => changePage(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => changePage(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Property"
        message={`Are you sure you want to delete "${targetProperty?.title}"? This will soft-delete the listing.`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteModalOpen(false)}
      />

      {/* Sold/Unsold Status Confirmation Modal */}
      <ConfirmationModal
        isOpen={soldModalOpen}
        title={targetProperty?.status === 'sold' ? 'Reactivate Property (Mark Unsold)' : 'Mark Property as Sold'}
        message={
          targetProperty?.status === 'sold'
            ? `Are you sure you want to reactivate "${targetProperty?.title}"? It will become visible to buyers again on the explore page.`
            : `Are you sure you want to mark "${targetProperty?.title}" as SOLD? It will be immediately hidden from the buyer portal and search results.`
        }
        confirmText={targetProperty?.status === 'sold' ? 'Reactivate' : 'Confirm Sold'}
        confirmVariant={targetProperty?.status === 'sold' ? 'primary' : 'warning'}
        loading={updatingStatus}
        onConfirm={confirmSoldToggle}
        onClose={() => setSoldModalOpen(false)}
      />
    </ContentContainer>
  );
}

