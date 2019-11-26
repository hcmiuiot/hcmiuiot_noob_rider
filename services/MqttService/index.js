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

  publish(topic, msg, qos = 0) {
    if (this.mqttClient && this.mqttClient.connected) {
      this.mqttClient.publish(topic, msg, {
        qos,
        retain: true,
      });
    }
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
