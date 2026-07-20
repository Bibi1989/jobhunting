import { StyleSheet } from '@react-pdf/renderer'
import { colors as tokenColors, pagePadding as tokenPadding, styles as tokenStyles } from '~/shared/pdf/tokens'

/** @deprecated Prefer importing from ~/shared/pdf/tokens */
export const pagePadding = tokenPadding
export const colors = tokenColors
export const baseStyles = StyleSheet.create(tokenStyles as any)
