import React from 'react';
import {View, Text} from 'react-native';
import {LineChart, ruleTypes} from 'react-native-gifted-charts';

type TimeRange = '1M' | '3M' | '6M' | '1Y';

interface ScrollingChartWithPointerProps {
  timeRange?: TimeRange;
}

const ScrollingChartWithPointer: React.FC<ScrollingChartWithPointerProps> = ({ 
  timeRange = '1M' 
}) => {
  // Data tương tự như trong Odoo fund_widget.js
  const getNavDataByRange = (range: TimeRange) => {
    const navDataByRange = {
      '1M': {
        labels: ['01-06', '03-06', '05-06', '07-06', '09-06', '11-06', '13-06', '15-06', '18-06', '22-06'],
        values: [16500, 16800, 16200, 17000, 16000, 15800, 17200, 15600, 18500, 19678]
      },
      '3M': {
        labels: ['01-04', '08-04', '15-04', '22-04', '29-04', '06-05', '13-05', '20-05', '01-06', '22-06'],
        values: [19500, 18800, 19200, 18000, 17500, 18200, 17800, 17100, 18800, 20678]
      },
      '6M': {
        labels: ['01-01', '15-01', '01-02', '15-02', '01-03', '15-03', '01-04', '01-05', '01-06', '22-06'],
        values: [21000, 20000, 19000, 19800, 18000, 18500, 17500, 16000, 22500, 21678]
      },
      '1Y': {
        labels: ['06-2024', '08-2024', '10-2024', '12-2024', '01-2025', '02-2025', '03-2025', '04-2025', '05-2025', '06-2025'],
        values: [28000, 25000, 26500, 23000, 22500, 21000, 20500, 19000, 17000, 15678]
      }
    };
    return navDataByRange[range];
  };

  const chartData = getNavDataByRange(timeRange);
  
  // Convert to LineChart format
  const ptData = chartData.labels.map((label, index) => ({
    value: chartData.values[index] / 1000, // Convert to thousands for better display
    date: label,
    label: index % 3 === 0 ? label : undefined, // Show every third label
    labelTextStyle: {color: '#6C757D', width: 50, fontSize: 10},
  }));
  return (
    <View
      style={{
        paddingVertical: 15,
        paddingHorizontal: 5,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginTop: 10,
        alignItems: 'center',
      }}>
      <Text style={{
        fontSize: 14,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 10,
        textAlign: 'center'
      }}>
        NAV/Unit ({timeRange === '1M' ? '1 Tháng' : timeRange === '3M' ? '3 Tháng' : timeRange === '6M' ? '6 Tháng' : '1 Năm'})
      </Text>
      <LineChart
        areaChart
        
        data={ptData}
        rotateLabel
        width={320}
        hideDataPoints={false}
        spacing={25}
        color="#2B4BFF"
        thickness={3}
        startFillColor="rgba(43,75,255,0.2)"
        endFillColor="rgba(43,75,255,0.05)"
        startOpacity={0.8}
        endOpacity={0.1}
        initialSpacing={0}
        noOfSections={5}
        stepHeight={40}
        height={250}
        maxValue={Math.max(...ptData.map(d => d.value)) + 5}
        yAxisColor="transparent"
        yAxisThickness={0}
        rulesType={ruleTypes.SOLID}
        rulesColor="#E9ECEF"
        yAxisTextStyle={{color: '#6C757D'}}
        yAxisLabelPrefix=""
        yAxisLabelSuffix="k₫"
        yAxisTextNumberOfLines={1}
        xAxisColor="#E9ECEF"
        dataPointsColor="#2B4BFF"
        dataPointsRadius={4}
        pointerConfig={{
          pointerStripUptoDataPoint: true,
          pointerStripColor: '#2B4BFF',
          pointerStripWidth: 2,
          pointerColor: '#2B4BFF',
          
          radius: 6,
          pointerLabelWidth: 120,
          pointerLabelHeight: 20,
          shiftPointerLabelY: 0,
          pointerLabelComponent: (items: any) => {
            return (
              <View style={{paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#2B4BFF', borderRadius: 8}}>
                <Text style={{color: '#fff', fontSize: 12, fontWeight: '600'}}>{items[0].date}</Text>
              </View>
            );
          },
          pointerComponent: (item: any) => {
            return (
              <View style={{paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#2B4BFF'}}>
                <Text style={{fontWeight: 'bold', color: '#2B4BFF'}}>{(item.value * 1000).toLocaleString('vi-VN')}₫</Text>
              </View>
            );
          },
        }}
      />
    </View>
  );
};

export default ScrollingChartWithPointer;
export type { TimeRange, ScrollingChartWithPointerProps };