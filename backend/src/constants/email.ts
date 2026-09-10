import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { emailBrandConfig } from '../config/config.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templateCandidates = [
  path.join(__dirname, '../tempaltes/otpTemplate.html'),
  path.join(__dirname, '../templates/otpTemplate.html'),
  path.join(__dirname, 'templates/otpTemplate.html'),
  path.join(process.cwd(), 'dist/templates/otpTemplate.html'),
  path.join(process.cwd(), 'templates/otpTemplate.html'),
];
const templatePath = templateCandidates.find((candidate) => fs.existsSync(candidate));

if (!templatePath) {
  throw new Error(`OTP email template not found. Checked: ${templateCandidates.join(', ')}`);
}

export const otpTemplateHtml = fs.readFileSync(templatePath, 'utf-8');

export interface EmailThemeColors {
  bodyBg: string;
  cardBg: string;
  cardBorder: string;
  titleColor: string;
  descColor: string;
  strongColor: string;
  otpBoxBg: string;
  otpBoxBorder: string;
  otpCodeColor: string;
  securityColor: string;
  highlightColor: string;
  dividerBorder: string;
  footerBrandColor: string;
  footerTextColor: string;
  colorScheme: 'dark' | 'light';
}

export const EMAIL_THEMES: Record<'dark' | 'light', EmailThemeColors> = {
  dark: {
    bodyBg: '#0a0a0c',
    cardBg: '#111217',
    cardBorder: '1px dashed #2e313d',
    titleColor: '#f4f4f5',
    descColor: '#a1a1aa',
    strongColor: '#f4f4f5',
    otpBoxBg: '#181920',
    otpBoxBorder: '1px solid #2a2c38',
    otpCodeColor: '#ffffff',
    securityColor: '#71717a',
    highlightColor: '#e4e4e7',
    dividerBorder: '1px solid #232530',
    footerBrandColor: '#71717a',
    footerTextColor: '#52525b',
    colorScheme: 'dark',
  },
  light: {
    bodyBg: '#fafafa',
    cardBg: '#ffffff',
    cardBorder: '1px dashed #d4d4d8',
    titleColor: '#0a0a0a',
    descColor: '#52525b',
    strongColor: '#09090b',
    otpBoxBg: '#f6f7f9',
    otpBoxBorder: '1px solid #e5e7eb',
    otpCodeColor: '#09090b',
    securityColor: '#71717a',
    highlightColor: '#09090b',
    dividerBorder: '1px solid #eaeaea',
    footerBrandColor: '#52525b',
    footerTextColor: '#a1a1aa',
    colorScheme: 'light',
  },
};

export function renderOtpEmail(otp: string, email?: string, themeOverride?: 'dark' | 'light'): string {
  const brandName = emailBrandConfig.brandName;
  const brandUrl = emailBrandConfig.brandUrl;
  const logoUrl = emailBrandConfig.logoUrl || emailBrandConfig.logos?.primary || 'https://gobetter.dev/gobetter-logo.png';
  const brandTagline = emailBrandConfig.brandTagline;
  const copyrightYear = emailBrandConfig.copyrightYear || new Date().getFullYear().toString();
  const theme = themeOverride || emailBrandConfig.emailTheme || 'dark';
  const isDark = theme === 'dark';
  const colors = EMAIL_THEMES[isDark ? 'dark' : 'light'];

  let html = otpTemplateHtml
    .replace(/\{\{\s*otp\s*\}\}/gi, otp)
    .replace(/\{\{\s*email\s*\}\}/gi, email || 'your account')
    .replace(/\{\{\s*brandName\s*\}\}/gi, brandName)
    .replace(/\{\{\s*brandUrl\s*\}\}/gi, brandUrl)
    .replace(/\{\{\s*logoUrl\s*\}\}/gi, logoUrl)
    .replace(/\{\{\s*emailLogo\s*\}\}/gi, logoUrl)
    .replace(/\{\{\s*logo\s*\}\}/gi, logoUrl)
    .replace(/\{\{\s*brandLogo\s*\}\}/gi, logoUrl)
    .replace(/\{\{\s*brandTagline\s*\}\}/gi, brandTagline)
    .replace(/\{\{\s*tagline\s*\}\}/gi, brandTagline)
    .replace(/\{\{\s*copyrightYear\s*\}\}/gi, copyrightYear)
    .replace(/\{\{\s*year\s*\}\}/gi, copyrightYear)
    .replace(/\{\{\s*bodyBg\s*\}\}/gi, colors.bodyBg)
    .replace(/\{\{\s*cardBg\s*\}\}/gi, colors.cardBg)
    .replace(/\{\{\s*cardBorder\s*\}\}/gi, colors.cardBorder)
    .replace(/\{\{\s*titleColor\s*\}\}/gi, colors.titleColor)
    .replace(/\{\{\s*descColor\s*\}\}/gi, colors.descColor)
    .replace(/\{\{\s*strongColor\s*\}\}/gi, colors.strongColor)
    .replace(/\{\{\s*otpBoxBg\s*\}\}/gi, colors.otpBoxBg)
    .replace(/\{\{\s*otpBoxBorder\s*\}\}/gi, colors.otpBoxBorder)
    .replace(/\{\{\s*otpCodeColor\s*\}\}/gi, colors.otpCodeColor)
    .replace(/\{\{\s*securityColor\s*\}\}/gi, colors.securityColor)
    .replace(/\{\{\s*highlightColor\s*\}\}/gi, colors.highlightColor)
    .replace(/\{\{\s*dividerBorder\s*\}\}/gi, colors.dividerBorder)
    .replace(/\{\{\s*footerBrandColor\s*\}\}/gi, colors.footerBrandColor)
    .replace(/\{\{\s*footerTextColor\s*\}\}/gi, colors.footerTextColor)
    .replace(/\{\{\s*colorScheme\s*\}\}/gi, colors.colorScheme)
    // Legacy fallback replacement in case raw template is loaded
    .replace(/https:\/\/gobetter\.dev\/gobetter-logo\.png/g, logoUrl)
    .replace(/https:\/\/gobetter\.dev/g, brandUrl);

  if (isDark) {
    html = html
      .replace(/background-color:\s*#fafafa/gi, 'background-color: #0a0a0c')
      .replace(/background-color:\s*#ffffff/gi, 'background-color: #111217')
      .replace(/border:\s*1px dashed #d4d4d8/gi, 'border: 1px dashed #2e313d')
      .replace(/color:\s*#0a0a0a/gi, 'color: #f4f4f5')
      .replace(/color:\s*#09090b/gi, 'color: #f4f4f5')
      .replace(/color:\s*#52525b/gi, 'color: #a1a1aa')
      .replace(/background-color:\s*#f6f7f9/gi, 'background-color: #181920')
      .replace(/border:\s*1px solid #e5e7eb/gi, 'border: 1px solid #2a2c38')
      .replace(/border-top:\s*1px solid #eaeaea/gi, 'border-top: 1px solid #232530')
      .replace(/color-scheme:\s*light dark/gi, 'color-scheme: dark')
      .replace(/content="light dark"/gi, 'content="dark"');
  }

  return html;
}

// OTP email configuration
export const otpEmailData = {
  from: emailBrandConfig.from || emailBrandConfig.fromSender || `${emailBrandConfig.brandName} <${emailBrandConfig.fromEmail}>`,
  subject: 'Verify your email address',
  html: otpTemplateHtml,
  getHtml: renderOtpEmail,
};