// App.tsx

// Define interfaces first
interface Location {
  lat: string;
  lng: string;
}

interface SatellitePass {
  startTime: string;
  endTime: string;
  maxElevation: number;
  duration: number;
  azimuthStart: number;
  azimuthEnd: number;
}

import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import * as Location from 'expo-location';

const App: React.FC = () => {
  const [location, setLocation] = useState<Location>({ lat: '', lng: '' });
  const [passes, setPasses] = useState<SatellitePass[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedSatellite] = useState<string>('25544'); // ISS by default

  const fetchPasses = async (): Promise<void> => {
    if (!location.lat || !location.lng) {
      Alert.alert('Error', 'Please enter location coordinates');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://18.223.188.210:3000/api/passes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          satelliteId: selectedSatellite,
          lat: location.lat,
          lng: location.lng
        })
      });
      const data = await response.json();
      setPasses(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch satellite passes');
      console.error(error);
    }
    setLoading(false);
  };

  const getUserLocation = async (): Promise<void> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      const userLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        lat: userLocation.coords.latitude.toFixed(4),
        lng: userLocation.coords.longitude.toFixed(4)
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
      console.error(error);
    }
  };

  const handleLocationChange = (field: keyof Location) => (text: string) => {
    setLocation(prev => ({
      ...prev,
      [field]: text
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>ISS Pass Predictor</Text>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Latitude</Text>
            <TextInput
              style={styles.input}
              value={location.lat}
              onChangeText={handleLocationChange('lat')}
              placeholder="Enter latitude"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Longitude</Text>
            <TextInput
              style={styles.input}
              value={location.lng}
              onChangeText={handleLocationChange('lng')}
              placeholder="Enter longitude"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={getUserLocation}
          >
            <Text style={styles.buttonText}>Get My Location</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, (!location.lat || !location.lng) && styles.buttonDisabled]}
            onPress={fetchPasses}
            disabled={!location.lat || !location.lng || loading}
          >
            <Text style={styles.buttonText}>Predict Passes</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />
        ) : (
          <View style={styles.passesContainer}>
            {passes.map((pass, index) => (
              <View key={index} style={styles.passCard}>
                <View style={styles.passRow}>
                  <View style={styles.passDetail}>
                    <Text style={styles.passLabel}>Rise Time</Text>
                    <Text style={styles.passText}>{new Date(pass.startTime).toLocaleString()}</Text>
                  </View>
                  <View style={styles.passDetail}>
                    <Text style={styles.passLabel}>Set Time</Text>
                    <Text style={styles.passText}>{new Date(pass.endTime).toLocaleString()}</Text>
                  </View>
                </View>
                <View style={styles.passRow}>
                  <View style={styles.passDetail}>
                    <Text style={styles.passLabel}>Max Elevation</Text>
                    <Text style={styles.passText}>{pass.maxElevation}°</Text>
                  </View>
                  <View style={styles.passDetail}>
                    <Text style={styles.passLabel}>Duration</Text>
                    <Text style={styles.passText}>{Math.round(pass.duration / 60)} minutes</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  inputContainer: {
    padding: 20,
  },
  inputWrapper: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    marginTop: 20,
  },
  passesContainer: {
    padding: 20,
  },
  passCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  passRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  passDetail: {
    flex: 1,
  },
  passLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  passText: {
    fontSize: 16,
    color: '#333',
  },
});

export default App;