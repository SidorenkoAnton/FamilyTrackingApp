import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { IRefreshButton } from './RefreshButton-types';

const RefreshButton = ({handleClick}: IRefreshButton) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await handleClick();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <IconButton
        icon={() => 
          isLoading ? (
            <ActivityIndicator size={20} color="white" />
          ) : (
            <MaterialCommunityIcons name="refresh" size={24} color="white" />
          )
        }
        onPress={handleRefresh}
        disabled={isLoading}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 30,
  }
});

export default RefreshButton;