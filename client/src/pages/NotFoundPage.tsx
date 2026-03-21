import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <p className="mt-4 text-xl text-gray-600">Page not found</p>
        <Link to="/dashboard" className="btn-primary inline-block mt-6">Go to Dashboard</Link>
      </div>
    </div>
  );
}
