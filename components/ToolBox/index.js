import React, {Component} from 'react';
import {StyleSheet, View, Text, Switch, TouchableOpacity} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';

export default class ToolBox extends Component {
  render() {
    return (
      <LinearGradient
        colors={['#E138B199', '#FF538699', '#FF8B6199']}
        useAngle={true}
        angle={30}
        style={style.container}>
        <TouchableOpacity style={style.lockPositionTouch}>
          <Icon name="lock" style={style.icon} size={20} color="#FCEAFF" />
          <Text style={style.lockText}>Lock position</Text>
        </TouchableOpacity>

        <Text style={style.copyrightText}>
          Copyright © 2019 by ReactNativer
        </Text>

        {/* <View style={style.switchArea}>
          <Text style={{bottom: -5}}>Auto-center</Text>
          <Switch
            style={style.trackSwitch}
            // value={this.state.isFollowUser}
            // onValueChange={value => this.setState({isFollowUser: value})}
          />
        </View> */}
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
  icon: {
    margin: 10,
    shadowColor: 'green',
    textShadowOffset: {
      width: 5,
      height: 5,
    },
    shadowOpacity: 0.89,
    shadowRadius: 4.65,

    elevation: 7,
  },
  lockPositionTouch: {
    flexDirection: 'row',
    alignItems: 'center',
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
  }
});
