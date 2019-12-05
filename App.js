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
  // Text,
} from 'react-native';

import update from 'immutability-helper';

import DeviceInfo from 'react-native-device-info';

import Geolocation from 'react-native-geolocation-service';
import KeepAwake from 'react-native-keep-awake';
import MapView, {Marker} from 'react-native-maps';
// import Proximity from 'react-native-proximity';
import Icon from 'react-native-vector-icons/FontAwesome5';
import ChatBox from './components/ChatBox';
import ConfigScreeen from './screens/ConfigScreen';
import Constants from './services/Constants';
import MqttService from './services/MqttService';
import {requestGeolocationPermission} from './services/Permission';
import Storage from './services/Storage';
import ToolBox from './components/ToolBox';

// import LinearGradient from 'react-native-linear-gradient';
// import ChatBadge from './components/ChatBox/ChatBadge';

console.disableYellowBox = true;

// const B = props => <Text style={{fontWeight: 'bold'}}>{props.children}</Text>;

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
    };

    console.log('Phone ID:', this.state.phoneId);
    this.loadConfigAndConnect();
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
      console.log(
        'this.state.teammates',
        JSON.stringify(this.state.teammates, null, 2),
      );
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

  centerMap() {
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
      // this.mapView.fitToElements(true);
    }
  }

  onMapReadyEvent = () => {
    if (requestGeolocationPermission()) {
      // console.log('GPS is ready!');
      Geolocation.watchPosition(
        position => {
          // console.log(position);
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

      this.mqttService.registerCallback('offline', () =>
        this.setState({isMqttConnected: false}),
      );

      this.mqttService.registerCallback('message', this.handleIncomingMqtt);

      console.log('MQTT connected successfully!');

      // this.noticeIamOnline();
      this.subscribeTopics();
    });
  }

  subscribeTopics() {
    if (this.mqttService && this.mqttService.isConnected()) {
      this.mqttService.subscribe(
        [
          // Constants.PATTERN_TOPIC_PING('+'),
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

  componentDidMount() {
    // Proximity.addListener(() => this.centerMap());
  }

  loadConfigAndConnect() {
    Storage.readConfigs(configs => {
      this.setState({
        user: {riderName: configs.riderName, bikeName: configs.bikeName},
      });
      // alert('Ohyeah');
      this.connect2Mqtt();
    });
  }

  render() {
    // const chatHeight = this.state.showConfigScreen ? 0 : '40%';
    return (
      <View style={style.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
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
            showsCompass={false}>
            <Marker
              coordinate={this.state.myGPS.coord}
              image={require('./assets/icons/navigation.png')}
              rotation={this.state.myGPS.heading}
              flat={true}
              opacity={0.9}
              title={this.state.user.riderName}
              description={this.state.user.bikeName}
            />

            {this.state.teammates.map(
              teammate =>
                teammate.phoneId !== this.state.phoneId &&
                teammate.coord && (
                  <Marker
                    coordinate={teammate.coord}
                    image={require('./assets/icons/navigation2.png')}
                    rotation={teammate.heading}
                    flat={true}
                    opacity={0.9}
                    title={teammate.user.riderName}
                    description={teammate.user.bikeName}>
                    {/* <View style={{backgroundColor: 'red', padding: 10}}>
                    <Text>{teammate.name}</Text>
                  </View> */}
                  </Marker>
                ),
            )}
          </MapView>

          <View style={[style.bottomView]}>
            <ToolBox style={style.toolBox} />
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
              }}
              onSave={() => {
                this.loadConfigAndConnect();
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
                    this.setState({showConfigScreen: true});
                  }}>
                  <Icon
                    name="bars"
                    size={30}
                    color="#11111188"
                    style={StyleSheet.absoluteFillObject}
                  />
                </TouchableOpacity>
                <Icon
                  name={
                    this.state.isMqttConnected ? 'check-circle' : 'times-circle'
                  }
                  solid
                  color={this.state.isMqttConnected ? '#00ff0088' : '#ff000088'}
                  size={22}
                  style={style.statusIcon}
                />
              </View>
              <View style={style.fastToolView}>
                <TouchableOpacity
                  onPress={() => {}}
                  style={style.fastToolTouch}>
                  <Icon name="car-crash" size={22} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {}}
                  style={style.fastToolTouch}>
                  <Icon name="exclamation-circle" size={22} />
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
    // alignItems: 'flex-end',
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
    left: 0,
    top: 0,
    // flexDirection: 'row',
    width: 90,
    height: 30,
    marginTop: 30,
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIcon: {
    marginTop: 3,
  },
  fastToolView: {
    position: 'absolute',
    left: 0,
    top: 60,
    margin: 10,
    alignItems: 'center',
    opacity: 0.5,
  },
  fastToolTouch: {
    height: 30,
    width: 30,
    marginVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
