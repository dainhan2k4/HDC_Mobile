/**
 * Global Styles - CSS-like stylesheet system
 * Hệ thống stylesheet toàn cục giống CSS cho React Native
 */

import { StyleSheet } from 'react-native';
import { AppTheme } from './GlobalTheme';

// Global utility styles - giống CSS utilities
export const GlobalStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background.primary,
  },
  
  containerCentered: {
    flex: 1,
    backgroundColor: AppTheme.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  containerPadded: {
    flex: 1,
    backgroundColor: AppTheme.colors.background.primary,
    padding: AppTheme.spacing.md,
  },
  
  // Flexbox utilities
  flexRow: {
    flexDirection: 'row',
  },
  
  flexColumn: {
    flexDirection: 'column',
  },
  
  flexCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  flexBetween: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  flexStart: {
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  
  flexEnd: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  
  // Text styles
  textPrimary: {
    color: AppTheme.colors.text.primary,
    fontSize: AppTheme.typography.fontSize.base,
    fontWeight: AppTheme.typography.fontWeight.normal,
  },
  
  textSecondary: {
    color: AppTheme.colors.text.secondary,
    fontSize: AppTheme.typography.fontSize.sm,
    fontWeight: AppTheme.typography.fontWeight.normal,
  },
  
  textHeading: {
    color: AppTheme.colors.text.primary,
    fontSize: AppTheme.typography.fontSize['2xl'],
    fontWeight: AppTheme.typography.fontWeight.bold,
  },
  
  textSubheading: {
    color: AppTheme.colors.text.primary,
    fontSize: AppTheme.typography.fontSize.lg,
    fontWeight: AppTheme.typography.fontWeight.semibold,
  },
  
  textCaption: {
    color: AppTheme.colors.text.tertiary,
    fontSize: AppTheme.typography.fontSize.xs,
    fontWeight: AppTheme.typography.fontWeight.normal,
  },
  
  textCenter: {
    textAlign: 'center',
  },
  
  textLeft: {
    textAlign: 'left',
  },
  
  textRight: {
    textAlign: 'right',
  },
  
  // Button styles
  buttonPrimary: {
    ...AppTheme.components.button.primary,
  },
  
  buttonSecondary: {
    ...AppTheme.components.button.secondary,
  },
  
  buttonOutline: {
    ...AppTheme.components.button.outline,
  },
  
  buttonText: {
    color: AppTheme.colors.text.inverse,
    fontSize: AppTheme.typography.fontSize.base,
    fontWeight: AppTheme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
  
  buttonTextOutline: {
    color: AppTheme.colors.primary.main,
    fontSize: AppTheme.typography.fontSize.base,
    fontWeight: AppTheme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
  
  // Card styles
  card: {
    ...AppTheme.components.card.default,
  },
  
  cardElevated: {
    ...AppTheme.components.card.elevated,
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: AppTheme.spacing.sm,
  },
  
  cardTitle: {
    color: AppTheme.colors.text.primary,
    fontSize: AppTheme.typography.fontSize.lg,
    fontWeight: AppTheme.typography.fontWeight.semibold,
  },
  
  cardContent: {
    flex: 1,
  },
  
  // Input styles
  input: {
    ...AppTheme.components.input.default,
  },
  
  inputFocused: {
    ...AppTheme.components.input.default,
    ...AppTheme.components.input.focused,
  },
  
  inputLabel: {
    color: AppTheme.colors.text.secondary,
    fontSize: AppTheme.typography.fontSize.sm,
    fontWeight: AppTheme.typography.fontWeight.medium,
    marginBottom: AppTheme.spacing.xs,
  },
  
  inputError: {
    borderColor: AppTheme.colors.status.error,
  },
  
  inputErrorText: {
    color: AppTheme.colors.status.error,
    fontSize: AppTheme.typography.fontSize.xs,
    marginTop: AppTheme.spacing.xs,
  },
  
  // Spacing utilities
  marginXs: { margin: AppTheme.spacing.xs },
  marginSm: { margin: AppTheme.spacing.sm },
  marginMd: { margin: AppTheme.spacing.md },
  marginLg: { margin: AppTheme.spacing.lg },
  marginXl: { margin: AppTheme.spacing.xl },
  
  marginTopXs: { marginTop: AppTheme.spacing.xs },
  marginTopSm: { marginTop: AppTheme.spacing.sm },
  marginTopMd: { marginTop: AppTheme.spacing.md },
  marginTopLg: { marginTop: AppTheme.spacing.lg },
  marginTopXl: { marginTop: AppTheme.spacing.xl },
  
  marginBottomXs: { marginBottom: AppTheme.spacing.xs },
  marginBottomSm: { marginBottom: AppTheme.spacing.sm },
  marginBottomMd: { marginBottom: AppTheme.spacing.md },
  marginBottomLg: { marginBottom: AppTheme.spacing.lg },
  marginBottomXl: { marginBottom: AppTheme.spacing.xl },
  
  paddingXs: { padding: AppTheme.spacing.xs },
  paddingSm: { padding: AppTheme.spacing.sm },
  paddingMd: { padding: AppTheme.spacing.md },
  paddingLg: { padding: AppTheme.spacing.lg },
  paddingXl: { padding: AppTheme.spacing.xl },
  
  paddingHorizontalXs: { paddingHorizontal: AppTheme.spacing.xs },
  paddingHorizontalSm: { paddingHorizontal: AppTheme.spacing.sm },
  paddingHorizontalMd: { paddingHorizontal: AppTheme.spacing.md },
  paddingHorizontalLg: { paddingHorizontal: AppTheme.spacing.lg },
  paddingHorizontalXl: { paddingHorizontal: AppTheme.spacing.xl },
  
  paddingVerticalXs: { paddingVertical: AppTheme.spacing.xs },
  paddingVerticalSm: { paddingVertical: AppTheme.spacing.sm },
  paddingVerticalMd: { paddingVertical: AppTheme.spacing.md },
  paddingVerticalLg: { paddingVertical: AppTheme.spacing.lg },
  paddingVerticalXl: { paddingVertical: AppTheme.spacing.xl },
  
  // Border radius utilities
  roundedSm: { borderRadius: AppTheme.borderRadius.sm },
  roundedMd: { borderRadius: AppTheme.borderRadius.md },
  roundedLg: { borderRadius: AppTheme.borderRadius.lg },
  roundedXl: { borderRadius: AppTheme.borderRadius.xl },
  roundedFull: { borderRadius: AppTheme.borderRadius.full },
  
  // Shadow utilities
  shadowSm: { ...AppTheme.shadows.sm },
  shadowMd: { ...AppTheme.shadows.md },
  shadowLg: { ...AppTheme.shadows.lg },
  shadowXl: { ...AppTheme.shadows.xl },
  
  // Background colors
  bgPrimary: { backgroundColor: AppTheme.colors.primary.main },
  bgSecondary: { backgroundColor: AppTheme.colors.secondary.main },
  bgWhite: { backgroundColor: AppTheme.colors.background.primary },
  bgGray: { backgroundColor: AppTheme.colors.background.secondary },
  bgSuccess: { backgroundColor: AppTheme.colors.status.success },
  bgWarning: { backgroundColor: AppTheme.colors.status.warning },
  bgError: { backgroundColor: AppTheme.colors.status.error },
  bgInfo: { backgroundColor: AppTheme.colors.status.info },
  
  // Text colors
  textWhite: { color: AppTheme.colors.text.inverse },
  textSuccess: { color: AppTheme.colors.status.success },
  textWarning: { color: AppTheme.colors.status.warning },
  textError: { color: AppTheme.colors.status.error },
  textInfo: { color: AppTheme.colors.status.info },
  
  // Border utilities
  border: { borderWidth: 1, borderColor: AppTheme.colors.border.light },
  borderTop: { borderTopWidth: 1, borderTopColor: AppTheme.colors.border.light },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: AppTheme.colors.border.light },
  borderLeft: { borderLeftWidth: 1, borderLeftColor: AppTheme.colors.border.light },
  borderRight: { borderRightWidth: 1, borderRightColor: AppTheme.colors.border.light },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppTheme.colors.background.primary,
  },
  
  loadingText: {
    color: AppTheme.colors.text.secondary,
    fontSize: AppTheme.typography.fontSize.base,
    marginTop: AppTheme.spacing.md,
    textAlign: 'center',
  },
  
  // List styles
  listContainer: {
    flex: 1,
    backgroundColor: AppTheme.colors.background.secondary,
  },
  
  listItem: {
    backgroundColor: AppTheme.colors.background.card,
    marginHorizontal: AppTheme.spacing.md,
    marginVertical: AppTheme.spacing.xs,
    borderRadius: AppTheme.borderRadius.md,
    padding: AppTheme.spacing.md,
    ...AppTheme.shadows.sm,
  },
  
  listSeparator: {
    height: 1,
    backgroundColor: AppTheme.colors.border.light,
    marginHorizontal: AppTheme.spacing.md,
  },
  
  // Header styles
  header: {
    backgroundColor: AppTheme.colors.background.card,
    paddingHorizontal: AppTheme.spacing.md,
    paddingVertical: AppTheme.spacing.lg,
    ...AppTheme.shadows.sm,
  },
  
  headerTitle: {
    color: AppTheme.colors.text.primary,
    fontSize: AppTheme.typography.fontSize['2xl'],
    fontWeight: AppTheme.typography.fontWeight.bold,
    textAlign: 'center',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: AppTheme.colors.background.modal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContent: {
    backgroundColor: AppTheme.colors.background.card,
    borderRadius: AppTheme.borderRadius.lg,
    padding: AppTheme.spacing.lg,
    margin: AppTheme.spacing.md,
    maxWidth: '90%',
    ...AppTheme.shadows.lg,
  },
  
  // Badge styles
  badge: {
    backgroundColor: AppTheme.colors.primary.main,
    borderRadius: AppTheme.borderRadius.full,
    paddingHorizontal: AppTheme.spacing.sm,
    paddingVertical: AppTheme.spacing.xs,
    alignSelf: 'flex-start',
  },
  
  badgeText: {
    color: AppTheme.colors.text.inverse,
    fontSize: AppTheme.typography.fontSize.xs,
    fontWeight: AppTheme.typography.fontWeight.semibold,
  },
  
  badgeSuccess: {
    backgroundColor: AppTheme.colors.status.success,
  },
  
  badgeWarning: {
    backgroundColor: AppTheme.colors.status.warning,
  },
  
  badgeError: {
    backgroundColor: AppTheme.colors.status.error,
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: AppTheme.colors.border.light,
    marginVertical: AppTheme.spacing.sm,
  },
  
  dividerThick: {
    height: 2,
    backgroundColor: AppTheme.colors.border.medium,
    marginVertical: AppTheme.spacing.md,
  },
});

export default GlobalStyles;
