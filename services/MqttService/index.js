import mqtt from 'mqtt/dist/mqtt';
export default class MqttService {
  constructor() {
    //
    console.log('Initing MqttService');
  }

  isConnected() {
    return this.mqttClient && this.mqttClient.connected;
  }

  connect(brokerUrl, onConnect) {
    this.mqttClient = mqtt.connect(brokerUrl); //WEBSOCKET ONLY
    this.mqttClient.on('connect', onConnect);
  }

  publish(topic, msg, _callback, _options = {}) {
    if (this.mqttClient && this.mqttClient.connected) {
      this.mqttClient.publish(topic, msg, _options, _callback);
    }
  }

  subscribe(topic, callback, options = {}) {
    this.mqttClient.subscribe(topic, options, callback);
  }

  unsubscribe(topic, callback, options = {}) {
    this.mqttClient.unsubscribe(topic, options, callback);
  }

  disconnect(onDisconnect) {
    //
  }

  registerCallback(eventType, callback) {
    this.mqttClient.on(eventType, callback);
  }
}
