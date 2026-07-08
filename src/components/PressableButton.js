// PressableButton — a redesign "nyomott gomb" mintája: a gomb alatt 5px-es
// sötét "talp" (borderBottom), lenyomáskor a gomb 3px-et süllyed rá.
// Minden CTA-nak bg + hozzá tartozó sötétebb shadowColor párja van (theme.js).
import React, { useRef } from 'react';
import { Animated, Platform, Pressable } from 'react-native';

// A web Animated modulja nem támogatja a native drivert, warningot dobna.
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

// containerStyle: a külső Pressable-re kerül — flex-elrendezési stílusok
// (flexBasis, width, stb.) ide valók, mert a style csak a belső nézetet formázza.
export default function PressableButton({
  onPress,
  style,
  containerStyle,
  shadowColor,
  disabled = false,
  children,
  ...pressableProps
}) {
  const translateY = useRef(new Animated.Value(0)).current;

  const pressIn = () =>
    Animated.timing(translateY, {
      toValue: 3,
      duration: 80,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();

  const pressOut = () =>
    Animated.timing(translateY, {
      toValue: 0,
      duration: 80,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();

  return (
    <Pressable
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={onPress}
      disabled={disabled}
      style={containerStyle}
      {...pressableProps}
    >
      <Animated.View
        style={[
          { transform: [{ translateY }] },
          { borderBottomWidth: 5, borderBottomColor: shadowColor },
          disabled && { opacity: 0.5 },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
