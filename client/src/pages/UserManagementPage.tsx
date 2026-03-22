import { useTranslation } from 'react-i18next';

export default function UserManagementPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('userManagement.title')}</h1>
      <div className="card card-body">
        <p className="text-gray-500">{t('userManagement.subtitle')}</p>
      </div>
    </div>
  );
}
