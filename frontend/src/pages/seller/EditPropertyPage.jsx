import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { propertySchema } from '../../validation/propertySchema';
import { propertyApi } from '../../services/propertyApi';
import { useToast } from '../../components/common/ToastContext';

import PageHeader from '../../components/common/PageHeader';
import ContentContainer from '../../components/common/ContentContainer';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import LiveListingPreviewCard from '../../components/seller/wizard/LiveListingPreviewCard';

import Step1BasicInfo from '../../components/seller/wizard/Step1BasicInfo';
import Step2PropertyDetails from '../../components/seller/wizard/Step2PropertyDetails';
import Step3PricingImages from '../../components/seller/wizard/Step3PricingImages';

import { CheckCircle, AlertTriangle, RefreshCw, Trash2, Star } from 'lucide-react';
import { getPropertyMediaUrl } from '../../utils/propertyMedia';


const AHMEDABAD_LOCALITIES = [
  'South Bopal', 'Satellite', 'Bodakdev', 'Prahlad Nagar', 'Science City',
  'Vastrapur', 'Thaltej', 'SG Highway', 'Sindhu Bhavan Road', 'Ambli',
  'Shela', 'Gota', 'Chandkheda', 'Naranpura', 'Paldi', 'CG Road',
  'Maninagar', 'Motera', 'Navrangpura', 'Ellisbridge', 'Memnagar',
  'Sola', 'Vatva', 'Naroda', 'Nikol', 'Shahibaug',
];

const propertyTypeToFormValue = (propertyType) => {
  switch (propertyType) {
    case 'villa':
    case 'house':
      return 'Villa / House';
    default:
      return 'Flat / Apartment';
  }
};

const propertyTypeToApiValue = (propertyType) => {
  switch (propertyType) {
    case 'Villa / House':
      return 'villa';
    default:
      return 'apartment';
  }
};

