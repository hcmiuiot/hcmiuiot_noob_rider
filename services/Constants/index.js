const Constants = {
  DIR_ICON_NAVIGATION: './assets/icons/navigation.png',
  URL_MQTT_CONNECTION: 'ws://hungthuanmk.tech:8083/mqtt',
  //
  PING_INTERVAL: 10000,
  MAX_AGE: 600000, // ms
  // INTERVAL_CHECK_MAX_AGE: 20000, //ms
  PATTERN_TOPIC_GPS: id => `nr/gps/${id}`,
  PATTERN_TOPIC_CHAT: id => `nr/chat/${id}`,
  // PATTERN_TOPIC_PING: id => `nr/ping/${id}`,
};

export default Constants;
