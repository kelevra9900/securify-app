import type {TextStyle} from 'react-native';
import type {UnionConfiguration} from '@/assets/theme/types/config';
import type {FontColors,FontSizes} from '@/assets/theme/types/fonts';

import {config} from '@/assets/theme/_config';

export const generateFontColors = (configuration: UnionConfiguration) => {
  return Object.entries(configuration.fonts.colors ?? {}).reduce(
    (acc,[key,value]) => {
      return Object.assign(acc,{
        [`${key}`]: {
          color: value,
        },
      });
    },
    {} as FontColors,
  );
};

export const generateFontSizes = () => {
  return config.fonts.sizes.reduce((acc,size) => {
    return Object.assign(acc,{
      [`size_${size}`]: {
        fontSize: size,
      },
    });
  },{} as FontSizes);
};

export const staticFontStyles = {
  alignCenter: {
    textAlign: 'center',
  },
  bold: {
    fontWeight: 'bold',
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  medium: {
    fontWeight: '500',
  },
  regular: {
    fontWeight: 'normal',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
  // Declare name of font Montserrat
  montserrat: {
    fontFamily: 'Montserrat',
  },
} as const satisfies Record<string,TextStyle>;
