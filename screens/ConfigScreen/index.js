import React, {Component} from 'react';

import {StyleSheet, View, Text, TextInput} from 'react-native';

export default class ConfigScreeeen extends Component {
  render() {
    return (
      <View style={style.container}>
        <Text style={style.label}>Your name</Text>
        <TextInput
          style={[style.controlInput, style.textInput]}
          ref={ref => (this.riderNameInput = ref)}
          placeholder="e.g. Tuan"
        />
      </View>
    );
  }
}

const style = StyleSheet.create({
  container: {
    height: '100%',
    width: '30%',
    backgroundColor: '#8789C088',
    flexDirection: 'column',
  },
  label: {
    // width: '100%',
    height: 20,
    marginVertical: 5,
    marginHorizontal: 10,
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  controlInput: {
    // width: '100%',
    height: 40,
    marginHorizontal: 10,
    marginVertical: 5,
  },
  textInput: {
    borderColor: 'white',
    borderWidth: 2,
    // backgroundColor: '#ffffff33',
    color: 'white',
    fontSize: 14,
    alignItems: 'center',
  },
});
