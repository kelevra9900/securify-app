export * from './colors';
import {colors} from './colors';

import flex from './flex';
import margin from './margin';
import padding from './padding';
import commonStyle from './common';

export const styles = {
	...flex,
	...margin,
	...padding,
	...commonStyle,
	...colors,
}
