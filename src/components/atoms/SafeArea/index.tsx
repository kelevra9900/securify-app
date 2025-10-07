import React from 'react';
import type {StyleProp,ViewStyle} from 'react-native';
import {StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';


type Props = {
  children: React.ReactNode;
  edges?: ('bottom' | 'left' | 'right' | 'top')[];
  style?: StyleProp<ViewStyle>;
};

const CSafeAreaView = ({children,edges = ['top','bottom'],style = {}}: Props) => {
  return (
    <SafeAreaView edges={edges} style={[localStyles.root,style]}>
      {children}
    </SafeAreaView>
  );
};

export default CSafeAreaView;

const localStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
