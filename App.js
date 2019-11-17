/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable no-alert */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';

import Constants from './services/Constants';

// import {PermissionsAndroid} from 'react-native';

import MapView from 'react-native-maps';
import {Marker} from 'react-native-maps';

import Icon from 'react-native-vector-icons/FontAwesome5';

import Geolocation from 'react-native-geolocation-service';
import KeepAwake from 'react-native-keep-awake';
import UserInactivity from 'react-native-user-inactivity';
import SystemSetting from 'react-native-system-setting';

import mqtt from 'mqtt/dist/mqtt';

console.disableYellowBox = true;

// async function requestGeolocationPermission() {
//   try {
//     const granted = await PermissionsAndroid.request(
//       PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//       {
//         title: 'Geolocation access request',
//         message:
//           'NoobRider needs access to your GPS ' +
//           'so you can take all features.',
//         buttonNeutral: 'Ask Me Later',
//         buttonNegative: 'Cancel',
//         buttonPositive: 'OK',
//       },
//     );
//     if (granted === PermissionsAndroid.RESULTS.GRANTED) {
//       console.log('You can use the GPS');
//       console.log(Constants.DIR_ICON_NAVIGATION);
//       return true;
//     } else {
//       console.log('GPS permission denied');
//       return false;
//     }
//   } catch (err) {
//     console.warn(err);
//   }
// }

const B = props => <Text style={{fontWeight: 'bold'}}>{props.children}</Text>;

export default class App extends React.Component {
  constructor(props) {
    super(props);

    KeepAwake.activate();

    this.state = {
      myGPS: {
        coord: {latitude: 10.8381656, longitude: 106.6302742},
        heading: 0,
        speed: 0,
      },
      isMqttConnected: false,
      isFollowUser: true,
    };
  }

  testMqtt() {
    // var mqtt = require('mqtt/dist/mqtt');
    this.mqttClient = mqtt.connect(Constants.URL_MQTT_CONNECTION); //WEBSOCKET ONLY

    this.mqttClient.on('connect', () => {
      this.setState({isMqttConnected: this.mqttClient.connected});
      // client.subscribe('presence', function(err) {
      //   if (!err) {
      //     // setInterval(() => client.publish('/hello', 'Hello mqtt'), 1000);
      //   } else
      //     alert(err);
      // });
    });

    this.mqttClient.on('offline', () => {
      this.setState({isMqttConnected: this.mqttClient.connected});
    });

    this.mqttClient.on('error', function(error) {
      alert(error);
    });

    this.mqttClient.on('message', function(topic, message) {
      // message is Buffer
      console.log(message.toString());
      // mqttClient.end();
    });
  }

  onMapReadyEvent = () => {
    if (requestGeolocationPermission()) {
      console.log('GPS is ready!');
      Geolocation.watchPosition(
        position => {
          console.log(position);
          this.setState({
            myGPS: {
              coord: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
              heading: position.coords.heading,
              speed:
                position.coords.speed && position.coords.speed > 0.83
                  ? (position.coords.speed * 3.6).toFixed(2)
                  : 0,
            },
          });

          if (this.mqttClient && this.mqttClient.connected) {
            this.mqttClient.publish('/test', JSON.stringify(this.state.myGPS), {
              qos: 0,
              retain: true,
            });
          }

          if (this.mapView) {
            if (this.state.isFollowUser) {
              let camera = {
                center: this.state.myGPS.coord,
                pitch: 0,
                heading: this.state.myGPS.heading,
                // Only on iOS MapKit, in meters. The property is ignored by Google Maps.
                altitude: 0,
                // Only when using Google Maps.
                // zoom: number
              };
              if (this.state.myGPS.speed < 5) {
                this.mapView.animateToCoordinate(this.state.myGPS.coord, 500);
              } else {
                this.mapView.animateCamera(camera, 500);
              }
            }
          }
        },
        error => {},
        {
          enableHighAccuracy: true,
          distanceFilter: 1,
          interval: 3000,
          fastestInterval: 2000,
          forceRequestLocation: true,
        },
      );
    }
  };

  connect2Mqtt() {
    this.testMqtt();
  }

  handleUserActivity(isActive) {
    if (!isActive) {
      // SystemSetting.grantWriteSettingPremission();
      SystemSetting.setBrightnessForce(0).then(success => {
        !success &&
          Alert.alert(
            'Permission request',
            'Please give me a permission changing settings pls!',
            [
              {
                text: 'Open Setting',
                onPress: () => SystemSetting.grantWriteSettingPremission(),
              },
            ],
          );
      });
      SystemSetting.saveBrightness();
    } else {
      SystemSetting.restoreBrightness();
    }
  }

  componentDidMount() {}

