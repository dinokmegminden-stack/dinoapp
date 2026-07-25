// useAppFonts — a Dínó Lexikon web-tipográfiájának központi betöltése.
// Rokkitt (címsorok) + Inter (törzsszöveg/UI). A visszaadott `fontsReady` addig
// false, amíg a fájlok be nem töltöttek; a hívó ilyenkor a rendszer-fontra eshet
// vissza (nem blokkoljuk a teljes appot). A család-neveket a theme FONTS adja.
import { useFonts as useRokkitt, Rokkitt_700Bold, Rokkitt_800ExtraBold } from '@expo-google-fonts/rokkitt';
import { useFonts as useInter, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export default function useAppFonts() {
  const [rokkittLoaded] = useRokkitt({ Rokkitt_700Bold, Rokkitt_800ExtraBold });
  const [interLoaded] = useInter({ Inter_400Regular, Inter_700Bold });
  return rokkittLoaded && interLoaded;
}
