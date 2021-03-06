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
  StatusBar,
  StyleSheet,
  // TextInput,
  TouchableOpacity,
  // ScrollView,
  View,
  ToastAndroid,
  Image,
  Alert,
  Text,
} from 'react-native';

import update from 'immutability-helper';

import DeviceInfo from 'react-native-device-info';

import Geolocation from 'react-native-geolocation-service';
import KeepAwake from 'react-native-keep-awake';
import MapView, {Marker, Callout} from 'react-native-maps';
// import Proximity from 'react-native-proximity';
// import Icon from 'react-native-vector-icons/FontAwesome5';
import ChatBox from './components/ChatBox';
import ConfigScreeen from './screens/ConfigScreen';
import Constants from './services/Constants';
import MqttService from './services/MqttService';
import {requestGeolocationPermission} from './services/Permission';
import Storage from './services/Storage';
import ToolBox from './components/ToolBox';
import Sound from './services/Sound';

import haversine from 'haversine-distance';

console.disableYellowBox = true;

export default class App extends React.Component {
  constructor(props) {
    super(props);

    console.log('=============================================');

    KeepAwake.activate();

    this.state = {
      myGPS: {
        coord: {latitude: 10.8381656, longitude: 106.6302742},
        heading: 0,
        speed: 0,
      },
      isMqttConnected: false,
      isFollowUser: true,
      showConfigScreen: false,
      phoneId: DeviceInfo.getUniqueId(),
      user: {bikeName: 'unknown', riderName: 'unknown'},
      teammates: [],
      marks: [],
      testSpeed: 90,
      msg: '',
    };

    // let b = 0;
    // setInterval(() => {
    //   if (this.state.myGPS) {
    //     this.setState({testSpeed: this.state.testSpeed + 1});
    //     // if (this.a) this.a.redraw();
    //   }
    // }, 1000);

    console.log('Phone ID:', this.state.phoneId);
    this.loadConfigAndConnect(true);
  }

  cautionPolice() {
    let polices = this.state.marks.filter(mark => {
      // console.log(mark.markType);
      return mark.markType === 'police';
    });

    polices.map(police => {
      let ourGps = {
        lat: this.state.myGPS.coord.latitude,
        lon: this.state.myGPS.coord.longitude,
      };
      let copGps = {lat: police.coord.latitude, lon: police.coord.longitude};
      let distance = haversine(ourGps, copGps);

      if (distance <= Constants.POLICE_CAUTION_DISTANCE) {
        this.setState({
          msg: `Carefully nearby POLICE! (${(distance / 1000).toFixed(1)} km)`,
        });
      }
    });
  }

  findTeammateIndexByPhoneId(phoneId) {
    return this.state.teammates.findIndex(teammate => {
      return teammate.phoneId === phoneId;
    });
  }

  findGpsIndexByPhoneId(phoneId) {
    return this.state.gps.findIndex(gps => {
      return gps.phoneId === phoneId;
    });
  }

  handleGps(phoneId, msg) {
    if (msg.timestamp && Date.now() - msg.timestamp <= Constants.MAX_AGE) {
      let foundIdx = this.findTeammateIndexByPhoneId(phoneId);
      let newGpsPacket = {phoneId, ...msg};
      if (foundIdx === -1) {
        this.setState({
          teammates: update(this.state.teammates, {$push: [newGpsPacket]}),
        });
      } else {
        this.setState({
          teammates: update(this.state.teammates, {
            [foundIdx]: {$set: newGpsPacket},
          }),
        });
      }

      this.setState({
        teammates: this.state.teammates.filter(teammate => {
          return Date.now() - teammate.timestamp <= Constants.MAX_AGE;
        }),
      });
      // console.log(
      //   'this.state.teammates',
      //   JSON.stringify(this.state.teammates, null, 2),
      // );
    }
  }

  handleMark(phoneId, msg) {
    if (msg.timestamp && Date.now() - msg.timestamp <= Constants.MAX_MARK_AGE) {
      let newMarkPacket = {phoneId, ...msg};
      switch (newMarkPacket.markType) {
        case 'police': {
          Sound.play(Sound.CORTADO);
          break;
        }
        case 'accident': {
          Sound.play(Sound.OH_HELL_NO);
          break;
        }
        case 'petro': {
          Sound.play(Sound.SELFIE);
          break;
        }
      }
      // console.log(newMarkPacket);

      this.setState({
        marks: update(this.state.marks, {$push: [newMarkPacket]}),
      });
    }
  }

