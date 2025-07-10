import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import formatVND from '../../hooks/formatCurrency';
import { Fund } from '../../types/fund';

interface FundListItemProps {
  fund: Fund;
  isSelected: boolean;
  onPress: (fund: Fund) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 768;
const isSmallMobile = screenWidth < 400;

// Helper function for compact mobile currency formatting
const formatCompactVND = (amount: number): string => {
  if (amount === undefined || amount === null) return '0₫';
  if (typeof amount !== 'number') return '0₫';
  
  if (Math.abs(amount) >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}B₫`;
  } else if (Math.abs(amount) >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M₫`;
  } else if (Math.abs(amount) >= 1000) {
    return `${(amount / 1000).toFixed(1)}K₫`;
  } else {
    return `${amount.toFixed(0)}₫`;
  }
};

export const FundListItem: React.FC<FundListItemProps> = ({
  fund,
  isSelected,
  onPress,
}) => {
  const hasInvestment = fund.total_units > 0;
  
  return (
    <TouchableOpacity
      style={[
        styles.container, 
        isSelected && styles.selected,
        hasInvestment && styles.hasInvestment,
        isMobile && styles.mobileContainer,
        isSmallMobile && styles.smallMobileContainer
      ]}
      onPress={() => onPress(fund)}
      activeOpacity={0.8}
    >
      <View style={[styles.content, isMobile && styles.mobileContent]}>
        {/* Fund Name and Ticker */}
        <View style={[styles.headerRow, isMobile && styles.mobileHeaderRow]}>
          <View style={styles.nameContainer}>
            <Text 
              style={[
                styles.name, 
                isSelected && styles.selectedText,
                isMobile && styles.mobileName,
                isSmallMobile && styles.smallMobileName
              ]} 
              numberOfLines={isMobile ? 1 : 2}
            >
              {fund.name}
            </Text>
            <Text style={[
              styles.ticker, 
              isSelected && styles.selectedTicker,
              isMobile && styles.mobileTicker
            ]}>
              {fund.ticker}
            </Text>
          </View>
          
          {/* Badges - Only show on larger screens or when selected */}
          {(!isMobile || isSelected) && (
            <View style={styles.badgeContainer}>
              {fund.is_shariah && (
                <View style={[styles.shariahBadge, isMobile && styles.mobileBadge]}>
                  <Text style={[styles.shariahText, isMobile && styles.mobileBadgeText]}>
                    {isSmallMobile ? 'S' : 'Shariah'}
                  </Text>
                </View>
              )}
              {hasInvestment && (
                <View style={[styles.investmentBadge, isMobile && styles.mobileBadge]}>
                  <Text style={[styles.investmentBadgeText, isMobile && styles.mobileBadgeText]}>
                    {isSmallMobile ? '●' : 'Đã đầu tư'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* NAV and Performance */}
        <View style={[styles.valueRow, isMobile && styles.mobileValueRow]}>
          <View style={styles.navContainer}>
            {!isSmallMobile && (
              <Text style={[styles.navLabel, isMobile && styles.mobileNavLabel]}>
                NAV hiện tại
              </Text>
            )}
            <Text style={[
              styles.navValue, 
              isSelected && styles.selectedValue,
              isMobile && styles.mobileNavValue,
              isSmallMobile && styles.smallMobileNavValue
                         ]}>
               {isMobile ? formatCompactVND(fund.current_nav) : formatVND(fund.current_nav)}
             </Text>
          </View>
          
          {/* Performance indicator - Only on non-small mobile */}
          {!isSmallMobile && fund.previous_nav && fund.current_nav !== fund.previous_nav && (
            <View style={styles.performanceContainer}>
              {fund.current_nav > fund.previous_nav ? (
                <View style={[styles.performancePositive, isMobile && styles.mobilePerformance]}>
                  <Text style={[styles.performanceText, isMobile && styles.mobilePerformanceText]}>↗</Text>
                </View>
              ) : (
                <View style={[styles.performanceNegative, isMobile && styles.mobilePerformance]}>
                  <Text style={[styles.performanceText, isMobile && styles.mobilePerformanceText]}>↘</Text>
                </View>
              )}
            </View>
          )}
        </View>
        
        {/* Investment Info - Compact for mobile */}
        {hasInvestment && (
          <View style={[
            styles.investmentInfo,
            isMobile && styles.mobileInvestmentInfo,
            isSmallMobile && styles.smallMobileInvestmentInfo
          ]}>
            {isMobile ? (
              // Compact mobile layout
              <View style={styles.compactInvestmentRow}>
                <Text style={[
                  styles.compactLabel,
                  isSelected && styles.selectedSecondaryText
                ]}>
                  {fund.total_units.toFixed(1)} đơn vị
                </Text>
                <Text style={[
                  styles.compactProfitLoss,
                  isSelected && styles.selectedSecondaryText,
                  { 
                    color: isSelected 
                      ? 'rgba(255, 255, 255, 0.9)' 
                      : fund.profit_loss >= 0 ? '#10B981' : '#EF4444' 
                  }
                                 ]}>
                   {fund.profit_loss >= 0 ? '+' : ''}{formatCompactVND(fund.profit_loss)}
                 </Text>
              </View>
            ) : (
              // Full desktop layout
              <>
                <View style={styles.investmentRow}>
                  <Text style={[styles.investmentLabel, isSelected && styles.selectedSecondaryText]}>
                    Sở hữu:
                  </Text>
                  <Text style={[styles.investmentValue, isSelected && styles.selectedSecondaryText]}>
                    {fund.total_units.toFixed(2)} đơn vị
                  </Text>
                </View>
                <View style={styles.investmentRow}>
                  <Text style={[styles.investmentLabel, 
                    isSelected && styles.selectedSecondaryText]}>
                    Lãi/Lỗ:
                  </Text>
                  <Text style={[
                    styles.profitLossText,
                    isSelected && styles.selectedSecondaryText,
                    { 
                      color: isSelected 
                        ? 'rgba(255, 255, 255, 0.9)' 
                        : fund.profit_loss >= 0 ? '#10B981' : '#EF4444' 
                    }
                  ]}>
                    {fund.profit_loss >= 0 ? '+' : ''}{formatVND(fund.profit_loss)}
                     ({fund.profit_loss_percentage.toFixed(2)}%)
                  </Text>
                </View>
              </>
            )}
          </View>
        )}
      </View>
      
      {/* Selection Indicator */}
      {isSelected && <View style={[styles.selectionIndicator, isMobile && styles.mobileSelectionIndicator]} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  mobileContainer: {
    marginBottom: 8,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  smallMobileContainer: {
    marginBottom: 6,
    borderRadius: 8,
  },
  selected: {
    backgroundColor: '#2B4BFF',
    borderColor: '#1E40AF',
    shadowColor: '#2B4BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  hasInvestment: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  content: {
    padding: 16,
  },
  mobileContent: {
    padding: 10,
  },
  
  // Header Row
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mobileHeaderRow: {
    marginBottom: 8,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  mobileName: {
    fontSize: 14,
    lineHeight: 16,
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  smallMobileName: {
    fontSize: 13,
    lineHeight: 15,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  ticker: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  mobileTicker: {
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  selectedTicker: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  // Badge Container
  badgeContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  shariahBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mobileBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  shariahText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  investmentBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  investmentBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mobileBadgeText: {
    fontSize: 8,
    letterSpacing: 0.3,
  },
  
  // Value Row
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mobileValueRow: {
    marginBottom: 6,
  },
  navContainer: {
    flex: 1,
  },
  navLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  mobileNavLabel: {
    fontSize: 10,
    marginBottom: 1,
  },
  navValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2B4BFF',
    letterSpacing: 0.3,
  },
  mobileNavValue: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  smallMobileNavValue: {
    fontSize: 12,
  },
  selectedValue: {
    color: '#FFFFFF',
  },
  
  // Performance Indicator
  performanceContainer: {
    marginLeft: 8,
  },
  performancePositive: {
    backgroundColor: '#DCFCE7',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  performanceNegative: {
    backgroundColor: '#FEE2E2',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobilePerformance: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  performanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  mobilePerformanceText: {
    fontSize: 12,
  },
  
  // Investment Info
  investmentInfo: {
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  mobileInvestmentInfo: {
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
  },
  smallMobileInvestmentInfo: {
    padding: 6,
    marginTop: 4,
  },
  investmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  investmentLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  selectedSecondaryText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  investmentValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  profitLossText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  
  // Compact Mobile Investment Layout
  compactInvestmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  compactProfitLoss: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  
  // Selection Indicator
  selectionIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#FFFFFF',
  },
  mobileSelectionIndicator: {
    width: 3,
  },
}); 