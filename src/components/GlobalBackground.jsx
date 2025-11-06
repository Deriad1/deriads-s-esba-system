import { useGlobalSettings } from '../context/GlobalSettingsContext';

const GlobalBackground = () => {
  const { settings } = useGlobalSettings();

  // Default background image (same as login page)
  const backgroundImage = settings.backgroundImage || '/group-african-kids-learning-together.jpg';

  return (
    <>
      {/* Background Image */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: -2,
          pointerEvents: 'none'
        }}
      />

      {/* Black transparent overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'black',
          opacity: 0.5,
          zIndex: -1,
          pointerEvents: 'none'
        }}
      />
    </>
  );
};

export default GlobalBackground;