  handleChat(phoneId, msg) {
    if (this.chatBox) {
      let isMyMsg = phoneId === this.state.phoneId;
      let senderName = isMyMsg ? 'You' : msg.from;
      let unixTime = msg.timestamp;
      this.chatBox.addNewChatBadge(senderName, msg.msg, !isMyMsg, unixTime);
    }
  }

  handleIncomingMqtt = (topic, msg, packet) => {
    const topicSegs = topic.split('/');
    const incomingMsg = JSON.parse(msg.toString());
    let type = topicSegs[1];
    let phoneId = topicSegs[2];

    switch (type) {
      case 'gps': {
        // console.log('[GPS]', topic, incomingMsg);
        this.handleGps(phoneId, incomingMsg);
        break;
      }
      case 'chat': {
        // console.log('[CHAT]', topic, incomingMsg);
        this.handleChat(phoneId, incomingMsg);
        break;
      }
      case 'mark': {
        // console.log('[MARK]', topic, incomingMsg);
        this.handleMark(phoneId, incomingMsg);
        break;
      }
    }
  };

  try2SendGps() {
    if (this.mqttService && this.mqttService.isConnected()) {
      // this.noticeIamOnline();
      console.log('Trying 2 send GPS');

      this.mqttService.publish(
        Constants.PATTERN_TOPIC_GPS(this.state.phoneId),
        JSON.stringify({
          timestamp: Date.now(),
          user: this.state.user,
          ...this.state.myGPS,
        }),
        () => {
          console.log('Send GPS ok!');
        },
        {qos: 1, retain: true},
      );
    }
  }

  try2SendMark(markType) {
    if (this.mqttService && this.mqttService.isConnected()) {
      // this.noticeIamOnline();
      console.log('Trying 2 send Mark');

      this.mqttService.publish(
        Constants.PATTERN_TOPIC_MARK(this.state.phoneId + Date.now()),
        JSON.stringify({
          timestamp: Date.now(),
          markType,
          ...this.state.myGPS,
        }),
        () => {
          console.log('Send Mark ok!');
        },
        {qos: 1, retain: true},
      );
    }
  }

  try2SendChat(from, msg) {
    if (this.mqttService && this.mqttService.isConnected()) {
      console.log('Trying 2 send Chat');
      const sendMsg = {timestamp: Date.now(), from, msg};
      this.mqttService.publish(
        Constants.PATTERN_TOPIC_CHAT(this.state.phoneId),
        JSON.stringify(sendMsg),
        () => {
          console.log('Send CHAT ok!');
        },
        {qos: 1, retain: true},
      );
    }
  }

  onChatSend = msg => {
    if (this.state.user.riderName) {
      this.try2SendChat(this.state.user.riderName, msg);
    }
  };

