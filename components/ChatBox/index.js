import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {
  StyleSheet,
  View,
  ScrollView,
  // Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome5';
import EmojiSelector from 'react-native-emoji-selector';

import Sound from '../../services/Sound';
import ChatBadge from './ChatBadge';

export default class ChatBox extends Component {
  constructor(props) {
    super(props);
    this.state = {isShowingEmojiSeletor: false, chatText: '', badges: []};
  }

  appendToChatText(content) {
    this.setState({chatText: this.state.chatText + content});
  }

  addNewChatBadge(sender, msg, received = true) {
    const lastSender = this.state.badges[this.state.badges.length - 1] || null;
    let hideSender = lastSender && lastSender.sender === sender;
    // let msgTrimmed = msg.trim();
    if (sender && msg.trim() && msg !== '') {
      const newBadgeProps = {sender, msg, received, hideSender};
      this.setState({badges: [...this.state.badges, newBadgeProps]});
      Sound.play(Sound.QUACK);
    }
  }

  onSendMsg() {
    let msg2Send = this.state.chatText.trim();
    if (msg2Send && msg2Send !== '') {
      this.setState({chatText: ''});
      if (this.props.onSend) {
        this.props.onSend(msg2Send);
      }
      // this.addNewChatBadge(this.props.sender, msg2Send);
    }
  }

  componentDidUpdate() {
    // this.msgView.scrollToEnd({animated: true, duration: 1000});
  }

  render() {
    return (
      <View style={style.container}>
        <View style={style.msgView}>
          <ScrollView
            showsHorizontalScrollIndicator={false}
            ref={ref => (this.msgView = ref)}
            onContentSizeChange={() => {
              this.msgView.scrollToEnd({animated: true, duration: 1000});
            }}>
            {this.state.badges.map(badgeProps => (
              <ChatBadge
                sender={badgeProps.sender}
                text={badgeProps.msg}
                received={badgeProps.received}
                hideSender={badgeProps.hideSender}
              />
            ))}
          </ScrollView>
        </View>
        <View
          style={[
            style.chatView,
            {paddingLeft: this.state.isShowingEmojiSeletor ? 10 : 65},
          ]}>
          <TouchableOpacity style={style.fastMsgTouch}>
            <Icon
              name="comment-dots"
              solid
              size={25}
              color="#6E5BFFEE"
              style={style.fastMsgIcon}
            />
          </TouchableOpacity>
          <TextInput
            style={style.chatInput}
            placeholder="Aa"
            onChangeText={chatText => this.setState({chatText})}
            onFocus={() => this.setState({isShowingEmojiSeletor: false})}
            value={this.state.chatText}
          />
          <TouchableOpacity
            style={style.emotionIcon}
            onPress={() => this.setState({isShowingEmojiSeletor: true})}>
            <Icon
              name="smile"
              solid
              size={20}
              color="#6E5BFFDD"
              // style={Style}
              ref={ref => (this.chatInput = ref)}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={style.sendBtn}
            onPress={() => this.onSendMsg()}>
            <Icon
              name="paper-plane"
              solid
              size={25}
              color="#6E5BFF"
              style={style.sendBtnIcon}
            />
          </TouchableOpacity>
        </View>
        {this.state.isShowingEmojiSeletor && (
          <EmojiSelector
            onEmojiSelected={emoji => {
              this.appendToChatText(emoji);
              // this.setState({isShowingEmojiSeletor: false});
              // this.chatInput.wrappedInstance.focus();
            }}
            theme="white"
            showSearchBar={false}
            style={style.emojiSelector}
          />
        )}
      </View>
    );
  }
}

ChatBox.propTypes = {
  sender: PropTypes.string,
  onSend: PropTypes.func,
};

const style = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    // flexDirection: 'column',
    flex: 1,
  },
  msgView: {
    flex: 5,
    // backgroundColor: 'red',
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
    borderColor: '#DBDADADD',
    backgroundColor: '#DBDADADD',
    borderWidth: 2,
    margin: 5,
    color: 'black',
    paddingHorizontal: 15,
    paddingRight: 35,
    paddingBottom: 8,
  },
  emotionIcon: {
    position: 'absolute',
    alignSelf: 'center',
    width: 45,
    height: 45,
    right: 59,
    alignItems: 'center',
    justifyContent: 'center',
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
  emojiSelector: {
    height: 300,
    // position: 'absolute',
    // width:
  },
  fastMsgTouch: {
    alignSelf: 'center',
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fastMsgIcon: {},
});
