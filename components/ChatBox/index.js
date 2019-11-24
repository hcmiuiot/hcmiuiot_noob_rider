import React, {Component} from 'react';

import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

import ChatBadge from './ChatBadge';

export default class ChatBox extends Component {
  render() {
    return (
      <View style={style.container}>
        <View style={style.msgView}>
          <ScrollView>{this.props.children}</ScrollView>
        </View>
        <View style={style.chatView}>
          <TextInput style={style.chatInput} placeholder="Aa" />
          <Icon
            name="smile"
            solid
            size={20}
            color="#998BBADD"
            style={style.emotionIcon}
          />
          <TouchableOpacity style={style.sendBtn}>
            <Icon
              name="paper-plane"
              solid
              size={30}
              color="#00BEBC"
              style={style.sendBtnIcon}
            />
          </TouchableOpacity>
          {/* <TextInput style={style.sendBtn} /> */}
        </View>
      </View>
    );
  }
}

const style = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    // flexDirection: 'column',
    flex: 1,
  },
  msgView: {
    flex: 5,
  },
  chatView: {
    height: 45,
    // backgroundColor: 'red',
    flexDirection: 'row',
    paddingHorizontal: 5,
    paddingLeft: 65,
    paddingRight: 10,
  },
  chatInput: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    // alignContent: 'center',
    // textAlignVertical: 'center',
    // textAlign: 'auto',
    // backgroundColor: 'white',
    borderRadius: 30,
    borderColor: '#DBDADAAA',
    backgroundColor: '#DBDADAAA',
    borderWidth: 2,
    margin: 5,
    color: 'black',
    paddingHorizontal: 15,
    paddingBottom: 8,
  },
  emotionIcon: {
    position: 'absolute',
    alignSelf: 'center',
    right: 72,
  },
  sendBtn: {
    height: 45,
    width: 45,
    // backgroundColor: 'yellow',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0,
  },
  sendBtnIcon: {
    // backgroundColor: 'blue',
    // size: 30,
  },
});
