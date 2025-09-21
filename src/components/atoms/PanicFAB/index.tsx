import { MotiView } from 'moti';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { moderateScale } from '@/constants';

type Props = {
  onPress: () => void;
};

const SIZE = 70;
const WRAP = SIZE * 2;
const HALF = SIZE / 2; // para centrar los ripples en el wrapper

const PanicFAB = ({ onPress }: Props) => {
  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <MotiView
        animate={{ opacity: 0, scale: 2 }}
        from={{ opacity: 1, scale: 1 }}
        pointerEvents="none"
        style={styles.ripple}
        transition={{ duration: 1500, loop: true, type: 'timing' }}
      />

      <MotiView
        animate={{ opacity: 0, scale: 2.5 }}
        from={{ opacity: 1, scale: 1 }}
        pointerEvents="none"
        style={[styles.ripple, styles.rippleSecondary]}
        transition={{ delay: 500, duration: 2000, loop: true, type: 'timing' }}
      />

      <TouchableOpacity
        accessibilityLabel="Botón de emergencia SOS"
        accessibilityRole="button"
        activeOpacity={0.7}
        onPress={onPress}
        style={styles.button}
      >
        <Text style={styles.text}>S.O.S</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    bottom: moderateScale(70),
    height: WRAP,
    justifyContent: 'center',
    position: 'absolute',
    right: moderateScale(5),
    width: WRAP,
    zIndex: 100,
  },

  // El botón define el área presionable
  button: {
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 999,
    elevation: 8,
    height: SIZE,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    width: SIZE,
    zIndex: 2,
  },

  ripple: {
    backgroundColor: 'rgba(255, 59, 48, 0.6)',
    borderRadius: 999,
    height: SIZE,
    left: HALF,
    position: 'absolute',
    top: HALF,
    width: SIZE,
    zIndex: 0,
  },
  rippleSecondary: {
    backgroundColor: 'rgba(255, 59, 48, 0.5)',
  },

  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default PanicFAB;
