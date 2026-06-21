import { Platform } from 'react-native';

// --- HIRDETÉS-KEZELÉS (PLACEHOLDER) ---
// Ez a fájl jelenleg NEM hív valódi hirdetési SDK-t (AdMob / AdSense).
// Helyette egy "szimulált" jutalmazott hirdetést játszik le (időzítő),
// hogy a UI/logika már most tesztelhető legyen Expo Go-ban és weben is.
//
// Amikor készen állsz az élesítésre:
// - Web: ide kerül majd egy AdSense rewarded ad hívás.
// - Android/iOS: ide kerül majd a `react-native-google-mobile-ads` hívása.
//   FONTOS: az a csomag natív kódot tartalmaz, tehát attól a ponttól
//   EAS Build / `expo run:android` szükséges, Expo Go-ban nem fog működni.

const SIMULATED_AD_DURATION_MS = 1800;

/**
 * Lejátszik egy jutalmazott hirdetést (jelenleg szimulált).
 * @param {Object} options
 * @param {() => void} options.onReward - akkor hívódik meg, ha a "hirdetést" végignézte
 * @param {() => void} [options.onClose] - akkor hívódik meg, amikor a hirdetés UI bezárult (sikertől függetlenül)
 * @param {() => void} [options.onError] - hiba esetén
 */
export function showRewardedAd({ onReward, onClose, onError }) {
  try {
    // TODO(valódi hirdetés): itt majd platform-specifikus elágazás jön:
    // if (Platform.OS === 'web') { ... AdSense rewarded ad ... }
    // else { ... AdMob rewarded ad (react-native-google-mobile-ads) ... }
    setTimeout(() => {
      onReward?.();
      onClose?.();
    }, SIMULATED_AD_DURATION_MS);
  } catch (err) {
    onError?.(err);
  }
}

export const AD_PLACEHOLDER_NOTE =
  Platform.OS === 'web'
    ? 'Szimulált hirdetés (web) – később AdSense rewarded ad'
    : 'Szimulált hirdetés (natív) – később AdMob rewarded ad, EAS Build szükséges';