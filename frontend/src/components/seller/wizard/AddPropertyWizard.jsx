import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { propertySchema } from '../../../validation/propertySchema';
import { propertyApi } from '../../../services/propertyApi';
import { useToast } from '../../../components/common/ToastContext';
import ContentContainer from '../../../components/common/ContentContainer';
import PageHeader from '../../../components/common/PageHeader';

// Step Sub-Components & Live Preview Card
import Step1BasicInfo from './Step1BasicInfo';
import Step2PropertyDetails from './Step2PropertyDetails';
import Step3PricingImages from './Step3PricingImages';
import Step4ReviewPublish from './Step4ReviewPublish';
import LiveListingPreviewCard from './LiveListingPreviewCard';
import WizardStepper from './WizardStepper';

import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Loader2,
  AlertTriangle
} from 'lucide-react';

const defaultValues = {
  title: '',
  propertyType: 'Flat / Apartment',
  listingType: 'New Property',
  saleType: 'new',
  reconstructionNeeded: '',
  description: '',

  state: 'Gujarat',
  city: 'Ahmedabad',
  locality: '',
  fullAddress: '',

  bhk: '',
  bedrooms: '',
  bathrooms: '',
  balconies: '',
  carpetArea: '',
  builtUpArea: '',
  superBuiltUpArea: '',
  floorNumber: '',
  totalFloors: '',
  unitsPerFloor: '',
  totalUnits: '',
  unitsSold: '',
  propertyAge: '',
  facing: '',
  furnishing: '',
  parking: '',
  lift: '',
  powerBackup: '',

  houseType: '',
  landArea: '',
  garden: '',
  terrace: '',
  sampleHouseReady: false,
  layoutType: '',

  expectedPrice: '',
  maintenanceCharges: '',
  bookingAmount: '',

  builderName: '',
  projectName: '',
  reraNumber: '',
  possessionStatus: '',
  possessionDate: '',

  amenities: [],
  nearbyPlaces: [],
  images: [],
  coverIndex: 0,
  rawImageFiles: [],
  rawBrochureFile: null,
};

// Wizard step mapping:
//  0 — Basic Info    (title, type, sale, description)
//  1 — Location      (state, city, locality, address)
//  2 — Amenities     (property specs + amenity selection — from Step2PropertyDetails)
//  3 — Media         (images, brochure, pricing — from Step3PricingImages)
//  4 — AI Preview    (review & publish — from Step4ReviewPublish)

