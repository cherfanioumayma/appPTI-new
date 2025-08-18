import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  style,
  inputStyle,
  onBlur,
  onFocus,
  leftIcon,
  rightIcon,
  onRightIconPress,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus && onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur && onBlur();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getInputStyle = () => {
    const baseStyle = [styles.input];
    
    if (isFocused) {
      baseStyle.push(styles.inputFocused);
    }
    
    if (error) {
      baseStyle.push(styles.inputError);
    }
    
    if (disabled) {
      baseStyle.push(styles.inputDisabled);
    }
    
    if (multiline) {
      baseStyle.push(styles.inputMultiline);
    }
    
    return baseStyle;
  };

  const renderLeftIcon = () => {
    if (leftIcon) {
      return (
        <View style={styles.leftIcon}>
          <Ionicons name={leftIcon} size={20} color={COLORS.gray} />
        </View>
      );
    }
    return null;
  };

  const renderRightIcon = () => {
    if (secureTextEntry) {
      return (
        <TouchableOpacity style={styles.rightIcon} onPress={togglePasswordVisibility}>
          <Ionicons 
            name={showPassword ? 'eye-off' : 'eye'} 
            size={20} 
            color={COLORS.gray} 
          />
        </TouchableOpacity>
      );
    }
    
    if (rightIcon) {
      return (
        <TouchableOpacity 
          style={styles.rightIcon} 
          onPress={onRightIconPress}
          disabled={!onRightIconPress}
        >
          <Ionicons name={rightIcon} size={20} color={COLORS.gray} />
        </TouchableOpacity>
      );
    }
    
    return null;
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, error && styles.labelError]}>
          {label}
        </Text>
      )}
      
      <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
        {renderLeftIcon()}
        
        <TextInput
          style={[getInputStyle(), inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {renderRightIcon()}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.dark,
    marginBottom: 8,
  },
  
  labelError: {
    color: COLORS.danger,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
  },
  
  inputContainerFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.dark,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  
  inputFocused: {
    // Styles spécifiques pour l'état focus
  },
  
  inputError: {
    borderColor: COLORS.danger,
  },
  
  inputDisabled: {
    backgroundColor: COLORS.lightGray,
    color: COLORS.gray,
  },
  
  inputMultiline: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  
  leftIcon: {
    marginRight: 8,
  },
  
  rightIcon: {
    marginLeft: 8,
    padding: 4,
  },
  
  errorText: {
    fontSize: 14,
    color: COLORS.danger,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default Input; 