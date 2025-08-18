import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../utils/constants';

const Button = ({ 
  title, 
  onPress, 
  style, 
  textStyle, 
  disabled = false, 
  loading = false,
  variant = 'primary', // 'primary', 'secondary', 'danger', 'success', 'outline'
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];
    
    if (disabled) {
      baseStyle.push(styles.disabled);
    } else {
      switch (variant) {
        case 'primary':
          baseStyle.push(styles.primary);
          break;
        case 'secondary':
          baseStyle.push(styles.secondary);
          break;
        case 'danger':
          baseStyle.push(styles.danger);
          break;
        case 'success':
          baseStyle.push(styles.success);
          break;
        case 'outline':
          baseStyle.push(styles.outline);
          break;
        default:
          baseStyle.push(styles.primary);
      }
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseTextStyle = [styles.text, styles[`${size}Text`]];
    
    if (disabled) {
      baseTextStyle.push(styles.disabledText);
    } else if (variant === 'outline') {
      baseTextStyle.push(styles.outlineText);
    }
    
    return baseTextStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' ? COLORS.primary : COLORS.white} 
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // Tailles
  small: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 48,
  },
  large: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minHeight: 56,
  },
  
  // Variantes
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
  },
  danger: {
    backgroundColor: COLORS.danger,
  },
  success: {
    backgroundColor: COLORS.success,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  
  // États
  disabled: {
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.lightGray,
  },
  
  // Textes
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  outlineText: {
    color: COLORS.primary,
  },
  disabledText: {
    color: COLORS.gray,
  },
});

export default Button; 