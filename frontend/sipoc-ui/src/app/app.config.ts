import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';

const SUPPORTED_LANGS = ['en', 'de'];
const DEFAULT_LANG = 'en';

function detectInitialLang(): string {
  const browserLang = (typeof navigator !== 'undefined' ? navigator.language : DEFAULT_LANG) ?? DEFAULT_LANG;
  const shortLang = browserLang.split('-')[0].toLowerCase();
  return SUPPORTED_LANGS.includes(shortLang) ? shortLang : DEFAULT_LANG;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideTranslateService({
      lang: detectInitialLang(),
      fallbackLang: DEFAULT_LANG,
      loader: provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
    }),
  ],
};