export default function AddPropertyWizard() {
  const { showSuccess, showError } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const methods = useForm({
    resolver: zodResolver(propertySchema),
    defaultValues,
    mode: 'onTouched',
  });

  const { trigger, handleSubmit } = methods;

  const nextStep = async () => {
    setErrorMessage('');
    let fieldsToValidate = [];

    if (currentStep === 0) {
      // Basic Info: title, propertyType, listingType, description
      fieldsToValidate = ['title', 'propertyType', 'listingType'];
      const isResale = methods.getValues('listingType') === 'Resale Property' || methods.getValues('saleType') === 'resale';
      if (isResale) fieldsToValidate.push('reconstructionNeeded');
    } else if (currentStep === 1) {
      // Location: locality, fullAddress
      fieldsToValidate = ['locality', 'fullAddress'];
    } else if (currentStep === 2) {
      // Amenities: carpetArea required
      fieldsToValidate = ['carpetArea'];
    } else if (currentStep === 3) {
      // Media: expectedPrice required
      fieldsToValidate = ['expectedPrice'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const stateErrors = methods.formState.errors;
      const failingFields = fieldsToValidate
        .filter((field) => stateErrors[field])
        .map((field) => `${field}: ${stateErrors[field]?.message || 'invalid'}`)
        .join(' | ');
      setErrorMessage(
        failingFields
          ? `Validation error — ${failingFields}`
          : 'Please fill out all required fields marked with * before proceeding.'
      );
    }
  };

  const prevStep = () => {
    setErrorMessage('');
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onFinalSubmit = async (data) => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const isResale = data.listingType === 'Resale Property' || data.saleType === 'resale';
      const payload = {
        title: data.title,
        description: data.description || '',
        property_type: data.propertyType === 'Plot / Land' ? 'plot' : data.propertyType.includes('Villa') ? 'villa' : 'apartment',
        listing_type: 'sell',
        sale_type: isResale ? 'resale' : 'new',
        reconstruction_needed: isResale ? data.reconstructionNeeded : '',
        status: 'active',
        price: Number(data.expectedPrice),
        rate_per_sqft: Number(data.expectedPrice) && Number(data.carpetArea) ? Math.round(Number(data.expectedPrice) / Number(data.carpetArea)) : 0,
        bhk: data.bhk ? Number(data.bhk) : 1,
        bedrooms: data.bedrooms ? Number(data.bedrooms) : 0,
        bathrooms: data.bathrooms ? Number(data.bathrooms) : 0,
        balconies: data.balconies ? Number(data.balconies) : 0,
        area_sqft: Number(data.carpetArea),
        built_up_area: data.builtUpArea ? Number(data.builtUpArea) : null,
        super_built_up_area: data.superBuiltUpArea ? Number(data.superBuiltUpArea) : null,
        floor_number: data.floorNumber ? Number(data.floorNumber) : 1,
        total_floors: data.totalFloors ? Number(data.totalFloors) : 1,
        units_per_floor: data.unitsPerFloor ? Number(data.unitsPerFloor) : 0,
        total_units: data.totalFloors && data.unitsPerFloor ? Number(data.totalFloors) * Number(data.unitsPerFloor) : (data.totalUnits ? Number(data.totalUnits) : 0),
        units_sold: data.unitsSold ? Number(data.unitsSold) : 0,
        sample_house_ready: data.sampleHouseReady === true,
        layout_type: data.layoutType || '',
        nearby_places: data.nearbyPlaces || [],
        property_age: isResale && data.propertyAge ? Number(data.propertyAge) : 0,
        facing: isResale && data.facing ? data.facing : 'East',
        furnishing: data.furnishing || 'Unfurnished',
        parking: data.parking || 'Yes',

        address: data.fullAddress,
        locality: data.locality,
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: data.pincode || '380001',

        maintenance_charges: data.maintenanceCharges ? Number(data.maintenanceCharges) : 0,
        booking_amount: data.bookingAmount ? Number(data.bookingAmount) : 0,
        negotiable: data.negotiable ?? true,

        builder_name: data.listingType === 'New Property' ? data.builderName || '' : '',
        project_name: data.listingType === 'New Property' ? data.projectName || '' : '',
        rera_number: data.listingType === 'New Property' ? data.reraNumber || '' : '',
        possession_status: data.listingType === 'New Property' ? data.possessionStatus || 'Ready' : 'Ready',
        possession_date: data.listingType === 'New Property' ? data.possessionDate || '' : '',

        amenities: (data.amenities || []).map((name) => ({ name, category: 'General' })),
      };

      const res = await propertyApi.createProperty(payload);

      if (res.success && res.data?.id) {
        const propId = res.data.id;

        if (data.rawImageFiles && data.rawImageFiles.length > 0) {
          await propertyApi.uploadImages(propId, data.rawImageFiles);
        }

        if (data.rawBrochureFile) {
          await propertyApi.uploadBrochure(propId, data.rawBrochureFile);
        }

        setSuccessMessage(`Property "${data.title}" successfully published to active listings!`);
        showSuccess('Property listed successfully in active database!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Form submission error:', err);
      let msg = err.response?.data?.message || 'Failed to publish property to backend database.';
      if (err.response?.data?.errors && typeof err.response.data.errors === 'object') {
        const fieldErrors = Object.entries(err.response.data.errors)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join(' | ');
        if (fieldErrors) msg += ` Details: ${fieldErrors}`;
      }
      setErrorMessage(msg);
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <ContentContainer>
        <PageHeader
          title="Add Property Listing — Ahmedabad Real Estate"
          description="Interactive multi-step listing wizard with real-time live preview & AI valuation engine."
        />

        {/* 5-Step Wizard Stepper */}
        <WizardStepper currentStep={currentStep} onStepClick={(stepIdx) => setCurrentStep(stepIdx)} />

        {/* Success Banner */}
        {successMessage && (
          <div className="p-4 mb-6 rounded-xl bg-[#f5fff6] border border-[#00855b]/30 text-[#006947] text-sm font-semibold flex items-center space-x-3 shadow-ambient">
            <CheckCircle2 className="w-5 h-5 text-[#006947] flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-4 mb-6 rounded-xl bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] text-sm font-semibold flex items-center space-x-3 shadow-ambient">
            <AlertTriangle className="w-5 h-5 text-[#ba1a1a] flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main 2-Column Grid Layout */}
        <form onSubmit={handleSubmit(onFinalSubmit)} onKeyDown={(e) => {
          if (e.key === 'Enter' && currentStep < 4) {
            e.preventDefault();}}}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column — Form Step */}
            <div className="lg:col-span-2 space-y-8 min-h-[400px]">
              {/* Step 0: Basic Info (title, type, sale, description) */}
              {currentStep === 0 && <Step1BasicInfo mode="basic" />}

              {/* Step 1: Location (state, city, locality, address) */}
              {currentStep === 1 && <Step1BasicInfo mode="location" />}

              {/* Step 2: Amenities (property specs + amenities toggle) */}
              {currentStep === 2 && <Step2PropertyDetails />}

              {/* Step 3: Media & Pricing */}
              {currentStep === 3 && <Step3PricingImages />}

              {/* Step 4: AI Preview & Review */}
              {currentStep === 4 && <Step4ReviewPublish onJumpToStep={(stepIdx) => setCurrentStep(stepIdx)} />}

              {/* Navigation Footer */}
              <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#e2e7ff] shadow-ambient flex items-center justify-between gap-4">
                <div>
                  {currentStep > 0 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg border border-[#c2c6d6] text-[#424754] hover:bg-[#f2f3ff] text-xs font-bold transition cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>
                  )}
                </div>  

                <div className="flex items-center space-x-3">
                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg bg-[#0058be] hover:bg-[#004395] text-white text-xs font-bold shadow-lg shadow-[#0058be]/20 transition cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-lg bg-[#006947] hover:bg-[#005236] text-white text-xs font-black shadow-lg shadow-[#006947]/20 transition cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Publishing Property...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Publish Property</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column — Sticky Live Preview */}
            <div className="lg:col-span-1">
              <LiveListingPreviewCard />
            </div>
          </div>
        </form>
      </ContentContainer>
    </FormProvider>
  );
}
