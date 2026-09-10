// Ammount user can spend on the platform before they need to enabled byok
export const perUserSpendLimit = 0.3;

const envBaseModel = process.env.BASE_MODEL?.trim();

export const goBetterFreeModels: Record<string, { modelProviderName: string; inputCost: number; outputCost: number }> = {
    'mercury-2': {
        modelProviderName: 'inceptionlabs',
        inputCost: 0.25,
        outputCost: 0.75,
    },
    ...(envBaseModel && envBaseModel !== 'mercury-2' ? {
        [envBaseModel]: {
            modelProviderName: process.env.AI_PROVIDER || 'inceptionlabs',
            inputCost: 0.25,
            outputCost: 0.75,
        }
    } : {})
};

export const defaultBaseModel = envBaseModel || 'mercury-2';

export const goBetterBaseURL = process.env.AI_BASE_URL || 'https://api.inceptionlabs.ai/v1/chat/completions';
export const goBetterBaseUrl = goBetterBaseURL;

// Brand and Email Configuration
export const brandName = process.env.BRAND_NAME || 'Go Better';
export const brandUrl = process.env.BRAND_URL || 'https://gobetter.dev';
export const brandTagline = process.env.BRAND_TAGLINE || 'Autonomous AI Code Reviews';
export const fromEmail = process.env.FROM_EMAIL || 'noreply@mail.gobetter.dev';
export const fromSender = process.env.FROM_SENDER || `${brandName} <${fromEmail}>`;
export const emailTheme: 'dark' | 'light' = (process.env.EMAIL_THEME as 'dark' | 'light') || 'dark';
export const copyrightYear = process.env.COPYRIGHT_YEAR || '2026';

// Email logos configuration defaulting to GoBetter logos
export const emailLogos = {
    primary: process.env.BRAND_LOGO_URL || 'https://gobetter.dev/gobetter-logo.png',
    png: 'https://gobetter.dev/gobetter-logo.png',
    default: 'https://gobetter.dev/gobetter-logo.png',
};
export const emailLogo = emailLogos.primary;

export const emailBrandConfig = {
    brandName,
    brandUrl,
    brandTagline,
    fromEmail,
    fromSender,
    from: fromSender,
    emailTheme,
    theme: emailTheme,
    copyrightYear,
    logoUrl: emailLogo,
    logos: emailLogos,
};

export const emailConfig = emailBrandConfig;
export const brandConfig = emailBrandConfig;
