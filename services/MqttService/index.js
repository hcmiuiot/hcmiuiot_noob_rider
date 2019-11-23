import mqtt from 'mqtt/dist/mqtt';
export default class MqttService {
  constructor() {
    //
  }

  connect(brokerUrl, onConnect) {
    this.mqttClient = mqtt.connect(brokerUrl); //WEBSOCKET ONLY
    this.mqttClient.on('connect', onConnect);
  }

  subscribe(topic, callback) {
    this.mqttClient.subscribe(topic, callback);
  }

  disconnect(onDisconnect) {
    //
  }

  registerCallback(eventType, callback) {
    this.mqttClient.on(eventType, callback);
  }

}