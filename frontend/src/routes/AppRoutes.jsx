import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import { ROUTES } from '../constants/routes';

// Lazy-loaded pages for bundle optimization & code splitting
const BricklyticsLanding = lazy(() => import('../pages/BricklyticsLanding'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const SignupPage = lazy(() => import('../pages/auth/SignupPage'));
const VerifyEmailPage = lazy(() => import('../pages/auth/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));

const BuyerDashboardPage = lazy(() => import('../pages/BuyerDashboardPage'));
const PropertyListingPage = lazy(() => import('../pages/buyer/PropertyListingPage'));
const PropertyDetailPage = lazy(() => import('../pages/buyer/PropertyDetailPage'));
const WishlistPage = lazy(() => import('../pages/buyer/WishlistPage'));
const ComparePropertiesPage = lazy(() => import('../pages/buyer/ComparePropertiesPage'));
const ScheduleVisitPage = lazy(() => import('../pages/buyer/ScheduleVisitPage'));
const BuyerProfilePage = lazy(() => import('../pages/buyer/BuyerProfilePage'));

const SellerDashboardPage = lazy(() => import('../pages/SellerDashboardPage'));
const AddPropertyPage = lazy(() => import('../pages/seller/AddPropertyPage'));
const ManagePropertiesPage = lazy(() => import('../pages/seller/ManagePropertiesPage'));
const PropertyDetailsPage = lazy(() => import('../pages/seller/PropertyDetailsPage'));
const EditPropertyPage = lazy(() => import('../pages/seller/EditPropertyPage'));
const AnalyticsPage = lazy(() => import('../pages/seller/AnalyticsPage'));
const SellerProfilePage = lazy(() => import('../pages/seller/SellerProfilePage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

function LandingPage() {
  const navigate = useNavigate();

  return (
    <BricklyticsLanding
      onNavigate={(destination) => navigate(destination === 'login' ? ROUTES.LOGIN : ROUTES.SIGNUP)}
    />
  );
}

function LoadingFallback() {
  return (
    <div className="p-8 max-w-7xl mx-auto min-h-[60vh] flex items-center justify-center">
      <LoadingSkeleton variant="card" count={3} />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path={ROUTES.HOME} element={<LandingPage />} />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.SIGNUP} element={<SignupPage />} />
          <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute allowedRoles={['buyer']} />}>
            <Route element={<DashboardLayout />}>
              <Route path={ROUTES.BUYER_DASHBOARD} element={<BuyerDashboardPage />} />
              <Route path={ROUTES.PROPERTIES} element={<PropertyListingPage />} />
              <Route path={ROUTES.PROPERTY_DETAILS_BUYER} element={<PropertyDetailPage />} />
              <Route path={ROUTES.WISHLIST} element={<WishlistPage />} />
              <Route path={ROUTES.COMPARE} element={<ComparePropertiesPage />} />
              <Route path={ROUTES.SCHEDULE_VISIT} element={<ScheduleVisitPage />} />
              <Route path={ROUTES.BUYER_PROFILE} element={<BuyerProfilePage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['seller']} />}>
            <Route element={<DashboardLayout />}>
              <Route path={ROUTES.SELLER_DASHBOARD} element={<SellerDashboardPage />} />
              <Route path={ROUTES.ADD_PROPERTY} element={<AddPropertyPage />} />
              <Route path={ROUTES.MANAGE_PROPERTIES} element={<ManagePropertiesPage />} />
              <Route path={ROUTES.PROPERTY_DETAILS} element={<PropertyDetailsPage />} />
              <Route path={ROUTES.EDIT_PROPERTY} element={<EditPropertyPage />} />
              <Route path={ROUTES.ANALYTICS} element={<AnalyticsPage />} />
              <Route path={ROUTES.SELLER_PROFILE} element={<SellerProfilePage />} />
            </Route>
          </Route>

          <Route path={ROUTES.BUYER_BASE} element={<Navigate to={ROUTES.BUYER_DASHBOARD} replace />} />
          <Route path={ROUTES.SELLER_BASE} element={<Navigate to={ROUTES.SELLER_DASHBOARD} replace />} />
          <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
