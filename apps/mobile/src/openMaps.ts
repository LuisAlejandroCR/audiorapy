// openMaps.ts: one "Cómo llegar" button, the choice of app belongs to the phone. Android shows its own
// chooser for a geo: link (Google Maps, Waze or any installed maps app); iOS gets an action sheet with
// Apple Maps, Google Maps and Waze. The web preview opens the three options inline instead.
import { ActionSheetIOS, Linking, Platform } from 'react-native';
import { cleanAddress, MAP_APPS, mapLink } from '@audiorapy/web-lib/maps.ts';

export function openMaps(address: string): void {
  const q = cleanAddress(address);
  if (!q) return;
  if (Platform.OS === 'android') {
    void Linking.openURL(`geo:0,0?q=${encodeURIComponent(q)}`).catch(() =>
      Linking.openURL(mapLink('google', q)!),
    );
    return;
  }
  if (Platform.OS === 'ios') {
    const options = ['Apple Maps', 'Google Maps', 'Waze', 'Cancelar'];
    const ids = ['apple', 'google', 'waze'] as const;
    ActionSheetIOS.showActionSheetWithOptions(
      { title: 'Abrir en', options, cancelButtonIndex: 3 },
      (i) => {
        const id = ids[i];
        if (id) void Linking.openURL(mapLink(id, q)!);
      },
    );
  }
}

/** The web preview has no system chooser: it lists the apps under the button. */
export const WEB_CHOICES = MAP_APPS;
export const needsInlineChoice = Platform.OS === 'web';