  centerMap(force = false) {
    this.cautionPolice();
    if (this.mapView) {
      if (force || this.state.isFollowUser) {
        let camera = {
          center: this.state.myGPS.coord,
          pitch: this.mapView.getCamera().pitch,
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
      // this.mapView.fitToElements(true);
    }
  }

  onMapReadyEvent = () => {
    if (requestGeolocationPermission()) {
      Geolocation.watchPosition(
        async position => {
          await this.setState({
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

          this.cautionPolice();
          this.try2SendGps();
          this.centerMap();
        },
        error => {},
        {
          enableHighAccuracy: true,
          distanceFilter: 3,
          interval: 3000,
          fastestInterval: 2000,
          forceRequestLocation: true,
        },
      );
    }
  };

  connect2Mqtt() {
    if (this.mqttService) {
      this.mqttService.mqttClient.end();
    }
    this.mqttService = new MqttService();

    this.mqttService.connect(Constants.URL_MQTT_CONNECTION, () => {
      this.mqttService.registerCallback('error', err => {
        console.log('MQTT Error', err);
      });

      this.setState({isMqttConnected: true});
      ToastAndroid.showWithGravity(
        'Welcome',
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );

      this.mqttService.registerCallback('offline', () =>
        this.setState({isMqttConnected: false}),
      );

      this.mqttService.registerCallback('message', this.handleIncomingMqtt);

      console.log('MQTT connected successfully!');

      this.subscribeTopics();
    });
  }

  subscribeTopics() {
    if (this.mqttService && this.mqttService.isConnected()) {
      this.mqttService.subscribe(
        [
          Constants.PATTERN_TOPIC_MARK('+'),
          Constants.PATTERN_TOPIC_CHAT('+'),
          Constants.PATTERN_TOPIC_GPS('+'),
        ],
        (err, granted) => {
          if (!err) {
            granted.map(grant => {
              console.log(
                `Successfully subscribe to "${grant.topic}" qos:${grant.qos}`,
              );
            });
          } else {
            console.error(err);
          }
        },
        {qos: 1},
      );
    }
  }

  unsubscribeTopics() {
    if (this.mqttService) {
      this.mqttService.unsubscribe(
        [Constants.PATTERN_TOPIC_CHAT('+'), Constants.PATTERN_TOPIC_GPS('+')],
        err => {
          if (err) {
            console.error(err);
          }
        },
      );
    }
  }

  loadConfigAndConnect(showHelloNoti = false) {
    const helloAlert = showHelloNoti
      ? () =>
          Alert.alert(
            'Hi!',
            "Let's tap the Settings icon on the top left and connect to teammates now :)",
            [{text: 'Got it!'}],
            {
              cancelable: true,
            },
          )
      : false;
    Storage.readConfigs(configs => {
      this.setState({
        user: {riderName: configs.riderName, bikeName: configs.bikeName},
      });
      this.connect2Mqtt();
    }, helloAlert);
  }

  componentWillUnmount() {
    this.unsubscribeTopics();
  }

  render() {
    return (
      <View style={style.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={
            this.state.isMqttConnected ? 'transparent' : '#ed156822'
          }
          translucent
        />
        <View style={style.mapView}>
          <MapView
            style={[StyleSheet.absoluteFillObject]}
            initialRegion={{
              latitude: 10.8777063,
              longitude: 106.8006299,
              latitudeDelta: 0.03,
              longitudeDelta: 0.02,
            }}
            ref={ref => {
              this.mapView = ref;
            }}
            onMapReady={this.onMapReadyEvent}
            loadingEnabled={true}
            // showsTraffic={true}
            showsCompass={false}>
            {Constants.SETTING_SHOW_CAUTION &&
              this.state.marks.map(
                mark =>
                  mark.coord && (
                    <Marker
                      coordinate={mark.coord}
                      image={
                        mark.markType === 'police'
                          ? require('./assets/icons/police-officer.png')
                          : mark.markType === 'petro'
                          ? require('./assets/icons/petro.png')
                          : require('./assets/icons/car-accident2.png')
                      }
                      rotation={mark.heading}
                      // flat={true}
                      opacity={0.9}
                      // title={mark.user.riderName}
                    />
                  ),
              )}

            {/* {Constants.SETTING_SHOW_TEAMMATE &&
              this.state.teammates.map(
                teammate =>
                  teammate.phoneId !== this.state.phoneId &&
                  teammate.coord && (
                    <Marker
                      coordinate={teammate.coord}
                      // rotation={teammate.heading}
                      // flat={true}
                      opacity={0.9}
                    />
                  ),
              )} */}

            {Constants.SETTING_SHOW_TEAMMATE &&
              this.state.teammates.map(
                teammate =>
                  teammate.phoneId !== this.state.phoneId &&
                  teammate.coord && (
                    <Marker
                      coordinate={teammate.coord}
                      // rotation={teammate.heading}
                      // flat={true}
                      opacity={0.9}
                      anchor={{x: 0.105, y: 0.8}}>
                      <View style={style.marker}>
                        <View>
                          <Image
                            source={require('./assets/icons/car.png')}
                            style={style.markerIcon}
                          />
                        </View>
                        <View style={[style.markerTooltip, {width: 120}]}>
                          <Text style={{fontWeight: 'bold'}}>
                            {teammate.user.riderName}
                          </Text>
                          <Text>{teammate.user.bikeName}</Text>
                          <Text>{teammate.speed} km/h</Text>
                        </View>
                      </View>
                    </Marker>
                  ),
              )}

            {/* <Marker
              coordinate={this.state.myGPS.coord}
              rotation={this.state.myGPS.heading}
              flat={true}
              opacity={0.9}
            /> */}
            <Marker
              coordinate={this.state.myGPS.coord}
              rotation={this.state.myGPS.heading}
              flat={true}
              opacity={0.9}
              ref={ref => {
                this.a = ref;
              }}
              anchor={{x: 0.17, y: 0.9}}>
              <View style={style.marker}>
                <View>
                  <Image
                    source={require('./assets/icons/navigation.png')}
                    style={style.markerIcon}
                  />
                </View>
                <View style={style.markerTooltip}>
                  <Text style={{fontWeight: 'bold'}}>You</Text>
                  <Text>{this.state.myGPS.speed} km/h</Text>
                </View>
              </View>
            </Marker>
          </MapView>

          <View style={[style.bottomView]}>
            <ToolBox
              style={style.toolBox}
              isFollowUser={this.state.isFollowUser}
              message={this.state.msg}
              onChangeMode={isFollowUser => {
                this.setState({isFollowUser});
              }}
              onCenter={() => {
                this.centerMap(true);
                this.setState({isMqttConnected: true});
                ToastAndroid.showWithGravity(
                  'Map centering',
                  ToastAndroid.SHORT,
                  ToastAndroid.TOP,
                );
              }}
            />
            <ChatBox
              ref={ref => (this.chatBox = ref)}
              onSend={this.onChatSend}
              style={style.chatBox}
            />
          </View>

          {this.state.showConfigScreen && (
            <ConfigScreeen
              onGoBack={() => {
                this.setState({showConfigScreen: false});
                Sound.play(Sound.NOPE);
              }}
              onSave={() => {
                this.loadConfigAndConnect();
                Sound.play(Sound.DANCE);
                this.setState({showConfigScreen: false});
              }}
            />
          )}
          {!this.state.showConfigScreen && (
            <View>
              <View style={style.menuIconView}>
                <TouchableOpacity
                  style={StyleSheet.absoluteFillObject}
                  onPress={() => {
                    Sound.play(Sound.HELLO);
                    this.setState({showConfigScreen: true});
                  }}>
                  <Image
                    source={require('./assets/icons/technical-support.png')}
                    style={{width: 40, height: 40}}
                  />
                </TouchableOpacity>
              </View>
              <View style={style.fastToolView}>
                <TouchableOpacity
                  onPress={() => {
                    this.try2SendMark('petro');
                  }}
                  style={style.fastToolTouch}>
                  <Image
                    source={require('./assets/icons/gas-station.png')}
                    style={{width: 40, height: 40}}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    this.try2SendMark('accident');
                  }}
                  style={style.fastToolTouch}>
                  <Image
                    source={require('./assets/icons/car-accident.png')}
                    style={{width: 48, height: 48}}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    this.try2SendMark('police');
                  }}
                  style={[style.fastToolTouch, {top: 5}]}>
                  <Image
                    source={require('./assets/icons/police.png')}
                    style={{width: 45, height: 45}}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }
}

const style = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  mapView: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  bottomView: {
    position: 'absolute',
    width: '100%',
    height: '30%',
    backgroundColor: '#ECACFF33',
    justifyContent: 'center',
    bottom: 0,
  },
  menuIconView: {
    position: 'absolute',
    left: 5,
    top: 0,
    width: 90,
    height: 40,
    marginTop: 30,
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIcon: {
    marginLeft: 25,
  },
  fastToolView: {
    position: 'absolute',
    left: 5,
    top: 70,
    margin: 10,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  fastToolTouch: {
    height: 40,
    width: 40,
    marginVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerIcon: {
    width: 40,
    height: 40,
  },
  teammateIcon: {
    width: 35,
    height: 35,
  },
  markerTooltip: {
    marginLeft: 5,
    borderRadius: 15,
    padding: 5,
    width: 75,
    backgroundColor: '#cfcfcfBB',
  },
});
