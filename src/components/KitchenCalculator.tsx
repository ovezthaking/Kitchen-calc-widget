import React, { useState, useMemo, useRef } from 'react';
import { CalcConfig, defaultConfig, KitchenLayout, FinishStandard } from '../types/config';
import { Check, ChevronRight, ChevronLeft, Phone, MapPin, Clock, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';

export const KitchenCalculator: React.FC = () => {
  const config: CalcConfig = useMemo(() => ({
    ...defaultConfig,
    ...(typeof window !== 'undefined' ? window.KitchenCalcConfig : {}),
  }), []);

  const mountTimeRef = useRef<number>(Date.now());

  const layoutOptions: { id: KitchenLayout; label: string; desc: string; multiplier: number }[] = useMemo(() => [
    { id: 'I-Shape', label: 'Jednorzędowa (Prosta)', desc: 'Zabudowa wzdłuż jednej ściany', multiplier: config.multipliers?.layouts?.['I-Shape'] ?? 1.0 },
    { id: 'L-Shape', label: 'Kształt litery L', desc: 'Zabudowa narożna na dwóch ścianach', multiplier: config.multipliers?.layouts?.['L-Shape'] ?? 1.08 },
    { id: 'U-Shape', label: 'Kształt litery U', desc: 'Zabudowa na trzech ścianach', multiplier: config.multipliers?.layouts?.['U-Shape'] ?? 1.15 },
    { id: 'Island', label: 'Kuchnia z wyspą', desc: 'Zabudowa główna + wolnostojąca wyspa', multiplier: config.multipliers?.layouts?.['Island'] ?? 1.25 },
  ], [config.multipliers]);

  const finishOptions: { id: FinishStandard; label: string; desc: string; multiplier: number }[] = useMemo(() => [
    { id: 'Laminat', label: 'Płyta laminowana (Ekonomiczny)', desc: 'Trwała płyta meblowa (Egger / Kronospan)', multiplier: config.multipliers?.finishes?.['Laminat'] ?? 1.0 },
    { id: 'Lakier / Akryl', label: 'Lakier Mat / Połysk lub Akryl', desc: 'Najpopularniejszy wybór, gładkie fronty', multiplier: config.multipliers?.finishes?.['Lakier / Akryl'] ?? 1.35 },
    { id: 'Fornir / Drewno', label: 'Fornir naturalny / Frezowane CNC', desc: 'Segment Premium, naturalna struktura', multiplier: config.multipliers?.finishes?.['Fornir / Drewno'] ?? 1.65 },
  ], [config.multipliers]);

  const extrasOptions = useMemo(() => {
    const topMult = config.extrasPrices?.topCabinetsMultiplier ?? 0.15;
    const topPercent = Math.round(topMult * 100);
    return [
      { id: 'Zabudowa pod sufit', label: `Zabudowa górna do samego sufitu (+${topPercent}%)`, costMultiplier: topMult },
      { id: 'Systemy Blum', label: 'Pełne okucia z cichym domykiem Blum / Hettich', flatCost: config.extrasPrices?.blumFlat ?? 2200 },
      { id: 'Oświetlenie LED', label: 'Frezowane oświetlenie LED podszafkowe', flatCost: config.extrasPrices?.ledFlat ?? 900 },
      { id: 'Cargo / Narożniki', label: 'Systemy narożne (Le Mans / Magic Corner) i Cargo', flatCost: config.extrasPrices?.cornerFlat ?? 1800 },
    ];
  }, [config.extrasPrices]);

  const [step, setStep] = useState<number>(1);
  const [layout, setLayout] = useState<KitchenLayout>('L-Shape');
  const [meters, setMeters] = useState<number>(4.5);
  const [finish, setFinish] = useState<FinishStandard>('Lakier / Akryl');
  const [extras, setExtras] = useState<string[]>(['Systemy Blum']);
  const [timeline, setTimeline] = useState<string>('W ciągu 1-2 miesięcy');

  // Pola kontaktowe, RODO i Honeypot
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [preferredTime, setPreferredTime] = useState('Po 16:00');
  const [rodoAccepted, setRodoAccepted] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const selectedLayoutLabel = layoutOptions.find((l) => l.id === layout)?.label || layout;

  // Jedno źródło prawdy: ta sama treść jest wyświetlana użytkownikowi i zapisywana w arkuszu jako dowód zgody
  const consentText = `Wyrażam zgodę na kontakt telefoniczny przez ${config.companyName} w celu przedstawienia wyceny mebli na wymiar oraz ustalenia terminu pomiaru.`;

  const priceRange = useMemo(() => {
    const layoutMult = layoutOptions.find((l) => l.id === layout)?.multiplier || 1;
    const finishMult = finishOptions.find((f) => f.id === finish)?.multiplier || 1;

    let base = meters * config.basePricePerMeter * layoutMult * finishMult;

    extrasOptions.forEach((extra) => {
      if (extras.includes(extra.id)) {
        if (extra.costMultiplier) base += base * extra.costMultiplier;
        if (extra.flatCost) base += extra.flatCost;
      }
    });

    const min = Math.round((base * 0.92) / 100) * 100;
    const max = Math.round((base * 1.12) / 100) * 100;

    return {
      min,
      max,
      formatted: `${min.toLocaleString('pl-PL')} – ${max.toLocaleString('pl-PL')} zł`,
    };
  }, [layout, meters, finish, extras, config.basePricePerMeter, layoutOptions, finishOptions, extrasOptions]);

  const toggleExtra = (id: string) => {
    setExtras((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const fireConversionEvents = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('kitchen-calc:lead', {
        detail: { layout: selectedLayoutLabel, meters, finish, minPrice: priceRange.min, maxPrice: priceRange.max },
      })
    );
    window.dataLayer?.push({
      event: 'kitchen_calculator_lead',
      kitchen_layout: selectedLayoutLabel,
      kitchen_meters: meters,
      kitchen_estimated_min: priceRange.min,
    });
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Lead', { content_name: 'Kalkulator Kuchni', value: priceRange.min, currency: 'PLN' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Filtr Antyspamowy (Honeypot + Time-Trap 4s)
    const elapsedMs = Date.now() - mountTimeRef.current;
    if (honeypot.trim().length > 0 || elapsedMs < 4000) {
      setIsSubmitted(true);
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      setError('Podaj poprawny, minimum 9-cyfrowy numer telefonu.');
      return;
    }
    if (!name.trim() || !location.trim()) {
      setError('Uzupełnij swoje imię oraz lokalizację montażu.');
      return;
    }
    if (!rodoAccepted) {
      setError('Zaakceptuj zgodę na kontakt telefoniczny w celu przedstawienia wyceny.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const payload = {
      companyName: config.companyName,
      name: name.trim(),
      phone: cleanPhone,
      location: location.trim(),
      layout: selectedLayoutLabel,
      meters,
      finish,
      extras: extras.join(', ') || 'Brak',
      timeline,
      preferredTime,
      estimatedRange: priceRange.formatted,
      // Dowód zgody RODO (art. 7 ust. 1) — zapisywany w arkuszu razem z datą zgłoszenia
      rodoConsent: rodoAccepted,
      consentVersion: config.consentVersion,
      consentText,
      pageUrl: window.location.href,
      honeypot,
      elapsedMs,
    };

    try {
      if (config.webhookUrl) {
        const res = await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        if (data.result === 'error') {
          throw new Error(data.message || 'Błąd serwera wycen');
        }
      } else {
        await new Promise((r) => setTimeout(r, 700));
        console.log('Wysłany Lead (Tryb Demo):', payload);
      }

      fireConversionEvents();
      setIsSubmitted(true);
    } catch (err) {
      console.error('Błąd wysyłki formularza:', err);
      setError(
        `Nie udało się wysłać zgłoszenia automatycznie. Spróbuj ponownie lub zadzwoń bezpośrednio: ${config.companyPhone}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const brandStyle = { '--kc-primary': config.primaryColor } as React.CSSProperties;

  if (isSubmitted) {
    return (
      <div style={brandStyle} className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-stone-200 p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-stone-900 mb-2">Dziękujemy, {name}!</h3>
        <p className="text-stone-600 mb-6">
          Twoja wstępna konfiguracja kuchni ({selectedLayoutLabel}, {meters} mb, {finish}) została przekazana do działu wycen{' '}
          <span className="font-semibold text-stone-900">{config.companyName}</span>.
        </p>
        <div className="bg-stone-50 rounded-xl p-4 mb-6 text-left border border-stone-200">
          <p className="text-sm text-stone-500 mb-1">Szacunkowy przedział kosztowy:</p>
          <p className="text-xl font-bold text-stone-900">{priceRange.formatted}</p>
          <p className="text-xs text-stone-500 mt-2">
            Skontaktujemy się pod numerem <b>{phone}</b> ({preferredTime}), aby potwierdzić szczegóły i ustalić niezobowiązujący pomiar w lokalizacji: <b>{location}</b>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={brandStyle} className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden text-stone-800">
      {/* Header */}
      <div className="bg-stone-900 text-white p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded-sm bg-white/10 text-amber-300">
            Kalkulator Wyceny Online • {config.companyName}
          </span>
          <span className="text-sm text-stone-400 font-medium">Krok {step} z 4</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold">Oblicz koszt kuchni na wymiar w 60 sekund</h2>
        <div className="w-full bg-stone-800 h-2 rounded-full mt-4 overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%`, backgroundColor: 'var(--kc-primary)' }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="p-6 sm:p-8">
        {step === 1 && (
          <div>
            <h3 className="text-lg font-bold mb-1">1. Wybierz układ swojej kuchni</h3>
            <p className="text-sm text-stone-500 mb-5">Wskaż kształt najbardziej zbliżony do Twojego pomieszczenia.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {layoutOptions.map((item) => {
                const active = layout === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setLayout(item.id)}
                    style={active ? { borderColor: 'var(--kc-primary)' } : undefined}
                    className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      active ? 'bg-stone-50' : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-stone-900">{item.label}</span>
                      {active && <Check className="w-5 h-5" style={{ color: 'var(--kc-primary)' }} />}
                    </div>
                    <p className="text-xs text-stone-500">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold">2. Łączna długość zabudowy</h3>
                <span
                  className="text-lg font-extrabold text-white px-3 py-1 rounded-lg"
                  style={{ backgroundColor: 'var(--kc-primary)' }}
                >
                  {meters.toFixed(1)} mb
                </span>
              </div>
              <p className="text-xs text-stone-500 mb-4">
                Zsumuj długość ścian, przy których mają stać szafki (np. 2.5m + 2.0m = 4.5 mb).
              </p>
              <input
                type="range"
                min={0}
                max={300}
                step={1}
                aria-valuemin={2.0}
                aria-valuemax={10.0}
                aria-valuenow={meters}
                aria-valuetext={`${meters.toFixed(1)} mb`}
                value={meters <= 5 ? (meters - 2) * 50 : 150 + (meters - 5) * 30}
                onChange={(e) => {
                  const pos = parseFloat(e.target.value);
                  const nextMeters =
                    pos <= 150
                      ? 2 + Math.round(pos / 25) * 0.5
                      : 5 + Math.round((pos - 150) / 15) * 0.5;
                  setMeters(nextMeters);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    setMeters((m) => Math.min(10, m + 0.5));
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    setMeters((m) => Math.max(2, m - 0.5));
                  }
                }}
                style={{ accentColor: 'var(--kc-primary)' }}
                className="w-full h-2 bg-stone-200 rounded-lg cursor-pointer"
              />
              <div className="grid grid-cols-3 text-xs text-stone-400 mt-1">
                <span className="text-left">2.0 mb (Mała)</span>
                <span className="text-center">5.0 mb (Standard)</span>
                <span className="text-right">10.0 mb (Duża)</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-3">Standard wykonania frontów</h3>
              <div className="space-y-2.5">
                {finishOptions.map((item) => {
                  const active = finish === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFinish(item.id)}
                      style={active ? { borderColor: 'var(--kc-primary)' } : undefined}
                      className={`w-full p-3.5 rounded-xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                        active ? 'bg-stone-50' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-stone-900 text-sm">{item.label}</div>
                        <div className="text-xs text-stone-500">{item.desc}</div>
                      </div>
                      {active && <Check className="w-5 h-5 shrink-0" style={{ color: 'var(--kc-primary)' }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-1">3. Wyposażenie dodatkowe</h3>
              <p className="text-xs text-stone-500 mb-3">Zaznacz elementy, które chcesz uwzględnić w wycenie:</p>
              <div className="space-y-2.5">
                {extrasOptions.map((item) => {
                  const checked = extras.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      style={checked ? { borderColor: 'var(--kc-primary)' } : undefined}
                      className={`flex items-center p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        checked ? 'bg-stone-50' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleExtra(item.id)}
                        style={{ accentColor: 'var(--kc-primary)' }}
                        className="w-4 h-4 mr-3 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-stone-800">{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-2">Planowany termin realizacji montażu:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {['W ciągu 1-2 miesięcy', 'Za 3-6 miesięcy', 'Dopiero zbieram oferty'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={timeline === t}
                    onClick={() => setTimeline(t)}
                    className={`p-2.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                      timeline === t
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Ukryte pole Honeypot na boty */}
            <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
              <input
                type="text"
                name="company_website_address"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 flex items-center justify-center gap-1 mb-1">
                <Sparkles className="w-4 h-4" style={{ color: 'var(--kc-primary)' }} /> Szacunkowy koszt Twojej konfiguracji
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 my-1">
                {priceRange.formatted}
              </div>
              <p className="text-xs text-stone-600">
                Układ: <b>{selectedLayoutLabel}</b> • Długość: <b>{meters} mb</b> • Fronty: <b>{finish}</b>
              </p>
            </div>

            <div>
              <h4 className="font-bold text-stone-900 text-base mb-1">
                Zarezerwuj bezpłatny pomiar i dokładną wycenę
              </h4>
              <p className="text-xs text-stone-500 mb-4">
                Zostaw dane kontaktowe – oddzwonimy, odpowiemy na pytania techniczne i potwierdzimy dogodny termin pomiaru.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Twoje imię *</label>
                  <input
                    type="text"
                    required
                    placeholder="np. Tomasz"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-stone-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> Numer telefonu *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="np. 600 123 456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-stone-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Miejscowość / Dzielnica *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="np. Wrocław, Krzyki"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-stone-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Kiedy najlepiej zadzwonić?
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm bg-white focus:outline-none focus:border-stone-800"
                  >
                    <option value="Rano (8:00 - 12:00)">Rano (8:00 - 12:00)</option>
                    <option value="Popołudnie (12:00 - 16:00)">Popołudnie (12:00 - 16:00)</option>
                    <option value="Po 16:00">Po godzinie 16:00</option>
                    <option value="Dowolna pora">Dowolna pora</option>
                  </select>
                </div>

                {/* Zgoda RODO */}
                <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={rodoAccepted}
                    onChange={(e) => setRodoAccepted(e.target.checked)}
                    style={{ accentColor: 'var(--kc-primary)' }}
                    className="w-4 h-4 mt-0.5 shrink-0 cursor-pointer"
                  />
                  <span className="text-[11px] text-stone-500 leading-tight">
                    {consentText} Szczegóły w{' '}
                    <a href={config.privacyPolicyUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-800">
                      Polityce Prywatności
                    </a>. *
                  </span>
                </label>
              </div>

              {error && (
                <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                style={{ backgroundColor: 'var(--kc-primary)' }}
                className="w-full mt-5 hover:opacity-95 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Wysyłanie zgłoszenia...' : 'Odbierz dokładną wycenę i umów pomiar'}
              </button>

              <p className="text-[11px] text-stone-400 text-center mt-3 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Twoje dane trafiają bezpośrednio do wykonawcy ({config.companyName}).
              </p>
            </div>
          </form>
        )}

        {/* Nawigacja dolna */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-stone-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 text-sm font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Wstecz
            </button>
          ) : (
            <div />
          )}

          {step < 4 && (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              Dalej <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
