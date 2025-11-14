import React, { useState, useEffect } from 'react';
import {View, Text, ActivityIndicator, Dimensions} from 'react-native';
import {LineChart} from 'react-native-gifted-charts';
import { apiService } from '../../config/apiService';

type TimeRange = '1D' | '5D' | '1M' | '3M';

interface CandlestickChartProps {
  timeRange?: TimeRange;
  fundId?: number;
}

interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ChartData {
  labels: string[];
  candles: CandlestickData[];
}

const { width: screenWidth } = Dimensions.get('window');

const CandlestickChart: React.FC<CandlestickChartProps> = ({ 
  timeRange = '1D',
  fundId
}) => {
  const [chartData, setChartData] = useState(null as ChartData | null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock candlestick data - sẽ thay bằng API call
  const getMockCandlestickData = (range: TimeRange): ChartData => {
    const mockData: { [key: string]: ChartData } = {
      '1D': {
        labels: ['03:00', '03:10', '03:30', '03:45', '04:00', '04:15'],
        candles: [
          { time: '03:00', open: 95600, high: 96800, low: 95200, close: 96200 },
          { time: '03:10', open: 96200, high: 97400, low: 95800, close: 97000 },
          { time: '03:30', open: 97000, high: 97800, low: 96600, close: 97600 },
          { time: '03:45', open: 97600, high: 98400, low: 97200, close: 98000 },
          { time: '04:00', open: 98000, high: 98600, low: 97800, close: 98200 },
          { time: '04:15', open: 98200, high: 98800, low: 98000, close: 98100 },
        ]
      },
      '5D': {
        labels: ['T2', 'T3', 'T4', 'T5', 'T6'],
        candles: [
          { time: 'T2', open: 95000, high: 97000, low: 94000, close: 96000 },
          { time: 'T3', open: 96000, high: 98000, low: 95500, close: 97500 },
          { time: 'T4', open: 97500, high: 99000, low: 97000, close: 98500 },
          { time: 'T5', open: 98500, high: 99500, low: 98000, close: 99000 },
          { time: 'T6', open: 99000, high: 100000, low: 98500, close: 98100 },
        ]
      },
      '1M': {
        labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
        candles: [
          { time: 'Tuần 1', open: 90000, high: 95000, low: 88000, close: 93000 },
          { time: 'Tuần 2', open: 93000, high: 97000, low: 92000, close: 96000 },
          { time: 'Tuần 3', open: 96000, high: 99000, low: 95000, close: 98000 },
          { time: 'Tuần 4', open: 98000, high: 100000, low: 97000, close: 98100 },
        ]
      },
      '3M': {
        labels: ['Tháng 1', 'Tháng 2', 'Tháng 3'],
        candles: [
          { time: 'Tháng 1', open: 85000, high: 92000, low: 80000, close: 90000 },
          { time: 'Tháng 2', open: 90000, high: 97000, low: 88000, close: 95000 },
          { time: 'Tháng 3', open: 95000, high: 100000, low: 93000, close: 98100 },
        ]
      }
    };
    return mockData[range] || mockData['1D'];
  };

  useEffect(() => {
    const loadChartData = async () => {
      if (!fundId) {
        setChartData(getMockCandlestickData(timeRange));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Gọi API để lấy OHLC data từ Odoo
        console.log(`📊 [CandlestickChart] Loading OHLC for fundId: ${fundId}, timeRange: ${timeRange}`);
        const response = await apiService.getFundOHLC(fundId, timeRange);
        console.log('📊 [CandlestickChart] API response:', {
          success: response.success,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
        });
        
        const data = response.data as any;
        if (response.success && data && data.candles && Array.isArray(data.candles) && data.candles.length > 0) {
          console.log(`✅ [CandlestickChart] Got ${data.candles.length} candles from API`);
          // Transform API data to chart format
          const chartData = {
            labels: data.labels || data.candles.map((c: any) => c.time || c.timestamp || ''),
            candles: data.candles
          };
          console.log('📊 [CandlestickChart] Chart data:', {
            labelsCount: chartData.labels.length,
            candlesCount: chartData.candles.length,
            firstCandle: chartData.candles[0]
          });
          setChartData(chartData);
        } else {
          // Fallback to mock data if API returns empty
          console.warn('⚠️ [CandlestickChart] No OHLC data from API, using mock data. Response:', {
            success: response.success,
            hasCandles: !!(data && data.candles),
            candlesLength: data && data.candles ? data.candles.length : 0
          });
          setChartData(getMockCandlestickData(timeRange));
        }
      } catch (error) {
        console.error('❌ [CandlestickChart] Failed to load OHLC data:', error);
        // Fallback to mock data on error
        setChartData(getMockCandlestickData(timeRange));
      } finally {
        setIsLoading(false);
      }
    };

    loadChartData();
  }, [fundId, timeRange]);

  if (isLoading || !chartData) {
    return (
      <View style={{ paddingVertical: 15, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', minHeight: 250 }}>
        <ActivityIndicator size="large" color="#2B4BFF" />
        <Text style={{ marginTop: 10, color: '#6C757D' }}>Đang tải biểu đồ...</Text>
      </View>
    );
  }

  // Kiểm tra xem có dữ liệu không
  if (!chartData.candles || chartData.candles.length === 0) {
    return (
      <View style={{ paddingVertical: 15, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', minHeight: 250, backgroundColor: '#1E293B', borderRadius: 8, marginTop: 10 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 14, marginBottom: 10 }}>Biểu đồ biến động ({timeRange})</Text>
        <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Không có dữ liệu để hiển thị</Text>
      </View>
    );
  }

  // Tính toán min/max để scale chart
  const allValues = chartData.candles.flatMap(c => [c.high, c.low, c.open, c.close]);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue;
  const padding = range * 0.1 || 1000; // Fallback nếu range = 0

  // Helper function để parse time và kiểm tra xem có phải giờ chẵn không (09:00, 10:00, 11:00, ...)
  const isHourlyLabel = (timeStr: string, index: number, totalLength: number): boolean => {
    if (!timeStr) return false;
    
    // Luôn hiển thị label đầu tiên và cuối cùng
    if (index === 0 || index === totalLength - 1) {
      return true;
    }
    
    // Nếu là format HH:MM hoặc HH:MM:SS
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const minutes = parseInt(timeMatch[2], 10);
      // Chỉ hiển thị label nếu là giờ chẵn (minutes = 0)
      return minutes === 0;
    }
    
    // Nếu là date string (YYYY-MM-DD), hiển thị mỗi ngày
    if (timeStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Hiển thị mỗi ngày hoặc mỗi vài ngày tùy vào số lượng
      return index % Math.max(1, Math.floor(totalLength / 7)) === 0;
    }
    
    // Fallback: hiển thị mỗi giờ (giả sử mỗi data point cách nhau 1 phút)
    // Tính toán dựa trên index - giả sử có 60 data points mỗi giờ
    return index % 60 === 0;
  };

  // Convert candlestick data to line chart format (tạm thời dùng line chart)
  // TODO: Implement actual candlestick rendering
  const lineData = chartData.candles.map((candle, index) => {
    const label = chartData.labels && chartData.labels[index] 
      ? chartData.labels[index] 
      : candle.time || `T${index + 1}`;
    
    // Đảm bảo value là số hợp lệ
    const closeValue = parseFloat(candle.close) || 0;
    if (closeValue === 0) {
      console.warn(`⚠️ [CandlestickChart] Invalid close value at index ${index}:`, candle);
    }
    
    // Chỉ hiển thị label nếu cách nhau 1 giờ
    const shouldShowLabel = isHourlyLabel(label, index, chartData.candles.length);
    
    return {
      value: closeValue / 1000, // Convert to thousands
      label: shouldShowLabel ? label : undefined, // undefined để không hiển thị label
      labelTextStyle: {color: '#9CA3AF', width: 60, fontSize: 10},
    };
  }).filter(item => item.value > 0); // Filter out invalid values

  // Đếm số labels được hiển thị
  const visibleLabels = lineData.filter(d => d.label !== undefined);
  
  console.log('📊 [CandlestickChart] Rendering with:', {
    candlesCount: chartData.candles.length,
    lineDataCount: lineData.length,
    visibleLabelsCount: visibleLabels.length,
    visibleLabels: visibleLabels.map(d => d.label).slice(0, 10),
    minValue: minValue / 1000,
    maxValue: maxValue / 1000,
    firstCandle: chartData.candles[0],
    firstLineData: lineData[0],
    lastLineData: lineData[lineData.length - 1],
    allValues: lineData.map(d => d.value).slice(0, 5)
  });
  
  // Đảm bảo có dữ liệu hợp lệ
  if (lineData.length === 0) {
    console.error('❌ [CandlestickChart] No valid line data after filtering!');
    return (
      <View style={{ paddingVertical: 15, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', minHeight: 250, backgroundColor: '#1E293B', borderRadius: 8, marginTop: 10 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 14, marginBottom: 10 }}>Biểu đồ biến động ({timeRange})</Text>
        <Text style={{ color: '#EF4444', fontSize: 12 }}>Lỗi: Không có dữ liệu hợp lệ để vẽ biểu đồ</Text>
      </View>
    );
  }

  return (
    <View style={{ paddingVertical: 15, paddingHorizontal: 5, backgroundColor: '#1E293B', borderRadius: 8, marginTop: 10 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: 10, textAlign: 'center' }}>
        Biểu đồ biến động ({timeRange})
      </Text>
      
      {/* Hiển thị giá Last */}
      <View style={{ alignItems: 'flex-end', marginBottom: 10, paddingRight: 10 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 12 }}>Last</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
          {chartData.candles[chartData.candles.length - 1]?.close.toLocaleString('vi-VN')}₫
        </Text>
      </View>

      <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        {lineData.length > 0 ? (
          <LineChart
            areaChart
            data={lineData}
            width={screenWidth * 0.85}
            height={200}
            color="#10B981"
            thickness={2}
            startFillColor="rgba(16, 185, 129, 0.2)"
            endFillColor="rgba(16, 185, 129, 0.05)"
            startOpacity={0.8}
            endOpacity={0.1}
            initialSpacing={0}
            noOfSections={5}
            stepHeight={40}
            maxValue={(maxValue + padding) / 1000}
            yAxisColor="transparent"
            yAxisThickness={0}
            rulesType="solid"
            rulesColor="#374151"
            yAxisTextStyle={{color: '#9CA3AF', fontSize: 10}}
            yAxisLabelPrefix=""
            yAxisLabelSuffix="k₫"
            xAxisColor="#9CA3AF"
            xAxisThickness={1}
            xAxisLabelTextStyle={{color: '#9CA3AF', fontSize: 10, width: 60}}
            rotateLabel={false}
            dataPointsColor="#10B981"
            dataPointsRadius={3}
            hideDataPoints={false}
            spacing={Math.max(20, (screenWidth * 0.85) / lineData.length)}
            backgroundColor="transparent"
            curved={false}
            isAnimated={true}
            animationDuration={800}
            showVerticalLines={false}
          />
        ) : (
          <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Không có dữ liệu để vẽ biểu đồ</Text>
        )}
      </View>
      
      {/* Hiển thị thông tin giá */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#374151' }}>
        <View>
          <Text style={{ color: '#9CA3AF', fontSize: 10 }}>Open</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 12 }}>
            {chartData.candles[chartData.candles.length - 1]?.open.toLocaleString('vi-VN')}₫
          </Text>
        </View>
        <View>
          <Text style={{ color: '#9CA3AF', fontSize: 10 }}>High</Text>
          <Text style={{ color: '#EF4444', fontSize: 12 }}>
            {chartData.candles[chartData.candles.length - 1]?.high.toLocaleString('vi-VN')}₫
          </Text>
        </View>
        <View>
          <Text style={{ color: '#9CA3AF', fontSize: 10 }}>Low</Text>
          <Text style={{ color: '#EF4444', fontSize: 12 }}>
            {chartData.candles[chartData.candles.length - 1]?.low.toLocaleString('vi-VN')}₫
          </Text>
        </View>
        <View>
          <Text style={{ color: '#9CA3AF', fontSize: 10 }}>Close</Text>
          <Text style={{ color: '#10B981', fontSize: 12 }}>
            {chartData.candles[chartData.candles.length - 1]?.close.toLocaleString('vi-VN')}₫
          </Text>
        </View>
      </View>
    </View>
  );
};

export default CandlestickChart;

