import React, {Component} from 'react';

import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome5';

import Storage from '../../services/Storage';

export default class ConfigScreeeen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      opacity: new Animated.Value(0),
      bikeName: '',
      riderName: '',
    };
  }

  componentDidMount() {
    this.loadSavedConfigs2UI();
    Animated.timing(this.state.opacity, {
      toValue: 1,
      duration: 100,
    }).start();
  }

  onGoBack = () => {
    Animated.timing(this.state.opacity, {
      toValue: 0,
      duration: 100,
    }).start(() => {
      if (this.props.onGoBack) {
        this.props.onGoBack();
      }
    });
  };

  loadSavedConfigs2UI() {
    Storage.readConfigs(configs => {
      console.log(configs);
      this.setState({riderName: configs.riderName, bikeName: configs.bikeName});
    });
  }

  onSave = async () => {
    const willBeSavedConfigs = {
      riderName: this.state.riderName,
      bikeName: this.state.bikeName,
    };
    await Storage.saveConfigs(willBeSavedConfigs);
    Animated.timing(this.state.opacity, {
      toValue: 0,
      duration: 100,
    }).start(() => {
      if (this.props.onSave) {
        this.props.onSave();
      }
    });
  };

  render() {
    return (
      <Animated.View style={[style.container, {opacity: this.state.opacity}]}>
        <Text style={style.label}>Your name</Text>
        <TextInput
          style={[style.controlInput, style.textInput]}
          ref={ref => (this.riderNameInput = ref)}
          placeholder="e.g. Tuan"
          onChangeText={riderName => this.setState({riderName})}
          value={this.state.riderName}
        />
        <Text style={style.label}>Your bike</Text>
        <TextInput
          style={[style.controlInput, style.textInput]}
          ref={ref => (this.bikeNameInput = ref)}
          placeholder="e.g. Wave @"
          onChangeText={bikeName => this.setState({bikeName})}
          value={this.state.bikeName}
        />
        <View style={style.bottomView}>
          <TouchableOpacity
            style={[style.controlInput, style.button]}
            onPress={this.onSave}>
            <Icon name="check-double" size={14} style={style.btnIcon} />
            <Text style={style.btnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[style.controlInput, style.button]}
            onPress={this.onGoBack}>
            <Icon name="angle-double-left" size={16} style={style.btnIcon} />
            <Text style={style.btnText}>Back</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }
}

const style = StyleSheet.create({
  container: {
    // height: '100%',
    width: '100%',
    backgroundColor: '#8789C000',
    flexDirection: 'column',
  },
  label: {
    // width: '100%',
    height: 20,
    marginVertical: 3,
    marginHorizontal: 15,
    color: '#02010A99',
    fontSize: 15,
    fontWeight: 'bold',
    shadowColor: 'black',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.53,
    shadowRadius: 13.97,

    elevation: 21,
  },
  controlInput: {
    // width: '100%',
    height: 40,
    marginHorizontal: 10,
    marginVertical: 10,
  },
  textInput: {
    borderRadius: 20,
    borderColor: 'white',
    borderWidth: 1,
    backgroundColor: '#92AFB555',
    color: '#364958',
    fontSize: 14,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bottomView: {
    marginTop: 10,
  },
  button: {
    marginVertical: 8,
    flexDirection: 'row',
    backgroundColor: '#55828BAA',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
  },
  btnIcon: {
    marginLeft: -10,
    marginRight: 10,
    color: '#39393A',
  },
  btnText: {
    color: '#39393A',
    fontSize: 16,
  },
});
