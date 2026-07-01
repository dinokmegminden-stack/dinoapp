import { useState, useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, View, StyleSheet, Easing } from 'react-native';

export default function LaserBorderButton({
  style,
  onPress,
  color = '#7CFC9A',
  duration = 2800,
  children,
  borderRadius = 14,
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [duration]);

  const { width, height } = size;
  const perimeter = Math.max(1, 2 * (width + height));
  const p1 = width / perimeter;
  const p2 = (width + height) / perimeter;
  const p3 = (2 * width + height) / perimeter;

  const dotX = progress.interpolate({
    inputRange: [0, p1, p2, p3, 1],
    outputRange: [0, width, width, 0, 0],
  });
  const dotY = progress.interpolate({
    inputRange: [0, p1, p2, p3, 1],
    outputRange: [0, 0, height, height, 0],
  });

  return (
    <TouchableOpacity
      style={style}
      activeOpacity={0.6}
      onPress={onPress}
      onLayout={(e) =>
        setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
      }
    >
      {children}
      <View
        pointerEvents="none"
        style={[styles.laserBorderTrack, { borderColor: `${color}33`, borderRadius }]}
      />
      {width > 0 && height > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.laserDot,
            {
              backgroundColor: color,
              shadowColor: color,
              transform: [
                { translateX: Animated.add(dotX, -7) },
                { translateY: Animated.add(dotY, -7) },
              ],
            },
          ]}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  laserBorderTrack: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderWidth: 1,
  },
  laserDot: {
    position: 'absolute',
    top: 0, left: 0,
    width: 14, height: 14,
    borderRadius: 7,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
});
