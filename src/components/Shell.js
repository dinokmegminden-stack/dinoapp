console.log("SHELL RENDER");
import { StyleSheet } from 'react-native';

let _styles;
function getStyles() {
  if (!_styles) {
    _styles = StyleSheet.create({
      shellOuter: { flex: 1, width: '100%', backgroundColor: '#283618', alignItems: 'stretch', flexDirection: 'row' },
      shellInner: { flex: 1, width: '100%', maxWidth: 480 },
      shellInnerWide: { maxWidth: 720 },
      adSlot: { flex: 1, minWidth: 120, maxWidth: 300, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(254,250,224,0.02)', borderWidth: 1, borderColor: 'rgba(254,250,224,0.06)', borderStyle: 'dashed', margin: 12, borderRadius: 8 },
    });
  }
  return _styles;
}

export const styles = new Proxy({}, { get: (_, key) => getStyles()[key] });

const styles = StyleSheet.create({
  shellOuter: {
    flex: 1,
    width: '100%',
    backgroundColor: '#283618',

    // FIX: remove minHeight, remove justifyContent:center
    // Weben ez okozza a 0px magasságot
    // minHeight: '100%',
    // justifyContent: 'center',

    alignItems: 'stretch',
    flexDirection: 'row',
  },

  shellInner: {
    flex: 1,
    width: '100%',
    maxWidth: 480,

    // FIX: remove minHeight
    // minHeight: '100%',
  },

  shellInnerWide: {
    maxWidth: 720,
  },

  adSlot: {
    flex: 1,
    minWidth: 120,
    maxWidth: 300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(254,250,224,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.06)',
    borderStyle: 'dashed',
    margin: 12,
    borderRadius: 8,
  },
});
