import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

// A te AdSense publisher ID-d.
export const ADSENSE_CLIENT = 'ca-pub-5819571927407866';

// Ide kerülnek majd az AdSense-ben létrehozott konkrét Ad unit slot ID-k,
// amint az oldal jóváhagyásra került és létrehoztad a hirdetési egységeket.
// Amíg null, a komponens egy egyszerű "HIRDETÉS HELY" placeholdert mutat.
export const AD_SLOT_LEFT = null; // pl. '1234567890'
export const AD_SLOT_RIGHT = null; // pl. '0987654321'

let scriptInjected = false;
let metaInjected = false;

function ensureAdSenseMetaTag() {
  if (Platform.OS !== 'web' || metaInjected) return;
  if (typeof document === 'undefined') return;
  if (document.querySelector('meta[name="google-adsense-account"]')) {
    metaInjected = true;
    return;
  }
  const meta = document.createElement('meta');
  meta.name = 'google-adsense-account';
  meta.content = ADSENSE_CLIENT;
  document.head.appendChild(meta);
  metaInjected = true;
}

// A meta tag-et azonnal beillesztjük, amint ez a modul betöltődik (nem várunk
// a Shell renderelésére), hogy az AdSense ellenőrző script minél hamarabb lássa.
ensureAdSenseMetaTag();

function ensureAdSenseScript() {
  if (Platform.OS !== 'web' || scriptInjected) return;
  if (typeof document === 'undefined') return;
  if (document.querySelector('script[src*="adsbygoogle.js"]')) {
    scriptInjected = true;
    return;
  }
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.appendChild(script);
  scriptInjected = true;
}

// slotId: az AdSense Ad unit slot ID-ja (string). Amíg nincs megadva,
// helykitöltő dobozt renderel.
export default function AdSenseSlot({ slotId, label = 'HIRDETÉS\nHELY' }) {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || !slotId) return;
    ensureAdSenseScript();
    if (pushedRef.current) return;
    try {
      // eslint-disable-next-line no-undef
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch (e) {
      // Az AdSense script még nem töltött be / jóváhagyás folyamatban van.
    }
  }, [slotId]);

  if (Platform.OS !== 'web') return null;

  if (!slotId) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          minHeight: 250,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.25)',
          fontSize: 11,
          fontWeight: 700,
          textAlign: 'center',
          letterSpacing: 1,
          whiteSpace: 'pre-line',
        }}
      >
        {label}
      </div>
    );
  }
//comment
  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', width: '100%', minHeight: 250 }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}