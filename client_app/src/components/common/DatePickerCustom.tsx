import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import GlobalStyles from '@/styles/GlobalStyles';

interface DatePickerCustomProps {
  minimumDate?: Date;
  maximumDate?: Date;
  date: Date;
  setDate: (date: Date) => void;
  startDateText: string;
}

const DatePickerCustom: React.FC<DatePickerCustomProps> = ({
  date,
  setDate,
  minimumDate,
  maximumDate,
  startDateText,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // Trên Android, dismiss picker khi user chọn hoặc cancel
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    // Chỉ update date nếu user chọn (không phải cancel)
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
      // Trên iOS, dismiss sau khi chọn
      if (Platform.OS === 'ios') {
        setShowPicker(false);
      }
    } else if (event.type === 'dismissed') {
      // User cancel
      setShowPicker(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.dateText}>{startDateText}</Text>
      
      <TouchableOpacity 
        style={styles.dateButton}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.dateValue}>{formatDate(date)}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          textColor={GlobalStyles.textPrimary.color}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    dateText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666666',
        marginBottom: 4,
    },
    dateButton: {
        backgroundColor: '#F8F9FA',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    dateValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333333',
    },
});

export default DatePickerCustom;
