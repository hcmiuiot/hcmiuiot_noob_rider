import React, {Component} from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';

export default class ToolBox extends Component {
  constructor(props) {
    super(props);
    this.state = {isFollowUser: props.isFollowUser};
  }

  onChangeMode() {
    let newState = !this.state.isFollowUser;
    this.setState({isFollowUser: newState});
    if (this.props.onChangeMode) {
      this.props.onChangeMode(newState);
    }
  }

  render() {
    let mode_str = this.state.isFollowUser ? 'Auto center' : 'Free look';
    let mode_icon = this.state.isFollowUser ? 'lock' : 'unlock';
    return (
      <LinearGradient
        colors={['#E138B199', '#FF538699', '#FF8B6199']}
        useAngle={true}
        angle={30}
        style={style.container}>
        <TouchableOpacity
          style={style.centerTouch}
          onPress={() => this.props.onCenter()}>
          <Icon
            name="crosshairs"
            style={style.iconCenter}
            size={20}
            color="#FCEAFF"
          />
          {/* <Text>Center</Text> */}
        </TouchableOpacity>
        <TouchableOpacity
          style={style.lockPositionTouch}
          onPress={() => this.onChangeMode()}>
          <Icon name={mode_icon} style={style.icon} size={20} color="#FCEAFF" />
          <Text style={style.lockText}>{mode_str}</Text>
        </TouchableOpacity>

        {/* <Text style={style.copyrightText}>
          Speed: 60 km/h
        </Text> */}

      </LinearGradient>
    );
  }
}

const style = StyleSheet.create({
  container: {
    height: 40,
    flexDirection: 'row',
    // backgroundColor: '#FF8B61EE',
    alignItems: 'center',
  },
  iconCenter: {
    margin: 10,
  },
  icon: {
    margin: 10,
    marginLeft: 5,
    shadowColor: 'green',
    textShadowOffset: {
      width: 5,
      height: 5,
    },
    shadowOpacity: 0.89,
    shadowRadius: 4.65,

    elevation: 7,
  },
  centerTouch: {
    height: '100%',
    // backgroundColor: 'red',
  },
  lockPositionTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    // backgroundColor: 'red',
  },
  lockText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  copyrightText: {
    flex: 1,
    fontStyle: 'italic',
    textAlign: 'center',
    color: 'white',
  },
});
