import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { propertySchema } from '../../validation/propertySchema';
import { propertyApi } from '../../services/propertyApi';
import { useToast } from '../../components/common/ToastContext';

import PageHeader from '../../components/common/PageHeader';
import ContentContainer from '../../components/common/ContentContainer';

import PropertyInformationSection from '../../components/forms/PropertyInformationSection';
import LocationSection from '../../components/forms/LocationSection';
import PropertyDetailsSection from '../../components/forms/PropertyDetailsSection';
import PricingSection from '../../components/forms/PricingSection';
import BuilderSection from '../../components/forms/BuilderSection';
import AmenitiesSelector from '../../components/forms/AmenitiesSelector';
import ImageUploader from '../../components/forms/ImageUploader';
import PreviewCard from '../../components/forms/PreviewCard';
import { CheckCircle, AlertTriangle, RefreshCw, Trash2, Star } from 'lucide-react';
import { getPropertyMediaUrl } from '../../utils/propertyMedia';

const propertyTypeToFormValue = (propertyType) => {
  switch (propertyType) {
    case 'villa':
    case 'house':
      return 'Villa / House';
    case 'plot':
      return 'Plot / Land';
    default:
      return 'Flat / Apartment';
  }
};

const propertyTypeToApiValue = (propertyType) => {
  switch (propertyType) {
    case 'Villa / House':
      return 'villa';
    case 'Plot / Land':
      return 'plot';
    default:
      return 'apartment';
  }
};

