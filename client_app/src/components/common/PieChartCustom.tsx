import formatVND from '../../hooks/formatCurrency';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PieChart from 'react-native-pie-chart';

interface PieChartCustomProps {
  data: { name: string; value: number }[];
  sliceColor: string[];
  title?: string;
}

export const PieChartCustom: React.FC<PieChartCustomProps> = ({ data, sliceColor, title }) => {
  // Kiểm tra nếu không có dữ liệu hoặc tất cả giá trị đều là 0
  if (!data || data.length === 0 || data.every(item => item.value === 0)) {
    return (
      <View style={styles.container}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>Không có dữ liệu</Text>
        </View>
      </View>
    );
  }
  
  // Chuyển đổi dữ liệu sang định dạng mới của react-native-pie-chart v4
  const series = data.map((item, index) => ({
    value: item.value,
    color: sliceColor[index % sliceColor.length],
    label: { 
      text: `${((item.value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(0)}%`,
      fontSize: 12,
      fontWeight: '600', // Changed from 'semibold' to '600' for Android compatibility
      fill: '#fff',
      stroke: '#000',
      strokeWidth: 0.5
    }
  }));
  
  // Tính tổng giá trị
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={styles.chartContainer}>
        {/* Biểu đồ tròn */}
        <PieChart
          widthAndHeight={200}
          series={series}
          cover={0.3} // Tạo lỗ ở giữa (dạng donut)
          style={styles.chart}
        />
      </View>
      
      {/* Chú thích */}
      <View style={styles.legendContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.colorIndicator, { backgroundColor: sliceColor[index % sliceColor.length] }]} />
            <Text style={styles.legendText}>
              {item.name}: {formatVND(item.value)} ({((item.value / totalValue) * 100).toFixed(1)}%)
            </Text>
          </View>
        ))}
      </View> 
      
      <Text style={styles.totalText}>Tổng: {formatVND(totalValue)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  chart: {
    margin: 10,
  },
  legendContainer: {
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'right',
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#6C757D',
  },
}); 