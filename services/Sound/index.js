import SoundPlayer from 'react-native-sound-player';

const playInstant = filename => {
  try {
    SoundPlayer.playSoundFile(filename, 'mp3');
  } catch (e) {
    console.log(e);
  }
};

export default {
  play: playInstant,
  NEW_MESSAGE: 'yanghelloo',
  SELFIE: 'selfie',
  CENTURY: 'century',
  CORTADO: 'cortado',
  DANCE: 'dance',
  DUN_DUNN: 'dundundunnn',
  LET_ME_HIT_IT: 'letmehitit',
  OH_HELL_NO: 'ohhellno',
  QUACK: 'quack',
  SAX_ROLL: 'saxroll',
  SUCK_DICK: 'suckadick',
  YEET: 'yeet',
};
