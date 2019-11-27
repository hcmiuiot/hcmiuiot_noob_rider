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
  Text,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import KeepAwake from 'react-native-keep-awake';
import MapView, {Marker} from 'react-native-maps';
import Proximity from 'react-native-proximity';
import Icon from 'react-native-vector-icons/FontAwesome5';
import ChatBox from './components/ChatBox';
import ConfigScreeen from './screens/ConfigScreen';
import Constants from './services/Constants';
import MqttService from './services/MqttService';
import {requestGeolocationPermission} from './services/Permission';
import Storage from './services/Storage';

// import LinearGradient from 'react-native-linear-gradient';
// import ChatBadge from './components/ChatBox/ChatBadge';

console.disableYellowBox = true;

// const B = props => <Text style={{fontWeight: 'bold'}}>{props.children}</Text>;

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
      showConfigScreen: false,
      bikeName: 'unknown',
      riderName: 'unknown',
      teammates: [],
    };

    this.loadConfigAndConnect();
  }

  updateTeammatesInfo(riderName, info) {
    let foundIdx = this.state.teammates.findIndex(
      obj => obj.name === riderName,
    );
    if (foundIdx === -1) {
      console.log('Go to add new!');
      this.setState({
        teammates: [...this.state.teammates, {name: riderName, info}],
      });
    } else {
      let updateTeammates = [...this.state.teammates];
      updateTeammates[foundIdx] = {name: riderName, info};
      this.setState({teammates: updateTeammates});
    }
    // console.log(this.state.teammates);
  }

  handleIncomingMqtt = (topic, msg, packet) => {
    const topicSegs = topic.split('/');
    const incomingMsg = JSON.parse(msg.toString());
    let sender = topicSegs[1];
    let type = topicSegs[2];
    let isMyMsg = sender === this.state.riderName;

    // console.log(packet);

    switch (type) {
      case 'gps': {
        console.log('[GPS]', topic, incomingMsg);
        this.updateTeammatesInfo(sender, incomingMsg);
        break;
      }
      case 'chat': {
        console.log('[CHAT]', topic, incomingMsg);
        if (this.chatBox) {
          this.chatBox.addNewChatBadge(sender, incomingMsg.msg, !isMyMsg);
        }
      }
    }
  };

  try2SendGps() {
    if (this.mqttService) {
      console.log('Trying 2 send GPS');
      const sendMsg = {
        user: {bikeName: this.state.bikeName},
        gps: this.state.myGPS,
      };
      this.mqttService.publish(
        `noob_rider/${this.state.riderName}/gps`,
        JSON.stringify(sendMsg),
        {qos: 0, retain: true, properties: {messageExpiryInterval: 5}},
      );
    }
  }

  try2SendChat(to, msg) {
    if (this.mqttService) {
      console.log('Trying 2 send Chat');
      const sendMsg = {to, msg};
      this.mqttService.publish(
        `noob_rider/${this.state.riderName}/chat`,
        JSON.stringify(sendMsg),
        {qos: 1, retain: true, properties: {messageExpiryInterval: 5}},
      );
    }
  }

  onChatSend = msg => {
    if (this.state.riderName) {
      this.try2SendChat('', msg);
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
    this.mqttService = new MqttService();
    this.mqttService.connect(Constants.URL_MQTT_CONNECTION, () => {
      this.setState({isMqttConnected: true});
      console.log('MQTT connected successfully!');
      this.mqttService.subscribe('noob_rider/+/+', {qos: 1}, err => {
        if (!err) {
          console.log('Subscribe MQTT okay!');
          this.mqttService.registerCallback('message', this.handleIncomingMqtt);
        }
      });
    });
  }

  componentDidMount() {
    Proximity.addListener(() => this.centerMap());
  }

  loadConfigAndConnect() {
    Storage.readConfigs(configs => {
      this.setState({riderName: configs.riderName, bikeName: configs.bikeName});
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
              latitude: 10.8381656,
              longitude: 106.6302742,
              latitudeDelta: 0.0,
              longitudeDelta: 0.0,
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
              title={this.state.riderName}
              description={this.state.bikeName}
            />

            {this.state.teammates.map(
              teammate =>
                teammate.name !== this.state.riderName && (
                  <Marker
                    coordinate={teammate.info.gps.coord}
                    image={require('./assets/icons/navigation2.png')}
                    rotation={teammate.info.gps.heading}
                    flat={true}
                    opacity={0.9}
                    title={teammate.name}
                    description={teammate.info.user.bikeName}>
                    {/* <View style={{backgroundColor: 'red', padding: 10}}>
                      <Text>{teammate.name}</Text>
                    </View> */}
                  </Marker>
                ),
            )}
          </MapView>

          <View style={[style.toolbox]}>
            <ChatBox
              // style={style.chatScrollView}
              ref={ref => (this.chatBox = ref)}
              onSend={this.onChatSend}
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
            </View>
          )}

          {/* <View style={style.switchArea}>
            <Text style={{bottom: -5}}>Auto-center</Text>
            <Switch
              style={style.trackSwitch}
              value={this.state.isFollowUser}
              onValueChange={value => this.setState({isFollowUser: value})}
            />
          </View> */}
        </View>
      </View>
    );
  }
}

const style = StyleSheet.create({
  container: StyleSheet.absoluteFillObject,
  mapView: {
    width: '100%',
    height: '100%',
    // alignItems: 'flex-end',
  },
  toolbox: {
    position: 'absolute',
    width: '100%',
    height: '35%',
    // maxHeight: '35%',
    // marginBottom: 0,
    // backgroundColor: 'yellow',
    justifyContent: 'center',
    bottom: 0,
    // opacity: 0.85,
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
    backgroundColor: '#DAEBF200',
    // flexDirection: 'column',
  },
  statusText: {
    // color: '#454955',
    fontSize: 35,
  },
  speedView: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  connectBtn: {
    width: '100%',
    height: '25%',
    // bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    // alignSelf: 'flex-end',
    backgroundColor: '#998BBA',
    opacity: 1,
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
    // alignSelf: 'flex-end',
    position: 'absolute',
    bottom: '20%',
    right: 0,
    width: 150,
    height: 30,
    marginBottom: 5,
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  trackSwitch: {
    // position: 'absolute',
    // // alignSelf: 'flex-end',
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
  menuIconView: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 30,
    height: 30,
    marginTop: 30,
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
