export interface CalcConfig {
  companyName: string;
  companyPhone: string;        // Wyświetlany jako fallback w razie awarii sieci
  privacyPolicyUrl: string;    // Link do polityki prywatności RODO na stronie stolarza
  consentVersion: string;      // Wersja klauzuli zgody (podbij przy każdej zmianie treści), zapisywana w arkuszu
  primaryColor: string;        // Kolor marki (HEX), np. "#92400e"
  basePricePerMeter: number;   // Stawka bazowa za 1 mb (np. 3200 PLN)
  webhookUrl: string;          // URL wdrożenia Google Apps Script Web App
  multipliers?: {
    layouts?: Partial<Record<KitchenLayout, number>>;
    finishes?: Partial<Record<FinishStandard, number>>;
  };
  extrasPrices?: {
    topCabinetsMultiplier?: number; // Domyślnie 0.15 (+15%)
    blumFlat?: number;              // Domyślnie 2200 PLN
    ledFlat?: number;               // Domyślnie 900 PLN
    cornerFlat?: number;            // Domyślnie 1800 PLN
  };
}

export type KitchenLayout = 'I-Shape' | 'L-Shape' | 'U-Shape' | 'Island';
export type FinishStandard = 'Laminat' | 'Lakier / Akryl' | 'Fornir / Drewno';

declare global {
  interface Window {
    KitchenCalcConfig?: Partial<CalcConfig>;
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
  }
}

export const defaultConfig: CalcConfig = {
  companyName: 'Meble Drzazga',
  companyPhone: '+48 600 000 000',
  privacyPolicyUrl: '/polityka-prywatnosci',
  consentVersion: '1.0',
  primaryColor: '#92400e',
  basePricePerMeter: 3200,
  webhookUrl: '',
};
