export const LEGAL_URL = 'https://recharj.org/legal';
export const SUPPORT_EMAIL = 'support@recharj.app';

// web/legal.html carries both languages itself (its own toggle, detecting
// device language / a stored choice) — `lang` here just forces it to open
// already matching whatever language the app is currently in, instead of
// making the user hit the toggle a second time.
export function privacyUrl(lang: string): string {
  return lang === 'fr' ? `${LEGAL_URL}?lang=fr#confidentialite` : `${LEGAL_URL}?lang=en#privacy`;
}

export function termsUrl(lang: string): string {
  return lang === 'fr' ? `${LEGAL_URL}?lang=fr#cgu` : `${LEGAL_URL}?lang=en#terms`;
}
