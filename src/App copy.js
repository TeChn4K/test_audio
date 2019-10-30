/* eslint-disable no-undef */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useCallback } from "react";
import "./App.css";

// Workaround
// import hlsjs from 'hls.js';
// window.Hls = hlsjs;
import 'mediaelement';

const flux1 = "https://novazz.ice.infomaniak.ch/novazz-128.mp3";
const flux2 = "https://ledjamradio.ice.infomaniak.ch/ledjamradio.mp3";
const flux3 = "http://radiocapital-lh.akamaihd.net/i/RadioCapital_Live_1@196312/master.m3u8";

// Use an equal-power crossfading curve
function equalPowerCrossfade(percent) {
  const value = percent / 100;
  return [Math.cos(value * 0.5 * Math.PI) * 100, Math.cos((1 - value) * 0.5 * Math.PI) * 100];
}

function crossfade(callback1, callback2, callbackEnd) {
  let counter = 0;
  const progress = setInterval(() => {
    const [vol1, vol2] = equalPowerCrossfade(counter);
    callback1(vol1);
    callback2(vol2);

    counter++;
    if (counter > 100) {
      clearInterval(progress);
      callbackEnd();
    }
  }, 20);
}

let context;

try {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  context = new AudioContext();
} catch (e) {
  alert("Web Audio API is not supported in this browser");
}

// Gains
const gain1 = context.createGain();
const gain2 = context.createGain();

// Audio source 1
const audio1 = document.querySelector("#audio1");

audio1.crossOrigin = "anonymous";
const sourceAudio1 = context.createMediaElementSource(audio1);

// Audio source 2
const audio2 = document.querySelector("#audio2");
new MediaElementPlayer(audio2, {
  pauseOtherPlayers: false,
  startVolume: 1,
  // features: [],
});

audio2.crossOrigin = "anonymous";
const sourceAudio2 = context.createMediaElementSource(audio2);

// Connecting sources
sourceAudio1.connect(gain1);
sourceAudio2.connect(gain2);
gain1.connect(context.destination);
gain2.connect(context.destination);


audio2.src = flux2;

const player = new MediaElementPlayer(audio1, {
  pauseOtherPlayers: false,
  startVolume: 1,
  // features: [],
});
player.setSrc(flux3);
// audio1.src = flux3;

function App() {
  const [playing1, setPlaying1] = useState(false);
  const [playing2, setPlaying2] = useState(false);

  const inputRange1Ref = useRef(null);
  const inputRange2Ref = useRef(null);

  

  const changeVolume1 = volume => {
    inputRange1Ref.current.value = volume; // Set input range value

    var fraction = parseInt(volume) / 100;
    gain1.gain.value = fraction * fraction;
    // player1.setVolume(fraction * fraction)

  };
  const changeVolume2 = volume => {
    inputRange2Ref.current.value = volume; // Set input range value

    var fraction = parseInt(volume) / 100;
    gain2.gain.value = fraction * fraction;
    // player2.setVolume(fraction * fraction)
  };

  const volumeRange1Ref = useCallback(node => {
    inputRange1Ref.current = node;
    changeVolume1(100);
  }, []);
  const volumeRange2Ref = useCallback(node => {
    inputRange2Ref.current = node;
    changeVolume2(100);
  }, []);

  const onRange1ChangedHandler = () => {
    changeVolume1(inputRange1Ref.current.value);
  };
  const onRange2ChangedHandler = () => {
    changeVolume2(inputRange2Ref.current.value);
  };

  const togglePlaying1 = (flag) => {
    setPlaying1(flag);

    if (flag) {
      console.log(audio1);
      player.play();
    }
    else {
      player.pause();
    }
  };

  const togglePlaying2 = (flag) => {
    setPlaying2(flag);

    if (flag) {
      audio2.play();
    }
    else {
      audio2.pause();
    }
  };

  const crossfade1to2 = () => {
    changeVolume1(100);
    changeVolume2(0);
    togglePlaying1(true);
    togglePlaying2(true);

    // Wait for starting stream to play
    setTimeout(() => {
      crossfade(changeVolume1, changeVolume2, () => {
        togglePlaying1(false);
      });
    }, 2000);
  };

  const crossfade2to1 = () => {
    changeVolume1(0);
    changeVolume2(100);
    togglePlaying1(true);
    togglePlaying2(true);

    // Wait for starting stream to play
    setTimeout(() => {
      crossfade(changeVolume2, changeVolume1, () => {
        togglePlaying2(false);
      });
    }, 2000);
  };

  const permanentCrossfade = () => {
    const runner = () => {
      crossfade1to2();

      setTimeout(() => {
        crossfade2to1();

        setTimeout(() => {
          runner();
        }, 10000);
      }, 10000);
    };
    runner();
  };

  return (
    <div className="App">
      <h1>
        Test audio <small style={{ fontSize: "0.95rem" }}>v2</small>
      </h1>

      <div style={{ display: "flex" }}>
        <fieldset style={{ flex: 1 }}>
          <figcaption>Channel 1</figcaption>
          <p>
            <button onClick={() => togglePlaying1(!playing1)}>{playing1 ? "STOP" : "PLAY"}</button>
          </p>
          <p>
            <span>Volume:</span>
            <input type="range" min="0" max="100" step="1" ref={volumeRange1Ref} onChange={onRange1ChangedHandler} />
          </p>
        </fieldset>

        <fieldset style={{ flex: 1 }}>
          <figcaption>Channel 2</figcaption>
          <p>
            <button onClick={() => togglePlaying2(!playing2)}>{playing2 ? "STOP" : "PLAY"}</button>
          </p>
          <p>
            <span>Volume:</span>
            <input type="range" min="0" max="100" step="1" ref={volumeRange2Ref} onChange={onRange2ChangedHandler} />
          </p>
        </fieldset>
      </div>

      <div>
        <h2>Actions</h2>
        <p>Manual crossfade:</p>
        <button onClick={crossfade1to2}>Crossfade 1 to 2</button>&nbsp;
        <button onClick={crossfade2to1}>Crossfade 2 to 1</button>
        <p>
          Auto crossfade:
          <br />
          Crossfade from one source to another every 10s.
          <br />
          Reload page to stop!
        </p>
        <button onClick={permanentCrossfade}>Crossfade</button>
      </div>
    </div>
  );
}

export default App;
