import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { AppLayout } from '../components/layout/AppLayout'
import { About } from '../pages/About'
import { Account } from '../pages/Account'
import { AuthCallback } from '../pages/AuthCallback'
import { Companies } from '../pages/Companies'
import { CompanyDetail } from '../pages/CompanyDetail'
import { Dashboard } from '../pages/Dashboard'
import { ScanDetails } from '../pages/ScanDetails'
import { SilentRenew } from '../pages/SilentRenew'

/** Public OIDC routes stay outside ProtectedRoute to avoid login loops. */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/silent-renew" element={<SilentRenew />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/companies/:id" element={<CompanyDetail />} />
          <Route path="/scans/:id" element={<ScanDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/account" element={<Account />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
