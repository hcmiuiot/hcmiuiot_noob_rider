import {PermissionsAndroid} from 'react-native';

export async function requestGeolocationPermission() {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Geolocation access request',
        message:
          'NoobRider needs access to your GPS ' +
          'so you can take all features.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    } else {
      console.log('GPS permission denied');
      return false;
    }
  } catch (err) {
    console.warn(err);
  }
}