export default function EditPropertyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [propertyData, setPropertyData] = useState(null);

  const methods = useForm({
    resolver: zodResolver(propertySchema),
    mode: 'onTouched',
  });

  useEffect(() => {
    async function fetchProperty() {
      setLoading(true);
      try {
        const res = await propertyApi.getPropertyById(id);
        if (res.success && res.data) {
          const p = res.data;
          setPropertyData(p);

          methods.reset({
            title: p.title || '',
            propertyType: propertyTypeToFormValue(p.property_type),
            listingType: p.sale_type === 'resale' ? 'Resale Property' : 'New Property',
            saleType: p.sale_type || 'new',
            reconstructionNeeded: p.reconstruction_needed || '',
            description: p.description || '',

            country: 'India',
            state: p.state || 'Gujarat',
            city: p.city || 'Ahmedabad',
            locality: p.locality || '',
            fullAddress: p.address || '',

            bhk: p.bhk ? String(p.bhk) : '',
            bedrooms: p.bedrooms || '',
            bathrooms: p.bathrooms || '',
            balconies: p.balconies || '',
            carpetArea: p.area_sqft || '',
            builtUpArea: p.built_up_area || '',
            superBuiltUpArea: p.super_built_up_area || '',
            floorNumber: p.floor_number || '',
            totalFloors: p.total_floors || '',
            propertyAge: p.property_age || '',
            facing: p.facing || '',
            furnishing: p.furnishing || '',
            parking: p.parking || '',
            waterSupply: '24 Hours',
            powerBackup: 'Yes',

            expectedPrice: p.price || '',
            maintenanceCharges: p.maintenance_charges || '',
            bookingAmount: p.booking_amount || '',
            negotiable: p.negotiable ?? true,

            builderName: p.builder_name || '',
            projectName: p.project_name || '',
            reraNumber: p.rera_number || '',
            possessionStatus: p.possession_status || 'Ready',
            possessionDate: p.possession_date || '',

            amenities: (p.amenities || []).map((a) => a.name),
            images: (p.images || []).map((img) => img.url),
            coverIndex: (p.images || []).findIndex((img) => img.is_cover) >= 0 ? (p.images || []).findIndex((img) => img.is_cover) : 0,

            sellerName: p.seller_name || '',
            phoneNumber: p.phone_number || '',
            email: p.email || '',
            preferredContactTime: 'Anytime',
          });
        }
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to fetch property details.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchProperty();
    }
  }, [id, methods, showError]);

  const onSubmit = async (data) => {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const payload = {
        title: data.title,
        description: data.description,
        property_type: propertyTypeToApiValue(data.propertyType),
        listing_type: 'sell',
        sale_type: data.saleType,
        reconstruction_needed: data.saleType === 'resale' ? data.reconstructionNeeded : '',
        price: Number(data.expectedPrice),
        rate_per_sqft: Number(data.expectedPrice) && Number(data.carpetArea) ? Math.round(Number(data.expectedPrice) / Number(data.carpetArea)) : 0,
        bhk: data.bedrooms ? Number(data.bedrooms) : 1,
        bedrooms: data.bedrooms ? Number(data.bedrooms) : 0,
        bathrooms: data.bathrooms ? Number(data.bathrooms) : 0,
        balconies: data.balconies ? Number(data.balconies) : 0,
        area_sqft: Number(data.carpetArea),
        built_up_area: data.builtUpArea ? Number(data.builtUpArea) : null,
        super_built_up_area: data.superBuiltUpArea ? Number(data.superBuiltUpArea) : null,
        floor_number: data.floorNumber ? Number(data.floorNumber) : 1,
        total_floors: data.totalFloors ? Number(data.totalFloors) : 1,
        property_age: data.propertyAge ? Number(data.propertyAge) : 0,
        year_built: data.propertyAge ? (new Date().getFullYear() - Number(data.propertyAge)) : new Date().getFullYear(),
        facing: data.facing || 'East',
        furnishing: data.furnishing || 'Unfurnished',
        parking: data.parking || 'Yes',

        address: data.fullAddress,
        locality: data.locality,
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: propertyData?.pincode || '',

        maintenance_charges: data.maintenanceCharges ? Number(data.maintenanceCharges) : 0,
        booking_amount: data.bookingAmount ? Number(data.bookingAmount) : 0,
        negotiable: data.negotiable ?? true,

        builder_name: data.builderName || '',
        project_name: data.projectName || '',
        rera_number: data.reraNumber || '',
        possession_status: data.possessionStatus || 'Ready',
        possession_date: data.possessionDate || '',

        seller_name: data.sellerName || '',
        phone_number: data.phoneNumber || '',
        email: data.email || '',

        amenities: (data.amenities || []).map((name) => ({ name, category: 'General' })),
      };

      const res = await propertyApi.updateProperty(id, payload);

      if (res.success) {
        const newFiles = data.rawImageFiles || [];
        if (newFiles.length) await propertyApi.uploadImages(id, newFiles);
        setSuccessMessage('Property updated successfully!');
        showSuccess('Property updated successfully!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm font-medium text-gray-500">Loading property details...</p>
        </div>
      </ContentContainer>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
        <ContentContainer>
          <PageHeader
            title={`Edit Property: ${propertyData?.title || `#${id}`}`}
            description="Update listing information, manage images, and update price expectations."
          />

          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center space-x-3 shadow-sm animate-fadeIn">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold flex items-center space-x-3 shadow-sm animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Existing Backend Uploaded Images Gallery */}
          {propertyData?.images && propertyData.images.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-md font-bold text-gray-900">Saved Images Gallery</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {propertyData.images.map((img) => (
                  <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-slate-100">
                    <img src={getPropertyMediaUrl(img.url)} alt="Property" className="w-full h-full object-cover" />
                    {img.is_cover ? (
                      <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 fill-current" /> Cover
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetCover(img.id)}
                        className="absolute top-2 left-2 bg-black/60 hover:bg-blue-600 text-white text-[10px] font-medium px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Set Cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-red-600 text-white transition-colors"
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
              <PropertyInformationSection />
              <LocationSection hidePincode />
              <PropertyDetailsSection />
              <PricingSection />
              <BuilderSection />
              <AmenitiesSelector />
              <ImageUploader />
            </div>

            <div className="lg:col-span-1 space-y-6">
              <PreviewCard />
            </div>
          </div>
        </ContentContainer>

        <div className="sticky bottom-0 z-40 border-t border-slate-200 bg-white/90 p-4 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl justify-end gap-3">
            <button type="button" onClick={() => navigate(-1)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50">{saving ? 'Updating...' : 'Update Property'}</button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
