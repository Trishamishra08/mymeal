import { AppConfig } from './appConfig.model.js';

export const getAppConfigs = async (req, res) => {
    try {
        const configs = await AppConfig.find();
        res.status(200).json({ success: true, data: configs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

export const getAppConfigByName = async (req, res) => {
    try {
        const { appName } = req.params;
        let config = await AppConfig.findOne({ appName });
        if (!config) {
            // Return default config instead of 404 to prevent app crashes on fresh DB
            config = {
                appName,
                primaryColor: '#124b89', // Default Blue
                secondaryColor: '#F97316', // Default Orange
                logoUrl: '',
                fontFamily: 'Inter, sans-serif'
            };
        }
        res.status(200).json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

export const updateAppConfig = async (req, res) => {
    try {
        const { appName } = req.params;
        const { primaryColor, secondaryColor, logoUrl, fontFamily } = req.body;
        
        let config = await AppConfig.findOne({ appName });
        if (!config) {
            config = new AppConfig({ appName, primaryColor, secondaryColor, logoUrl, fontFamily });
        } else {
            if (primaryColor) config.primaryColor = primaryColor;
            if (secondaryColor) config.secondaryColor = secondaryColor;
            if (logoUrl !== undefined) config.logoUrl = logoUrl;
            if (fontFamily) config.fontFamily = fontFamily;
        }
        await config.save();
        res.status(200).json({ success: true, data: config, message: 'Configuration updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
