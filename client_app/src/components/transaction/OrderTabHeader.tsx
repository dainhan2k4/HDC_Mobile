import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DatePickerCustom from '../common/DatePickerCustom';

type TabType = 'buy' | 'sell' | 'history';

interface OrderTabHeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  buyOrdersCount: number;
  sellOrdersCount: number;
  historyCount: number;
  onRefresh: () => void;
  loading: boolean;
  refreshing: boolean;
  fromDate: Date;
  toDate: Date;
  onDateFilterChange: (from: Date, to: Date) => void;
}

const OrderTabHeader: React.FC<OrderTabHeaderProps> = ({
  activeTab,
  setActiveTab,
  buyOrdersCount,
  sellOrdersCount,
  historyCount,
  onRefresh,
  loading,
  refreshing,
  
  onDateFilterChange,
}) => {
    const [fromDate, setFromDate] = useState<Date>(new Date());
    const [toDate, setToDate] = useState<Date>(new Date());

 const handleFromDateChange = (date: Date) => {
    setFromDate(date);
    onDateFilterChange(date, toDate);
 }
 const handleToDateChange = (date: Date) => {
    setToDate(date);
    onDateFilterChange(fromDate, date);
 }

  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Quản lý lệnh</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={loading || refreshing}
        >
          <Ionicons
            name="refresh"
            size={20}
            color={loading || refreshing ? "#CCCCCC" : "#007BFF"}
          />
        </TouchableOpacity>
      </View>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'buy' && styles.activeTab]}
          onPress={() => setActiveTab('buy')}
        >
          <Text style={[styles.tabText, activeTab === 'buy' && styles.activeTabText]}>
            Lệnh mua ({buyOrdersCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sell' && styles.activeTab]}
          onPress={() => setActiveTab('sell')}
        >
          <Text style={[styles.tabText, activeTab === 'sell' && styles.activeTabText]}>
            Lệnh bán ({sellOrdersCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            Lịch sử ({historyCount})
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.datePickerContainer}>
        <DatePickerCustom
          startDateText='Ngày bắt đầu'
          minimumDate={new Date(2025, 0, 0)}
          date={fromDate}
          setDate={handleFromDateChange}
        />
        <DatePickerCustom
          startDateText='Ngày kết thúc'
          minimumDate={new Date(2025, 0, 0)}
          date={toDate}
          setDate={handleToDateChange}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007BFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  datePickerContainer: {
    margin: 0,
    padding: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
    
  },
});

export default OrderTabHeader; 