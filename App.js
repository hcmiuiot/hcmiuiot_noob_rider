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
} from 'react-native';

import {connect} from 'react-redux';

import DeviceInfo from 'react-native-device-info';

import KeepAwake from 'react-native-keep-awake';
import ChatBox from './components/ChatBox';
import ConfigScreeen from './screens/ConfigScreen';
import Constants from './services/Constants';
import MqttService from './services/MqttService';

import Storage from './services/Storage';
import ToolBox from './components/ToolBox';
import Sound from './services/Sound';

import GGMap from './components/GGMap';

console.disableYellowBox = true;

class App extends React.Component {
  constructor(props) {
    super(props);

    console.log('=============================================');

    KeepAwake.activate();

    this.state = {
      isMqttConnected: false,
      isFollowUser: true,
      showConfigScreen: false,
      phoneId: DeviceInfo.getUniqueId(),
      user: {bikeName: 'unknown', riderName: 'unknown'},
      msg: '',
    };

    console.log('Phone ID:', this.state.phoneId);
    this.loadConfigAndConnect(true);
  }

  handleGps(phoneId, msg) {
    if (this.map) {
      this.map.handleGps(phoneId, msg);
    }
  }

  handleMark(phoneId, msg) {
    if (this.map) {
      this.map.handleMark(phoneId, msg);
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
          <GGMap
            ref={ref => {
              this.map = ref;
            }}
            mqttService={this.mqttService}
            phoneId={this.state.phoneId}
            user={this.state.user}
          />

          <View style={[style.bottomView]}>
            <ToolBox
              style={style.toolBox}
              isFollowUser={this.state.isFollowUser}
              message={this.state.msg}
              onChangeMode={isFollowUser => {
                this.setState({isFollowUser});
              }}
              onCenter={() => {
                this.map.centerMap(true);
                this.props.dispatch({type: 'INCREMENT', num: 2});
                // this.setState({isMqttConnected: true});
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
                    this.map.try2SendMark('petro');
                  }}
                  style={style.fastToolTouch}>
                  <Image
                    source={require('./assets/icons/gas-station.png')}
                    style={{width: 40, height: 40}}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    this.map.try2SendMark('accident');
                  }}
                  style={style.fastToolTouch}>
                  <Image
                    source={require('./assets/icons/car-accident.png')}
                    style={{width: 48, height: 48}}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    this.map.try2SendMark('police');
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
});

export default connect()(App);
