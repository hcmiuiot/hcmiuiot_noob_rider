import mqtt from 'mqtt/dist/mqtt';
export default class MqttService {
  constructor() {
    //
    console.log('Initing MqttService');
  }

  connect(brokerUrl, onConnect) {
    this.mqttClient = mqtt.connect(brokerUrl); //WEBSOCKET ONLY
    this.mqttClient.on('connect', onConnect);
  }

  publish(topic, msg, _options = {}) {
    if (this.mqttClient && this.mqttClient.connected) {
      this.mqttClient.publish(topic, msg, _options);
    }
  }

  subscribe(topic, options = {}, callback) {
    this.mqttClient.subscribe(topic, options, callback);
  }

  disconnect(onDisconnect) {
    //
  }

  registerCallback(eventType, callback) {
    this.mqttClient.on(eventType, callback);
  }
}
