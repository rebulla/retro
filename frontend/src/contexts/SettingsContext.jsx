import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(10); // Default 10%

  useEffect(() => {
    const savedSound = localStorage.getItem('soundEnabled');
    if (savedSound !== null) {
      setSoundEnabled(savedSound === 'true');
    }
    const savedVolume = localStorage.getItem('soundVolume');
    if (savedVolume !== null) {
      setVolume(Number(savedVolume));
    }
  }, []);

  const updateSoundEnabled = (enabled) => {
    setSoundEnabled(enabled);
    localStorage.setItem('soundEnabled', enabled);
  };

  const updateVolume = (newVolume) => {
    setVolume(newVolume);
    localStorage.setItem('soundVolume', newVolume);
  };

  return (
    <SettingsContext.Provider value={{ soundEnabled, updateSoundEnabled, volume, updateVolume }}>
      {children}
    </SettingsContext.Provider>
  );
};
