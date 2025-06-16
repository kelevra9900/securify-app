import {type ViewStyle} from 'react-native';

import type {UnionConfiguration} from '@/assets/theme/types/config';
import type {Gutters} from '@/assets/theme/types/gutters';

export const generateGutters = (configuration: UnionConfiguration): Gutters => {
  interface GutterStyle {
    gap?: number;
    margin?: number;
    marginBottom?: number;
    marginHorizontal?: number;
    marginLeft?: number;
    marginRight?: number;
    marginTop?: number;
    marginVertical?: number;
    padding?: number;
    paddingBottom?: number;
    paddingHorizontal?: number;
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingVertical?: number;
  }

  type GutterKey =
    | `gap_${number}`
    | `margin_${number}`
    | `marginBottom_${number}`
    | `marginHorizontal_${number}`
    | `marginLeft_${number}`
    | `marginRight_${number}`
    | `marginTop_${number}`
    | `marginVertical_${number}`
    | `padding_${number}`
    | `paddingBottom_${number}`
    | `paddingHorizontal_${number}`
    | `paddingLeft_${number}`
    | `paddingRight_${number}`
    | `paddingTop_${number}`
    | `paddingVertical_${number}`;

  type GuttersWithTypes = {
    [K in GutterKey]?: GutterStyle;
  };

  return configuration.gutters.reduce<GuttersWithTypes>((acc: GutterKey,curr: GutterKey) => {
    return Object.assign(acc,{
      [`gap_${curr}`]: {
        gap: curr,
      },
      [`margin_${curr}`]: {
        margin: curr,
      },
      [`marginBottom_${curr}`]: {
        marginBottom: curr,
      },
      [`marginHorizontal_${curr}`]: {
        marginHorizontal: curr,
      },
      [`marginLeft_${curr}`]: {
        marginLeft: curr,
      },
      [`marginRight_${curr}`]: {
        marginRight: curr,
      },
      [`marginTop_${curr}`]: {
        marginTop: curr,
      },
      [`marginVertical_${curr}`]: {
        marginVertical: curr,
      },
      [`padding_${curr}`]: {
        padding: curr,
      },
      [`paddingBottom_${curr}`]: {
        paddingBottom: curr,
      },
      [`paddingHorizontal_${curr}`]: {
        paddingHorizontal: curr,
      },
      [`paddingLeft_${curr}`]: {
        paddingLeft: curr,
      },
      [`paddingRight_${curr}`]: {
        paddingRight: curr,
      },
      [`paddingTop_${curr}`]: {
        paddingTop: curr,
      },
      [`paddingVertical_${curr}`]: {
        paddingVertical: curr,
      },
    });
  },{} as GuttersWithTypes);
};

export const staticGutterStyles = {} as const satisfies Record<
  string,
  ViewStyle
>;
