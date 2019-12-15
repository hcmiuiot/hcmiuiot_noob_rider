const Constants = {
  DIR_ICON_NAVIGATION: './assets/icons/navigation.png',
  URL_MQTT_CONNECTION: 'ws://hungthuanmk.tech:8083/mqtt',
  //
  PING_INTERVAL: 10000,
  MAX_AGE: 600000, // ms
  MAX_MARK_AGE: 3600000,
  // INTERVAL_CHECK_MAX_AGE: 20000, //ms
  PATTERN_TOPIC_GPS: id => `nr/gps/${id}`,
  PATTERN_TOPIC_CHAT: id => `nr/chat/${id}`,
  PATTERN_TOPIC_MARK: id => `nr/mark/${id}`,

  SETTING_SHOW_TEAMMATE: true,
  SETTING_SHOW_CAUTION: true,
};

export default Constants;
