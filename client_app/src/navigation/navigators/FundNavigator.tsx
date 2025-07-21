import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FundScreen } from '../../screens/fund/FundScreen';
import { FundDetailContainer } from '../../screens/fund/FundDetailContainer';
import { FundBuyScreen } from '../../screens/fund/FundBuyScreen';
import { FundSellScreen } from '../../screens/fund/FundSellScreen';
import { FundStackParamList } from '../../types/navigation';

const FundStack = createNativeStackNavigator<FundStackParamList>();

export const FundNavigator = () => {
  return (
    <FundStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <FundStack.Screen name="FundList" component={FundScreen} />
      <FundStack.Screen name="FundDetail" component={FundDetailContainer} />
      <FundStack.Screen name="FundBuy" component={FundBuyScreen} />
      <FundStack.Screen name="FundSell" component={FundSellScreen} />
    </FundStack.Navigator>
  );
}; 