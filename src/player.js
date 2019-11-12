import Hls from "hls.js";

const crossfadeStep = 5;

// TODO: If browser doesn't support Media Source Extensions or native HLS, disable HLS streams and advice user to upgrade.
// Have a look at https://github.com/video-dev/hls.js#compatibility

function isHls(url) {
  return (
    url
      .split(/\#|\?/)[0]
      .split(".")
      .pop()
      .trim() === "m3u8"
  );
}

function equalPowerCrossfade(value) {
  return [Math.cos((1 - value) * 0.5 * Math.PI), Math.cos(value * 0.5 * Math.PI)];
}

function crossfade(callback1, callback2, delay = 0) {
  return new Promise((resolve, reject) => {
    const fn1 = callback1 ? callback1.bind(this) : () => {};
    const fn2 = callback2 ? callback2.bind(this) : () => {};

    if (!delay) {
      fn1(1);
      fn2(0);
      resolve();
    } else {
      const timeStep = (delay * crossfadeStep) / 100;
      let counter = 0;

      const id = setInterval(() => {
        const [vol1, vol2] = equalPowerCrossfade(counter / 100);
        fn1(vol1);
        fn2(vol2);

        counter += crossfadeStep;
        if (counter >= 100) {
          clearInterval(id);
          fn1(1);
          fn2(0);
          resolve();
        }
      }, timeStep);
    }
  });
}

const playerService = {
  isChannelHls: [false, false],
  hlsInstance: [null, null],

  channelPlaying: null,

  gains: [],
  audios: [],

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

    // Master volume
    this.gainMaster = this.context.createGain();
    this.gainMaster.connect(this.context.destination);

    // Channel 1 & 2
    for (let i = 0; i <= 1; i++) {
      this.gains[i] = this.context.createGain();
      this.gains[i].connect(this.gainMaster);

      this.audios[i] = new Audio();
      this.audios[i].crossOrigin = "anonymous";
      this.context.createMediaElementSource(this.audios[i]).connect(this.gains[i]);
    }
  },

  setVolume(value) {
    var fraction = parseInt(value) / 100;
    this.gainMaster.gain.value = fraction * fraction;
  },

  play(url, delay = 750) {
    return new Promise(async (resolve, reject) => {
      const wasPlaying = this._isPlaying();
      const freeChannel = this._getFreeChannel();

      this.gains[freeChannel].gain.value = 0;
      this._setCurrentChannel(freeChannel);
      await this._startChannel(freeChannel, `${url}?nocache=${new Date().getTime()}`);

      resolve({
        transitionEnd: new Promise(async (subresolve, reject) => {
          if (!wasPlaying) {
            await this._fadeIn(freeChannel, delay);
          } else {
            const current = this._getFreeChannel();
            await this._fadeInOut(freeChannel, current, delay);
            this._stopChannel(current);
          }

          subresolve();
        })
      });
    });
  },

  stop(delay = 0) {
    return new Promise(async (resolve, reject) => {
      if (this._isPlaying()) {
        const channel = this._getCurrentChannel();
        await this._fadeOut(channel, delay);
        this._stopChannel(channel);
        this._setCurrentChannel(null);
      }
      resolve();
    });
  },

  _getCurrentChannel() {
    return this.channelPlaying;
  },
  _setCurrentChannel(channel = null) {
    this.channelPlaying = channel;
  },
  _getFreeChannel() {
    return this._getCurrentChannel() !== 0 ? 0 : 1;
  },

  _isPlaying() {
    return this.channelPlaying !== null;
  },

  async _startChannel(channel, url) {
    return new Promise(async (resolve, reject) => {
      // START NON HLS
      if (!isHls(url)) {
        const playHandler = async () => {
          await this.context.resume();
          this.audios[channel].play();
          this.audios[channel].removeEventListener("canplaythrough", playHandler);
          resolve();
        };
        const errorHandler = e => {
          this.audios[channel].removeEventListener("error", errorHandler);
          reject(e);
        };

        this.audios[channel].addEventListener("canplaythrough", playHandler);
        this.audios[channel].addEventListener("error", errorHandler);
        this.audios[channel].src = url;

        this.isChannelHls[channel] = false;
      }
      // START HLS
      else {
        const instance = new Hls({ enableWorker: false }); // https://github.com/video-dev/hls.js/issues/2064#issuecomment-469888615
        instance.attachMedia(this.audios[channel]);

        instance.once(Hls.Events.MANIFEST_PARSED, (event, data) => {
          this.audios[channel].play();
          resolve();
        });

        instance.loadSource(url);

        this.hlsInstance[channel] = instance;
        this.isChannelHls[channel] = true;
      }
    });
  },

  _stopChannel(channel) {
    this.audios[channel].pause();
    this.audios[channel].src = "";

    if (this.isChannelHls[channel]) {
      this.hlsInstance[channel].destroy();
    }
  },

  _setGain(channel, value) {
    this.gains[channel].gain.value = value;
  },

  async _fadeIn(channel, delay) {
    return crossfade(vol => this._setGain(channel, vol), null, delay);
  },
  async _fadeOut(channel, delay) {
    return crossfade(null, vol => this._setGain(channel, vol), delay);
  },
  async _fadeInOut(channelIn, channelOut, delay) {
    return crossfade(vol => this._setGain(channelIn, vol), vol => this._setGain(channelOut, vol), delay);
  }
};

export default playerService;
