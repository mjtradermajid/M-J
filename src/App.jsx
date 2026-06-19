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

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/installments" element={<Installments />} />
        <Route path="/admin/categories" element={<Categories />} />
        <Route path="/admin/expenses" element={<Expenses />} />
        <Route path="/admin/orders" element={<Orders />} />
        <Route path="/admin/discounts" element={<AdminDiscounts />} />
        <Route path="/admin/reviews" element={<AdminReviews />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App