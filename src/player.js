import Hls from "hls.js";

// TODO: If browser doesn't support Media Source Extensions or native HLS, disable HLS streams and advice user to upgrade.
// Have a look at https://github.com/video-dev/hls.js#compatibility

function isHls(url) {
  return url.slice(-5) === ".m3u8";
}

function equalPowerCrossfade(percent) {
  const value = percent / 100;
  return [Math.cos(value * 0.5 * Math.PI) * 100, Math.cos((1 - value) * 0.5 * Math.PI) * 100];
}

const playerService = {
  isPlaying: false,
  isHls: false,

  init() {
    if (!Hls.isSupported()) {
      alert("HLS not supported...");
      return;
    }

    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioContext();
    } catch (e) {
      alert("Web Audio API is not supported in this browser");
    }

    this.gainMaster = this.context.createGain();
    this.gainMaster.connect(this.context.destination);

    this.gain1 = this.context.createGain();
    this.gain2 = this.context.createGain();
    this.gain1.connect(this.gainMaster);
    this.gain2.connect(this.gainMaster);

    this.audio1 = new Audio();
    this.audio1.crossOrigin = "anonymous";
    this.context.createMediaElementSource(this.audio1).connect(this.gain1);

    this.audio2 = new Audio();
    this.audio2.crossOrigin = "anonymous";
    this.context.createMediaElementSource(this.audio2).connect(this.gain2);
  },

  setVolume(value) {
    var fraction = parseInt(value) / 100;
    this.gainMaster.gain.value = fraction * fraction;
  },

  play(url) {
    console.log("Player loading ", url);
    return (isHls(url) ? this._playHls(url) : this._play(url)).then(() => console.log("Player play"));
  },

  stop() {
    if (this.isPlaying) {
      console.log("Player stop");

      this.isPlaying = false;
      this.audio1.pause();
      this.audio1.src = "";

      if (this.isHls) {
        this.hls1.destroy();
      }
    }
  },

  _playHls(url) {
    return new Promise((resolve, reject) => {

      this.isPlaying = true;
      this.isHls = true;

      this.hls1 = new Hls({ enableWorker: false }); // https://github.com/video-dev/hls.js/issues/2064#issuecomment-469888615
      this.hls1.attachMedia(this.audio1);

      this.hls1.once(Hls.Events.MANIFEST_PARSED, (event, data) => {
        this.audio1.play();
        resolve();
      });

      this.hls1.loadSource(url);
    });
  },

  _play(url) {
    return new Promise((resolve, reject) => {
      this.isPlaying = true;
      this.isHls = false;
      const playHandler = () => {
        this.context.resume().then(() => {
          this.audio1.play();
          this.audio1.removeEventListener("canplaythrough", playHandler);
          resolve();
        });
      };

      this.audio1.addEventListener("canplaythrough", playHandler, false);

      this.audio1.src = url;
    });
  }
};

export default playerService;
