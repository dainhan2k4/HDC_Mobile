import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type TimeRange = '1M' | '3M' | '6M' | '1Y';

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
}) => {
  const ranges: { key: TimeRange; label: string }[] = [
    { key: '1M', label: '1 Tháng' },
    { key: '3M', label: '3 Tháng' },
    { key: '6M', label: '6 Tháng' },
    { key: '1Y', label: '1 Năm' },
  ];

  return (
    <View style={styles.container}>
      {ranges.map((range) => (
        <TouchableOpacity
          key={range.key}
          style={[
            styles.button,
            selectedRange === range.key && styles.buttonActive
          ]}
          onPress={() => onRangeChange(range.key)}
        >
          <Text style={[
            styles.text,
            selectedRange === range.key && styles.textActive
          ]}>
            {range.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  buttonActive: {
    backgroundColor: '#2B4BFF',
  },
  text: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
  },
  textActive: {
    color: '#FFFFFF',
  },
}); 