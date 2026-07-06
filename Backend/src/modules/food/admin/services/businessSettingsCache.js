let cachedSettings = null;

export const setBusinessSettingsCache = (settings) => {
    cachedSettings = settings;
};

export const getBusinessSettingsCache = () => {
    return cachedSettings;
};
