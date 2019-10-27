export default {
  isPlaying: false,
  currentStream: null,

  init() {
    // Useful for Webkit users
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    // Main AudioContext
    const context = new AudioContext();

    // Gains
    this.gain1 = context.createGain();
    this.gain2 = context.createGain();
    this.gainMaster = context.createGain();

    // Audio sources
    this.audio1 = new Audio();
    this.audio1.crossOrigin = "anonymous";
    // audio1.preload = "none";
    const sourceAudio1 = context.createMediaElementSource(this.audio1);

    // 3-2. Second Audio source
    this.audio2 = new Audio();
    this.audio2.crossOrigin = "anonymous";
    // audio2.preload = "none";
    const sourceAudio2 = context.createMediaElementSource(this.audio2);

    // Connecting sources
    sourceAudio1.connect(this.gain1);
    sourceAudio2.connect(this.gain2);

    this.gain1.connect(this.gainMaster);
    this.gain2.connect(this.gainMaster);

    this.gainMaster.connect(context.destination);
  },

  changeVolume1(volume) {
    var fraction = parseInt(volume) / 100;
    this.gain1.gain.value = fraction * fraction;
  },
  changeVolume2(volume) {
    var fraction = parseInt(volume) / 100;
    this.gain2.gain.value = fraction * fraction;
  },

  setVolume(volume) {
    var fraction = parseInt(volume) / 100;
    this.gainMaster.gain.value = fraction * fraction;
  },

  play(flux) {
    return new Promise((resolve, reject) => {
      const errorHandler = e => {
        this.audio1.removeEventListener("error", errorHandler);
        reject(e);
      }
      const playHandler = () => {
        this.audio1.removeEventListener("canplaythrough", playHandler);
        this.audio1.play();
        this.isPlaying = true;
        this.currentStream = flux;
        resolve();
      };

      this.audio1.addEventListener("canplaythrough", playHandler, false);
      this.audio1.addEventListener("error", errorHandler);

      this.audio1.src = flux;
      this.audio1.load(); // Needed on iOS
    });
  },

  stop() {
    this.isPlaying = false;
    this.currentStream = null;
    this.audio1.pause();
    this.audio1.src = ""; // Stop loading previous stream
  }
};
