import AsyncStorage from '@react-native-community/async-storage';

const saveConfigs = async configs => {
  try {
    // console.log('saved', JSON.stringify(configs));
    await AsyncStorage.setItem(
      '@NoobRider_configs',
      JSON.stringify(configs),
      () => {
        Alert.alert('Done', 'Save successfully <3', [{text: 'Hooray'}], {
          cancelable: true,
        });
      },
    );
  } catch (e) {
    // error
  }
};

const readConfigs = async (callback, freshCallback) => {
  const configs = await AsyncStorage.getItem('@NoobRider_configs');
  if (configs) {
    callback(JSON.parse(configs));
  } else {
    if (freshCallback) {
      freshCallback();
    }
  }
};

export default {
  saveConfigs,
  readConfigs,
};
