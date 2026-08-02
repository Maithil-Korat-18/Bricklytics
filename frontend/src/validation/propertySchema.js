import { z } from 'zod';

const optionalNumber = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
  z.number().optional()
);

export const propertySchema = z.object({
  title: z
    .string()
    .min(3, 'Property Title must be at least 3 characters')
    .max(150, 'Property Title cannot exceed 150 characters'),
  propertyType: z.string(),
  listingType: z.string().default('New Property'),
  saleType: z.string().optional(),
  reconstructionNeeded: z.string().optional(),
  description: z.string().optional(),

  // Location Validation
  country: z.string().optional(),
  state: z.string().default('Gujarat'),
  city: z.string().default('Ahmedabad'),
  locality: z.string().min(1, 'Area / Locality is required'),
  fullAddress: z.string().min(1, 'Full Address is required'),
  pincode: z.string().optional(),
  latitude: optionalNumber,
  longitude: optionalNumber,

  // Property Details Validation
  bhk: z.string().optional(),
  bedrooms: optionalNumber,
  bathrooms: optionalNumber,
  balconies: optionalNumber,
  carpetArea: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number({ required_error: 'Carpet Area is required' }).positive('Carpet Area must be a positive number')
  ),
  builtUpArea: optionalNumber,
  superBuiltUpArea: optionalNumber,
  floorNumber: optionalNumber,
  totalFloors: optionalNumber,
  propertyAge: optionalNumber,
  facing: z.string().optional(),
  furnishing: z.string().optional(),
  parking: z.string().optional(),
  lift: z.string().optional(),
  powerBackup: z.string().optional(),
  waterSupply: z.string().optional(),
  houseType: z.string().optional(),
  landArea: optionalNumber,
  garden: z.string().optional(),
  terrace: z.string().optional(),

  // Pricing Validation
  expectedPrice: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number({ required_error: 'Expected Price is required' }).positive('Expected Price must be a positive number')
  ),
  maintenanceCharges: optionalNumber,
  bookingAmount: optionalNumber,
  negotiable: z.boolean().default(true),

  // Builder Validation (Optional for Resale)
  builderName: z.string().optional(),
  projectName: z.string().optional(),
  reraNumber: z.string().optional(),
  possessionStatus: z.string().optional(),
  possessionDate: z.string().optional(),

  // Seller Contact (passthrough — not validated strictly)
  sellerName: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().optional(),
  preferredContactTime: z.string().optional(),

  // Amenities Validation
  amenities: z.array(z.string()).default([]),

  // Media Validation
  images: z.array(z.string()).default([]),
  coverIndex: z.number().default(0),

  // File references (kept in frontend state, not validated)
  rawImageFiles: z.any().optional(),
  rawBrochureFile: z.any().optional(),
}).refine(
  (data) => {
    // Require reconstruction status for resale listings
    const isResale =
      data.listingType === 'Resale Property' || data.saleType === 'resale';
    if (isResale) {
      return !!data.reconstructionNeeded && data.reconstructionNeeded.trim() !== '';
    }
    return true;
  },
  {
    message: 'Please select Reconstruction / Renovation Status for resale property',
    path: ['reconstructionNeeded'],
  }
);
