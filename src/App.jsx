import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CustomerProducts from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import AdminLogin from './admin/AdminLogin'
import Dashboard from './admin/Dashboard'
import Installments from './admin/Installments'
import Categories from './admin/Categories'
import AdminProducts from './admin/Products'
import TrackOrder from './pages/track-order'
import Expenses from './admin/Expenses'
import Orders from './admin/Orders'
import AdminDiscounts from './admin/AdminDiscounts'
import OrderPage from './pages/OrderPage'
import CheckoutPage from './pages/checkout'
import Cart from './pages/cart'
import AdminReviews from './admin/AdminReviews'
import ProtectedRoute from './admin/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<CustomerProducts />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/order/:id" element={<OrderPage />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/cart" element={<Cart />} />

        {/* Admin Login - public, koi guard nahi */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin Protected Routes - ProtectedRoute se wrapped */}
        <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
        <Route path="/admin/installments" element={<ProtectedRoute><Installments /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
        <Route path="/admin/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/admin/discounts" element={<ProtectedRoute><AdminDiscounts /></ProtectedRoute>} />
        <Route path="/admin/reviews" element={<ProtectedRoute><AdminReviews /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App