export default function EditPropertyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useToast();

  const searchParams = new URLSearchParams(location.search);
  const returnTo =
    location.state?.from ||
    searchParams.get('from') ||
    '/seller/dashboard';

  const returnLabel =
    location.state?.fromLabel ||
    (returnTo.includes('manage') ? 'Manage Properties' : 'Seller Dashboard');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [propertyData, setPropertyData] = useState(null);
  const [soldModalOpen, setSoldModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const confirmSoldToggle = async () => {
    if (!propertyData) return;
    setUpdatingStatus(true);
    const nextStatus = propertyData.status === 'sold' ? 'active' : 'sold';
    try {
      const res = await propertyApi.updatePropertyStatus(id, nextStatus);
      if (res.success || res.data) {
        showSuccess(
          nextStatus === 'sold'
            ? `Property "${propertyData.title}" marked as SOLD.`
            : `Property "${propertyData.title}" reactivated as UNSOLD/ACTIVE.`
        );
        setPropertyData((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      } else {
        throw new Error(res.message || 'Failed to update property status.');
      }
    } catch (err) {
      showError(err.message || 'Error updating status.');
    } finally {
      setUpdatingStatus(false);
      setSoldModalOpen(false);
    }
  };

  // Pre-loaded localities so the select has options BEFORE reset() fires
  const [loadedLocalities, setLoadedLocalities] = useState(AHMEDABAD_LOCALITIES);
  const localitiesReady = useRef(false);


  const methods = useForm({
    resolver: zodResolver(propertySchema),
    mode: 'onTouched',
  });

  // Step 1: Fetch localities from API (before property data if possible)
  useEffect(() => {
    async function fetchLocalities() {
      try {
        const res = await propertyApi.getAhmedabadLocations();
        if (res.success && res.data?.locations?.length > 0) {
          const names = res.data.locations.map((loc) => loc.name);
          const merged = Array.from(new Set([...names, ...AHMEDABAD_LOCALITIES]));
          setLoadedLocalities(merged);
        }
      } catch {
        // Fall back to static list – already set as default
      } finally {
        localitiesReady.current = true;
      }
    }
    fetchLocalities();
  }, []);

  // Step 2: Fetch property then reset form — wait for localities to be ready
  useEffect(() => {
    if (!id) return;

    async function fetchProperty() {
      setLoading(true);
      try {
        const res = await propertyApi.getPropertyById(id);
        if (res.success && res.data) {
          const p = res.data;
          setPropertyData(p);

          const isResale = p.sale_type === 'resale';

          // Ensure localities are loaded first so the <select> has matching options
          const waitForLocalities = () =>
            new Promise((resolve) => {
              const check = () => {
                if (localitiesReady.current) {
                  resolve();
                } else {
                  setTimeout(check, 50);
                }
              };
              check();
            });

          await waitForLocalities();

          methods.reset({
            title: p.title || '',
            propertyType: propertyTypeToFormValue(p.property_type),
            listingType: isResale ? 'Resale Property' : 'New Property',
            saleType: p.sale_type || 'new',
            reconstructionNeeded: p.reconstruction_needed || '',
            description: p.description || '',

            state: p.state || 'Gujarat',
            city: p.city || 'Ahmedabad',
            locality: p.locality || '',
            fullAddress: p.address || '',
            latitude: p.latitude !== undefined && p.latitude !== null ? Number(p.latitude) : 23.0225,
            longitude: p.longitude !== undefined && p.longitude !== null ? Number(p.longitude) : 72.5714,

            bhk: p.bhk ? String(p.bhk) : '',
            bedrooms: p.bedrooms || '',
            bathrooms: p.bathrooms || '',
            balconies: p.balconies || '',
            carpetArea: p.area_sqft || '',
            builtUpArea: p.built_up_area || '',
            superBuiltUpArea: p.super_built_up_area || '',
            floorNumber: p.floor_number || '',
            totalFloors: p.total_floors || '',
            unitsPerFloor: p.units_per_floor || '',
            totalUnits: p.total_units || '',
            unitsSold: p.units_sold || '',
            propertyAge: p.property_age || '',
            facing: p.facing || '',
            furnishing: p.furnishing || '',

            houseType: p.house_type || '',
            landArea: p.land_area || '',
            sampleHouseReady: p.sample_house_ready === true,
            layoutType: p.layout_type || '',

            expectedPrice: p.price || '',
            maintenanceCharges: p.maintenance_charges || '',
            bookingAmount: p.booking_amount || '',

            builderName: p.builder_name || '',
            projectName: p.project_name || '',
            reraNumber: p.rera_number || '',
            possessionStatus: p.possession_status || 'Ready',
            possessionDate: p.possession_date || '',

            amenities: (p.amenities || []).map((a) => (typeof a === 'string' ? a : a.name)),
            nearbyPlaces: p.nearby_places || [],
            images: (p.images || []).map((img) => img.url),
            coverIndex:
              (p.images || []).findIndex((img) => img.is_cover) >= 0
                ? (p.images || []).findIndex((img) => img.is_cover)
                : 0,
          });
        }
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to fetch property details.');
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, [id, methods, showError]);

  const onSubmit = async (data) => {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const isResale = data.listingType === 'Resale Property' || data.saleType === 'resale';
      const newPrice = Number(data.expectedPrice);
      const newArea = Number(data.carpetArea);

      // Task 2 – AI Determinism:
      // Only recalculate rate_per_sqft if the user changed price OR area.
      // Otherwise keep the stored value so the prediction fingerprint stays stable.
      const storedPrice = propertyData?.price;
      const storedArea = propertyData?.area_sqft;
      const priceChanged = newPrice !== storedPrice;
      const areaChanged = newArea !== storedArea;

      let ratePerSqft;
      if ((priceChanged || areaChanged) && newPrice && newArea) {
        ratePerSqft = Math.round(newPrice / newArea);
      } else {
        ratePerSqft = propertyData?.rate_per_sqft || (newPrice && newArea ? Math.round(newPrice / newArea) : 0);
      }

      const payload = {
        title: data.title,
        description: data.description,
        property_type: propertyTypeToApiValue(data.propertyType),
        listing_type: 'sell',
        sale_type: isResale ? 'resale' : 'new',
        reconstruction_needed: isResale ? data.reconstructionNeeded : '',
        price: newPrice,
        rate_per_sqft: ratePerSqft,
        bhk: data.bhk ? Number(data.bhk) : 1,
        bedrooms: data.bedrooms ? Number(data.bedrooms) : 0,
        bathrooms: data.bathrooms ? Number(data.bathrooms) : 0,
        balconies: data.balconies ? Number(data.balconies) : 0,
        area_sqft: newArea,
        built_up_area: data.builtUpArea ? Number(data.builtUpArea) : null,
        super_built_up_area: data.superBuiltUpArea ? Number(data.superBuiltUpArea) : null,
        floor_number: data.floorNumber ? Number(data.floorNumber) : 1,
        total_floors: data.totalFloors ? Number(data.totalFloors) : 1,
        units_per_floor: data.unitsPerFloor ? Number(data.unitsPerFloor) : 0,
        total_units:
          data.totalFloors && data.unitsPerFloor
            ? Number(data.totalFloors) * Number(data.unitsPerFloor)
            : data.totalUnits
            ? Number(data.totalUnits)
            : 0,
        units_sold: data.unitsSold ? Number(data.unitsSold) : 0,
        sample_house_ready: data.sampleHouseReady === true,
        layout_type: data.layoutType || '',
        nearby_places: data.nearbyPlaces || [],
        property_age: isResale && data.propertyAge ? Number(data.propertyAge) : 0,
        facing: isResale && data.facing ? data.facing : 'East',
        furnishing: data.furnishing || 'Unfurnished',

        address: data.fullAddress,
        locality: data.locality,
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: propertyData?.pincode || '380001',
        latitude: data.latitude !== undefined && data.latitude !== null ? Number(data.latitude) : (propertyData?.latitude || 23.0225),
        longitude: data.longitude !== undefined && data.longitude !== null ? Number(data.longitude) : (propertyData?.longitude || 72.5714),

        maintenance_charges: data.maintenanceCharges ? Number(data.maintenanceCharges) : 0,
        booking_amount: data.bookingAmount ? Number(data.bookingAmount) : 0,

        builder_name: data.builderName || '',
        project_name: data.projectName || '',
        rera_number: data.reraNumber || '',
        possession_status: data.possessionStatus || 'Ready',
        possession_date: data.possessionDate || '',

        amenities: (data.amenities || []).map((name) => ({ name, category: 'General' })),
      };

      const res = await propertyApi.updateProperty(id, payload);

      if (res.success) {
        const newFiles = data.rawImageFiles || [];
        if (newFiles.length) await propertyApi.uploadImages(id, newFiles);

        setSuccessMessage(`Property updated successfully! Redirecting to ${returnLabel}...`);
        showSuccess('Property updated successfully!');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        setTimeout(() => {
          navigate(returnTo);
        }, 1200);
      }
    } catch (err) {
      let msg = err.response?.data?.message || 'Failed to update property.';
      if (err.response?.data?.errors && typeof err.response.data.errors === 'object') {
        const fieldErrors = Object.entries(err.response.data.errors)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join(' | ');
        if (fieldErrors) msg += ` Details: ${fieldErrors}`;
      }
      setErrorMessage(msg);
      showError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      const res = await propertyApi.deleteImage(id, imageId);
      if (res.success) {
        setPropertyData(res.data);
        showSuccess('Image deleted successfully.');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete image.');
    }
  };

  const handleSetCover = async (imageId) => {
    try {
      const res = await propertyApi.setCoverImage(id, imageId);
      if (res.success) {
        setPropertyData(res.data);
        showSuccess('Cover image set successfully.');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to set cover image.');
    }
  };

  if (loading) {
    return (
      <ContentContainer>
        <div className="py-20 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-[#0058be] animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#727785]">Loading property details...</p>
        </div>
      </ContentContainer>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
        <ContentContainer>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <PageHeader
              title={`Edit Property: ${propertyData?.title || `#${id}`}`}
              description="Update listing information, unit availability, and pricing."
            />
            {propertyData && (
              <button
                type="button"
                onClick={() => setSoldModalOpen(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                  propertyData.status === 'sold'
                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>{propertyData.status === 'sold' ? 'Mark as Unsold (Reactivate)' : 'Mark as Sold'}</span>
              </button>
            )}
          </div>


          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-[#f5fff6] border border-[#00855b]/30 text-[#006947] text-sm font-semibold flex items-center space-x-3 shadow-ambient animate-fadeIn">
              <CheckCircle className="w-5 h-5 text-[#006947] flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] text-sm font-semibold flex items-center space-x-3 shadow-ambient animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-[#ba1a1a] flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Existing Backend Uploaded Images Gallery */}
          {propertyData?.images && propertyData.images.length > 0 && (
            <div className="bg-white border border-[#e2e7ff] rounded-2xl p-6 space-y-4 shadow-ambient">
              <h3 className="text-md font-bold text-[#131b2e]">Saved Images Gallery</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {propertyData.images.map((img) => (
                  <div key={img.id} className="relative group rounded-xl overflow-hidden border border-[#e2e7ff] aspect-video bg-[#f2f3ff]">
                    <img src={getPropertyMediaUrl(img.url)} alt="Property" className="w-full h-full object-cover" />
                    {img.is_cover ? (
                      <span className="absolute top-2 left-2 bg-[#0058be] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 fill-current" /> Cover
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetCover(img.id)}
                        className="absolute top-2 left-2 bg-black/60 hover:bg-[#0058be] text-white text-[10px] font-medium px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Set Cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-[#ba1a1a] text-white transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main 2-Column Form Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Pass pre-loaded localities so select is populated before reset fires */}
              <Step1BasicInfo mode="basic" />
              <Step1BasicInfo mode="location" preloadedLocalities={loadedLocalities} />
              <Step2PropertyDetails />
              <Step3PricingImages />
            </div>

            <div className="lg:col-span-1 space-y-6">
              <LiveListingPreviewCard />
            </div>
          </div>
        </ContentContainer>

        <div className="sticky bottom-0 z-40 border-t border-[#e2e7ff] bg-white/90 p-4 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(returnTo)}
              className="rounded-xl border border-[#c2c6d6] px-5 py-2.5 text-xs font-semibold text-[#424754] hover:bg-[#f2f3ff]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#0058be] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#004395] disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Update Property'}
            </button>
          </div>
        </div>
      </form>

      {/* Sold/Unsold Status Confirmation Modal */}
      <ConfirmationModal
        isOpen={soldModalOpen}
        title={propertyData?.status === 'sold' ? 'Reactivate Property (Mark Unsold)' : 'Mark Property as Sold'}
        message={
          propertyData?.status === 'sold'
            ? `Are you sure you want to reactivate "${propertyData?.title}"? It will become visible to buyers again.`
            : `Are you sure you want to mark "${propertyData?.title}" as SOLD? It will be immediately hidden from buyers on the platform.`
        }
        confirmText={propertyData?.status === 'sold' ? 'Reactivate' : 'Confirm Sold'}
        confirmVariant={propertyData?.status === 'sold' ? 'primary' : 'warning'}
        loading={updatingStatus}
        onConfirm={confirmSoldToggle}
        onClose={() => setSoldModalOpen(false)}
      />
    </FormProvider>
  );
}