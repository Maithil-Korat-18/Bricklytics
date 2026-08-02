import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import VerifyEmailPage from '../pages/auth/VerifyEmailPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import BuyerDashboardPage from '../pages/BuyerDashboardPage';
import PropertyListingPage from '../pages/buyer/PropertyListingPage';
import PropertyDetailPage from '../pages/buyer/PropertyDetailPage';
import WishlistPage from '../pages/buyer/WishlistPage';
import ComparePropertiesPage from '../pages/buyer/ComparePropertiesPage';
import ScheduleVisitPage from '../pages/buyer/ScheduleVisitPage';
import BuyerProfilePage from '../pages/buyer/BuyerProfilePage';
import SellerDashboardPage from '../pages/SellerDashboardPage';
import AddPropertyPage from '../pages/seller/AddPropertyPage';
import ManagePropertiesPage from '../pages/seller/ManagePropertiesPage';
import PropertyDetailsPage from '../pages/seller/PropertyDetailsPage';
import EditPropertyPage from '../pages/seller/EditPropertyPage';
import AnalyticsPage from '../pages/seller/AnalyticsPage';
import SellerProfilePage from '../pages/seller/SellerProfilePage';
import BricklyticsLanding from '../pages/BricklyticsLanding';
import NotFoundPage from '../pages/NotFoundPage';
import { ROUTES } from '../constants/routes';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <BricklyticsLanding
      onNavigate={(destination) => navigate(destination === 'login' ? ROUTES.LOGIN : ROUTES.SIGNUP)}
    />
  );
}

export default function AppRoutes() {
  return (
    <Router>
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
    </Router>
  );
}
