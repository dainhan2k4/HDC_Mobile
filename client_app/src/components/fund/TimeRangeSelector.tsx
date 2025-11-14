import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

type TimeRange = '1D' | '5D' | '1M' | '3M';

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 768;
const isSmallMobile = screenWidth < 400;

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
}) => {
  const ranges: { key: TimeRange; label: string; shortLabel: string }[] = [
    { key: '1D', label: '1 Ngày', shortLabel: '1D' },
    { key: '5D', label: '5 Ngày', shortLabel: '5D' },
    { key: '1M', label: '1 Tháng', shortLabel: '1M' },
    { key: '3M', label: '3 Tháng', shortLabel: '3M' },
  ];

  return (
    <View style={[
      styles.container,
      isMobile && styles.mobileContainer,
      isSmallMobile && styles.smallMobileContainer
    ]}>
      {ranges.map((range) => (
        <TouchableOpacity
          key={range.key}
          style={[
            styles.button,
            selectedRange === range.key && styles.buttonActive,
            isMobile && styles.mobileButton,
            isSmallMobile && styles.smallMobileButton
          ]}
          onPress={() => onRangeChange(range.key)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.text,
            selectedRange === range.key && styles.textActive,
            isMobile && styles.mobileText,
            isSmallMobile && styles.smallMobileText
          ]}>
            {isSmallMobile ? range.shortLabel : (isMobile ? range.shortLabel : range.label)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mobileContainer: {
    borderRadius: 8,
    padding: 3,
  },
  smallMobileContainer: {
    borderRadius: 6,
    padding: 2,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 1,
    minHeight: 36,
  },
  mobileButton: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
    minHeight: 32,
  },
  smallMobileButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 4,
    minHeight: 28,
  },
  buttonActive: {
    backgroundColor: '#2B4BFF',
    shadowColor: '#2B4BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  mobileText: {
    fontSize: 12,
    letterSpacing: 0.1,
  },
  smallMobileText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
}); 