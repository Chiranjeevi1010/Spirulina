import { Navigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuthStore } from '../store/auth.store';

export default function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Spirulina ERP</h1>
          <p className="mt-2 text-gray-600">Cultivation Management System</p>
        </div>
        <div className="card">
          <div className="card-body p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>
            <LoginForm />
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-gray-500">
          Default: admin@spirulina.com / Admin@123
        </p>
      </div>
    </div>
  );
}
