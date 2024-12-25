import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import App from '../../App';

// Mock the expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: {
      latitude: 37.7749,
      longitude: -122.4194
    }
  })
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Satellite Tracker App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Component Rendering Tests
  describe('UI Elements', () => {
    it('should render location input fields', () => {
      const { getByPlaceholderText } = render(<App />);
      
      expect(getByPlaceholderText('Enter latitude')).toBeTruthy();
      expect(getByPlaceholderText('Enter longitude')).toBeTruthy();
    });

    it('should render action buttons', () => {
      const { getByText } = render(<App />);
      
      expect(getByText('Get My Location')).toBeTruthy();
      expect(getByText('Predict Passes')).toBeTruthy();
    });
  });

  // User Interaction Tests
  describe('User Interactions', () => {
    it('should handle manual coordinate input', () => {
      const { getByPlaceholderText } = render(<App />);
      
      const latInput = getByPlaceholderText('Enter latitude');
      const lngInput = getByPlaceholderText('Enter longitude');

      fireEvent.changeText(latInput, '37.7749');
      fireEvent.changeText(lngInput, '-122.4194');

      expect(latInput.props.value).toBe('37.7749');
      expect(lngInput.props.value).toBe('-122.4194');
    });

    it('should handle invalid coordinate input', () => {
      const { getByPlaceholderText, getByText } = render(<App />);
      
      const latInput = getByPlaceholderText('Enter latitude');
      fireEvent.changeText(latInput, '91'); // Invalid latitude

      const predictButton = getByText('Predict Passes');
      fireEvent.press(predictButton);

      // Verify error handling
      expect(Alert.alert).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('Invalid coordinates')
      );
    });
  });

  // API Integration Tests
  describe('API Integration', () => {
    it('should fetch passes successfully', async () => {
      const mockPasses = [{
        startTime: '2024-12-04 00:15:56',
        endTime: '2024-12-04 00:22:56',
        maxElevation: 77,
        azimuthStart: 230,
        azimuthEnd: 50,
        duration: 7
      }];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPasses
      });

      const { getByText, findByText } = render(<App />);
      
      // Trigger pass prediction
      const predictButton = getByText('Predict Passes');
      fireEvent.press(predictButton);

      // Wait for and verify results
      await waitFor(() => {
        expect(findByText('77°')).toBeTruthy();
        expect(findByText('7 minutes')).toBeTruthy();
      });
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const { getByText } = render(<App />);
      
      const predictButton = getByText('Predict Passes');
      fireEvent.press(predictButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('Failed to fetch passes')
        );
      });
    });
  });

  // Location Services Tests
  describe('Location Services', () => {
    it('should get current location successfully', async () => {
      const { getByText } = render(<App />);
      
      const locationButton = getByText('Get My Location');
      fireEvent.press(locationButton);

      await waitFor(() => {
        expect(getByText('37.7749')).toBeTruthy();
        expect(getByText('-122.4194')).toBeTruthy();
      });
    });

    it('should handle location permission denial', async () => {
      jest.requireMock('expo-location').requestForegroundPermissionsAsync
        .mockResolvedValueOnce({ status: 'denied' });

      const { getByText } = render(<App />);
      
      const locationButton = getByText('Get My Location');
      fireEvent.press(locationButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Permission denied',
          'Location permission is required'
        );
      });
    });
  });
});