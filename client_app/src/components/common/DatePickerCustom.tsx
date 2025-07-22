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

  return (
    <View>
        <View style={styles.dateTextContainer}>
            <Text style={styles.dateText}>{startDateText} </Text>
        </View>

        <DateTimePicker
          value={date}
          mode="date"
          display={'default'}
          textColor={GlobalStyles.textPrimary.color}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          style={{ backgroundColor: 'transparent', 
            width: '100%', borderRadius: 10,
            height: 40,
            padding: 0,
            margin: 0,
            }}
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      
    </View>
  );
};

const styles = StyleSheet.create({
    dateText: {
        fontSize: 16,
        fontWeight: '400',
        color: GlobalStyles.textPrimary.color,
        textAlign: 'center',
    },
    dateTextContainer: {
        width: '100%',
        backgroundColor: 'transparent',
        paddingLeft: 10,
        
    },
});

export default DatePickerCustom;
