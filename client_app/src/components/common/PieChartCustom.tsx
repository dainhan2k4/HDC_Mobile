import React from 'react'
import { StyleSheet, ScrollView, Text, View } from 'react-native'
import PieChart from 'react-native-pie-chart'
import { Fund } from '@/types/fund';

type PieChartCustomProps = {
  data?: FundData[],
  sliceColor?: string[],
  title?: string,
  

}
type FundData = {
  name: string,
  value: number,
}

const PieChartCustom: React.FC<PieChartCustomProps> = ({
   data = [], sliceColor = [], title = '' }) => {
    const fundsData: FundData[] = data.map((value: FundData, index: number) => ({
      name: value.name,
      value: value.value
    }))

  const widthAndHeight = 250

  // Nếu không có dữ liệu thì hiển thị thông báo
  if (!data.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Không có dữ liệu để hiển thị biểu đồ</Text>
      </View>
      
    )
  }
  

  // Đảm bảo số lượng màu đủ cho số lượng data, nếu thiếu thì lặp lại màu cuối cùng
  const colors = data.map((_, idx) => sliceColor[idx] || sliceColor[sliceColor.length - 1] || '#000000')

  // Tính series kèm label phần trăm
  const total = data.reduce((a: number, b: FundData) => a + b.value, 0)
  const series = data.map((value: FundData, index: number) => {
    const percent = ((value.value / total) * 100).toFixed(1)
    return {
      value: value.value  ,
      color: colors[index],
      label: {
        text: `${percent}%`,
        fontSize: 12,
        fontWeight: 'bold',
        fill: '#fff',
      },
    }
  })

  return (
    <View style={styles.chartRow}>
      <View style={styles.chartContainer}> 
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <PieChart
          widthAndHeight={widthAndHeight}
          series={series}
          cover={0.45}
        />
         </View>
      <View style={styles.percentList}>
        {data.map((value: FundData, index: number ) => (
          <View key={index} style={styles.percentItem}>
            <View style={[styles.percentDot, { backgroundColor: colors[index] }]} />
            <Text style={styles.percentTextValue}>{fundsData[index].name}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  chartRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 10,
  },
  chartContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    margin: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
  },
  percentList: {
    marginTop: 20,
    alignItems: 'center',
    gap: 4,
  },
  percentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  percentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000',
  },
  percentText: {
    fontSize: 16,
  },
  percentTextValue: {
    fontSize: 14,
    fontWeight: '500',
    paddingLeft: 10,
    paddingRight: 10, 
  },
})

export default PieChartCustom