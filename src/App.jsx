import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Orders from './pages/Orders'
import OrderDetails from './pages/OrderDetails'
import Categories from './pages/Categories'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

// Layout component for authenticated pages
const AdminLayout = ({ children }) => {
  React.useEffect(() => {
    console.log('AdminLayout rendered');
  }, []);

  return (
    <div className="admin-container">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  )
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/"
              element={
                <AdminLayout>
                  <Dashboard />
                </AdminLayout>
              }
            />
            <Route
              path="/products"
              element={
                <AdminLayout>
                  <Products />
                </AdminLayout>
              }
            />
            <Route
              path="/categories"
              element={
                <AdminLayout>
                  <Categories />
                </AdminLayout>
              }
            />
            <Route
              path="/orders"
              element={
                <AdminLayout>
                  <Orders />
                </AdminLayout>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <AdminLayout>
                  <OrderDetails />
                </AdminLayout>
              }
            />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

export default App