  render() {
    return (
      <UserInactivity
        timeForInactivity={100000}
        onAction={isActive => this.handleUserActivity(isActive)}>
        <View style={style.container}>
          <MapView
            style={style.map}
            initialRegion={{
              latitude: 10.8381656,
              longitude: 106.6302742,
              latitudeDelta: 0.0,
              longitudeDelta: 0.0,
            }}
            ref={ref => (this.mapView = ref)}
            onMapReady={this.onMapReadyEvent}
            loadingEnabled={true}>
            <Marker
              coordinate={this.state.myGPS.coord}
              image={require('./assets/icons/navigation.png')}
              rotation={this.state.myGPS.heading}
              flat={true}
              opacity={0.8}
              title="Your bike"
              description={'Winner 59G2-29876'}
            />
            <View style={style.switchArea}>
              <Text style={{bottom: -5}}>Auto-center</Text>
              <Switch
                style={style.trackSwitch}
                value={this.state.isFollowUser}
                onValueChange={value => this.setState({isFollowUser: value})}
              />
            </View>
          </MapView>
          <View style={style.toolbox}>
            <View style={style.toolView}>
              <View style={style.toolViewLeft}>
                <View style={style.speedView}>
                  <Text
                    style={[
                      style.statusText,
                      {fontSize: 50, fontWeight: 'bold'},
                    ]}>
                    {Math.round(this.state.myGPS.speed)}
                  </Text>
                  <Text style={[style.statusText, {fontSize: 12}]}>km/h</Text>
                </View>
                {this.state.isMqttConnected && (
                  <TouchableOpacity style={style.connectBtnDisabled} disabled>
                    <Text style={style.connectText}>Connected</Text>
                  </TouchableOpacity>
                )}
                {!this.state.isMqttConnected && (
                  <TouchableOpacity
                    style={style.connectBtn}
                    onPress={() => this.connect2Mqtt()}>
                    <Text style={style.connectText}>Connect now</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={[style.toolViewRight]}>
                <ScrollView style={[style.chatScrollView]}>
                  <Text style={style.chatText}>
                    <B>Thuan:</B> Follow me{'\n'}
                    <B>Tuan:</B> Follow me{'\n'}
                    <B>Thuan:</B> Follow me{'\n'}
                    <B>Tuan:</B> Follow me{'\n'}
                    <B>Thuan:</B> Follow me{'\n'}
                    <B>Tuan:</B> Follow me{'\n'}
                    <B>Thuan:</B> Follow me{'\n'}
                    <B>Tuan:</B> Follow me{'\n'}
                    <B>Thuan:</B> Follow me{'\n'}
                    <B>Tuan:</B> Follow me{'\n'}
                    <B>Thuan:</B> Follow me{'\n'}
                    <B>Tuan:</B> Follow me{'\n'}
                    <B>Thuan:</B> Follow me{'\n'}
                    <B>Tuan:</B> Follow me{'\n'}
                    <B>Thuan:</B> Follow me{'\n'}
                    <B>Tuan:</B> Follow me{'\n'}
                  </Text>
                </ScrollView>
                <View style={style.chatView}>
                  <TextInput style={style.chatInput} />
                  <TouchableOpacity style={style.chatBtn}>
                    <Icon
                      name="comment-alt"
                      color="white"
                      size={22}
                      style={this.sendButton}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </UserInactivity>
    );
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '80%',
    alignItems: 'flex-end',
  },
  toolbox: {
    width: '100%',
    height: '20%',
    // marginBottom: 0,
    // backgroundColor: 'yellow',
    justifyContent: 'center',
  },
  toolView: {
    width: '100%',
    height: '65%',
    justifyContent: 'center',
    flexDirection: 'row',
    flex: 1,
    // backgroundColor: 'rgba(255, 0, 0, 0.2)',
  },
  toolViewLeft: {
    height: '100%',
    width: '30%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolViewRight: {
    flex: 1,
    height: '100%',
    backgroundColor: '#DAEBF2',
    // flexDirection: 'column',
  },
  statusText: {
    // color: '#454955',
    fontSize: 35,
  },
  speedView: {
    width: '100%',
    height: '75%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#B39CD066',
  },
  connectBtn: {
    width: '100%',
    height: '25%',
    // bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    // alignSelf: 'flex-end',
    backgroundColor: '#845EC2CC',
    color: 'white',
  },
  connectBtnDisabled: {
    width: '100%',
    height: '25%',
    // bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#B0A8B9',
    color: 'white',
  },
  connectText: {
    color: '#EFF1F3',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchArea: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 150,
    height: 30,
    marginBottom: 5,
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  trackSwitch: {
    // position: 'absolute',
    // alignSelf: 'flex-end',
    // bottom: 0,
    // right: 0,
    // width: 60,
    // height: 30,
    // marginLeft: 10,
    // marginRight: 5,
    // marginBottom: 5,
  },
  chatScrollView: {
    //
  },
  chatText: {
    width: '100%',
    height: '100%',
    // marginVertical: 5,
    marginHorizontal: 5,
  },
  chatView: {
    width: '100%',
    height: '25%',
    bottom: 0,
    backgroundColor: '#3286A077',
    flexDirection: 'row',
  },
  chatInput: {
    // position: 'absolute',
    bottom: 0,
    height: '100%',
    flex: 1,
    // backgroundColor: 'yellow',
  },
  chatBtn: {
    width: 60,
    height: '100%',
    // backgroundColor: '#AA6073',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    //
  },
});