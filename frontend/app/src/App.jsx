import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { CartProvider } from './cart/CartContext'
import RequireAdmin from './auth/RequireAdmin'
import RequireAuth from './auth/RequireAuth'
import MainLayout from './layout/MainLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyOtpPage from './pages/VerifyOtpPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ProfilePage from './pages/ProfilePage'
import MyOrdersPage from './pages/MyOrdersPage'
import AdminUsersPage from './pages/AdminUsersPage'
import HomeDashboard from './pages/HomeDashboard'
import ProductsPage from './pages/ProductsPage'
import BikesPage from './pages/BikesPage'
import ScootersPage from './pages/ScootersPage'
import ProductDetailPage from './pages/ProductDetailPage'
import PartsPage from './pages/PartsPage'
import PartDetailPage from './pages/PartDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import CheckoutSuccessPage from './pages/CheckoutSuccessPage'
import OrdersPage from './pages/OrdersPage'
import AnalyticsPage from './pages/AnalyticsPage'
import OffersPage from './pages/OffersPage'
import TestDrivePage from './pages/TestDrivePage'
import ContactPage from './pages/ContactPage'

function ProtectedRoute({ children }) {
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomeDashboard />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="bikes" element={<BikesPage />} />
            <Route path="scooters" element={<ScootersPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="parts" element={<PartsPage />} />
            <Route path="parts/:id" element={<PartDetailPage />} />
            <Route
              path="cart"
              element={
                <RequireAuth>
                  <CartPage />
                </RequireAuth>
              }
            />
            <Route
              path="checkout"
              element={
                <RequireAuth>
                  <CheckoutPage />
                </RequireAuth>
              }
            />
            <Route path="checkout/success" element={<CheckoutSuccessPage />} />
            <Route
              path="profile"
              element={
                <RequireAuth>
                  <ProfilePage />
                </RequireAuth>
              }
            />
            <Route
              path="my-orders"
              element={
                <RequireAuth>
                  <MyOrdersPage />
                </RequireAuth>
              }
            />
            <Route
              path="admin/orders"
              element={
                <RequireAdmin>
                  <OrdersPage />
                </RequireAdmin>
              }
            />
            <Route
              path="admin/analytics"
              element={
                <RequireAdmin>
                  <AnalyticsPage />
                </RequireAdmin>
              }
            />
            <Route
              path="admin/users"
              element={
                <RequireAdmin>
                  <AdminUsersPage />
                </RequireAdmin>
              }
            />
            <Route path="offers" element={<OffersPage />} />
            <Route path="test-drive" element={<TestDrivePage />} />
            <Route path="contact" element={<ContactPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  )
}
