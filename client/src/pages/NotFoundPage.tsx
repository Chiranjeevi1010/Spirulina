import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <p className="mt-4 text-xl text-gray-600">{t('notFound.title')}</p>
        <Link to="/dashboard" className="btn-primary inline-block mt-6">{t('notFound.goHome')}</Link>
      </div>
    </div>
  );
}
