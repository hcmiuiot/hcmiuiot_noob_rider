import React, {Component} from 'react';
import moment from 'moment';

import {StyleSheet, View, Text, Image} from 'react-native';

export default class ChatBadge extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const avatar = (
      <View style={style.avatarView}>
        <Image
          style={style.avatarImg}
          source={
            this.props.hideSender
              ? {}
              : {
                  uri:
                    'https://i.ibb.co/9cKRzHd/74180087-2500977543350959-4332447010280964096-o.jpg',
                }
          }
        />
      </View>
    );

    return (
      <View style={style.container}>
        {!this.props.hideSender && (
          <View
            style={[
              style.senderView,
              {justifyContent: this.props.received ? 'flex-start' : 'flex-end'},
            ]}>
            {!this.props.timestamp && (
              <Text style={style.senderText}>{this.props.sender} said</Text>
            )}
            {this.props.timestamp && (
              <Text style={style.senderText}>
                {this.props.sender} ({moment(this.props.timestamp).fromNow()})
              </Text>
            )}
          </View>
        )}

        <View
          style={[
            style.msgView,
            {justifyContent: this.props.received ? 'flex-start' : 'flex-end'},
          ]}>
          {this.props.received && avatar}
          <View
            style={[
              style.textView,
              {
                backgroundColor: this.props.received
                  ? '#DBDADAAA'
                  : '#6E5BFFDD',
              },
            ]}>
            <Text
              style={[
                style.msgText,
                {color: this.props.received ? 'black' : 'white'},
              ]}>
              {this.props.text}
            </Text>
          </View>
          {!this.props.received && avatar}
        </View>
      </View>
    );
  }
}

const style = StyleSheet.create({
  container: {
    right: 0,
    // backgroundColor: 'blue',
    marginBottom: 1,
    alignContent: 'flex-end',
    paddingHorizontal: 10,
  },
  senderView: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  senderText: {
    color: '#111111EE',
    fontSize: 12,
    fontStyle: 'italic',
    marginHorizontal: 5,
  },
  msgView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  msgText: {
    color: 'white',
  },
  textView: {
    height: 40,
    width: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    borderColor: '#998BBA55',
    borderWidth: 1,
    paddingHorizontal: 10,
    backgroundColor: '#494974EE',
  },
  avatarView: {
    margin: 5,
  },
  avatarImg: {
    height: 30,
    width: 30,
    borderRadius: 15,
  },
});
