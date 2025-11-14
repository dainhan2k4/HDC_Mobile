import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { apiService } from '../../config/apiService';

type TimeRange = '1D' | '5D' | '1M' | '3M';

interface ComparisonLineChartProps {
  fundIds: number[];
  timeRange?: TimeRange;
  funds?: Array<{ id: number; name: string; ticker: string; color?: string }>;
}

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 768;

// Màu sắc cho các đường line chart
const CHART_COLORS = [
  '#2B4BFF', // Blue
  '#10B981', // Green
  '#EF4444', // Red
  '#F59E0B', // Orange
  '#8B5CF6', // Purple
];

export const ComparisonLineChart: React.FC<ComparisonLineChartProps> = ({
  fundIds,
  timeRange = '1D',
  funds = [],
}) => {
  const [chartData, setChartData] = useState<Array<{ data: any[]; color: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    const loadComparisonData = async () => {
      if (fundIds.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        console.log(`📊 [Comparison] Loading comparison data for ${fundIds.length} funds, timeRange: ${timeRange}`);
        
        // Load OHLC data cho từng fund (dùng OHLC thay vì chart để có dữ liệu chính xác hơn)
        const promises = fundIds.map(async (fundId, index) => {
          try {
            console.log(`📊 [Comparison] Loading OHLC for fund ${fundId}...`);
            const response = await apiService.getFundOHLC(fundId, timeRange);
            
            if (response.success && response.data) {
              const data = response.data as any;
              const fund = funds.find(f => f.id === fundId) || { name: `Fund ${fundId}`, ticker: `F${fundId}` };
              
              // Transform OHLC candles thành line chart data (dùng close price)
              const candles = data.candles || [];
              const labels = data.labels || candles.map((c: any) => c.time || '');
              
              if (candles.length === 0) {
                console.warn(`⚠️ [Comparison] No candles for fund ${fundId}`);
                return null;
              }
              
              const lineData = candles.map((candle: any, idx: number) => {
                const closeValue = parseFloat(candle.close) || 0;
                if (closeValue === 0 || isNaN(closeValue)) {
                  console.warn(`⚠️ [Comparison] Invalid close value for fund ${fundId} at index ${idx}:`, candle);
                  return null;
                }
                
                return {
                  value: closeValue / 1000, // Convert to thousands
                  label: idx % Math.max(1, Math.floor(candles.length / 5)) === 0 ? (labels[idx] || '') : undefined,
                };
              }).filter((item: any) => item !== null && !isNaN(item.value));
              
              if (lineData.length === 0) {
                console.warn(`⚠️ [Comparison] No valid line data for fund ${fundId}`);
                return null;
              }
              
              console.log(`✅ [Comparison] Loaded ${lineData.length} data points for fund ${fundId} (${fund.ticker || fund.name})`);
              
              return {
                data: lineData,
                color: fund.color || CHART_COLORS[index % CHART_COLORS.length],
                name: fund.ticker || fund.name,
                labels: labels,
              };
            } else {
              console.warn(`⚠️ [Comparison] No data in response for fund ${fundId}`);
              return null;
            }
          } catch (error) {
            console.error(`❌ [Comparison] Failed to load OHLC for fund ${fundId}:`, error);
            return null;
          }
        });

        const results = await Promise.all(promises);
        const validResults = results.filter(r => r !== null) as Array<{
          data: any[];
          color: string;
          name: string;
          labels: string[];
        }>;

        if (validResults.length > 0) {
          // Lấy labels từ fund đầu tiên
          setLabels(validResults[0].labels);
          setChartData(validResults);
        }
      } catch (error) {
        console.error('❌ [Comparison] Failed to load comparison data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadComparisonData();
  }, [fundIds, timeRange, funds]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2B4BFF" />
        <Text style={styles.loadingText}>Đang tải dữ liệu so sánh...</Text>
      </View>
    );
  }

  if (chartData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Không có dữ liệu để so sánh</Text>
      </View>
    );
  }

  // Tính toán min/max để scale chart
  const allValues = chartData.flatMap(cd => cd.data.map(d => d.value).filter(v => !isNaN(v) && isFinite(v)));
  
  if (allValues.length === 0) {
    console.error('❌ [Comparison] No valid values for chart');
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Không có dữ liệu hợp lệ để so sánh</Text>
      </View>
    );
  }
  
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue;
  const padding = range * 0.1 || 1; // Fallback nếu range = 0
  
  console.log('📊 [Comparison] Chart scale:', {
    minValue,
    maxValue,
    range,
    padding,
    dataPointsCount: chartData.reduce((sum, cd) => sum + cd.data.length, 0)
  });

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isMobile && styles.mobileTitle]}>
        So sánh hiệu suất ({timeRange})
      </Text>

      {/* Legend */}
      <View style={styles.legendContainer}>
        {chartData.map((cd, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: cd.color }]} />
            <Text style={[styles.legendText, isMobile && styles.mobileLegendText]}>
              {cd.name}
            </Text>
          </View>
        ))}
      </View>

      {/* Multi-line Chart - Render nhiều LineChart chồng lên nhau */}
      <View style={styles.chartWrapper}>
        {chartData.map((cd, index) => (
          <View 
            key={index} 
            style={[
              styles.chartLayer,
              index > 0 && styles.chartLayerOverlay
            ]}
          >
            <LineChart
              data={cd.data}
              width={screenWidth * (isMobile ? 0.85 : 0.7)}
              height={250}
              color={cd.color}
              thickness={2}
              startFillColor="transparent"
              endFillColor="transparent"
              startOpacity={1}
              endOpacity={1}
              initialSpacing={0}
              noOfSections={5}
              stepHeight={40}
              maxValue={maxValue + padding}
              yAxisColor="transparent"
              yAxisThickness={0}
              rulesType="solid"
              rulesColor={index === 0 ? "#E9ECEF" : "transparent"} // Chỉ hiển thị grid cho layer đầu
              yAxisTextStyle={{ color: index === 0 ? '#6C757D' : 'transparent', fontSize: 10 }}
              yAxisLabelPrefix=""
              yAxisLabelSuffix={index === 0 ? "k₫" : ""}
              xAxisColor={index === 0 ? "#E9ECEF" : "transparent"}
              xAxisLabelTextStyle={{ color: '#6C757D', fontSize: 10 }}
              dataPointsColor={cd.color}
              dataPointsRadius={3}
              hideDataPoints={index > 0} // Chỉ hiển thị data points cho line đầu tiên
              spacing={Math.max(20, (screenWidth * (isMobile ? 0.85 : 0.7)) / cd.data.length)}
              backgroundColor="transparent"
              areaChart={false}
              curved={false}
              isAnimated
              animationDuration={800}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  mobileTitle: {
    fontSize: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  mobileLegendText: {
    fontSize: 12,
  },
  chartWrapper: {
    alignItems: 'center',
    position: 'relative',
    height: 250,
  },
  chartLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  chartLayerOverlay: {
    backgroundColor: 'transparent',
  },
});

