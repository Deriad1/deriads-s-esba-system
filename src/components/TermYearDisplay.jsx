import { useGlobalSettings } from '../context/GlobalSettingsContext';

const TermYearDisplay = ({ className = '' }) => {
  const { settings } = useGlobalSettings();

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
        {settings.term || 'Term 1'}
      </span>
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
        {settings.academicYear || 'Not Set'}
      </span>
    </div>
  );
};

export default TermYearDisplay;