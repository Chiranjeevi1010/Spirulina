import { useTranslation } from 'react-i18next';

export default function ReportsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('reports.title')}</h1>
      <div className="card card-body">
        <p className="text-gray-500">{t('reports.subtitle')}</p>
      </div>
    </div>
  );
}
