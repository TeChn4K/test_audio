/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef, useCallback } from "react";
import "./App.css";

const flux1 = "https://novazz.ice.infomaniak.ch/novazz-128.mp3";
const flux2 = "https://ledjamradio.ice.infomaniak.ch/ledjamradio.mp3";
// const flux2 = "http://radiocapital-lh.akamaihd.net/i/RadioCapital_Live_1@196312/master.m3u8";

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
    if (counter >= 100) {
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

// Audio sources
const audio1 = new Audio();
audio1.crossOrigin = "anonymous";
const sourceAudio1 = context.createMediaElementSource(audio1);

// 3-2. Second Audio source
const audio2 = new Audio();
audio2.crossOrigin = "anonymous";
const sourceAudio2 = context.createMediaElementSource(audio2);

// Connecting sources
sourceAudio1.connect(gain1);
sourceAudio2.connect(gain2);
gain1.connect(context.destination);
gain2.connect(context.destination);

function App() {
  const [playing1, setPlaying1] = useState(false);
  const [playing2, setPlaying2] = useState(false);

  const inputRange1Ref = useRef(null);
  const inputRange2Ref = useRef(null);

  const changeVolume1 = volume => {
    inputRange1Ref.current.value = volume; // Set input range value

    var fraction = parseInt(volume) / 100;
    gain1.gain.value = fraction * fraction;
  };
  const changeVolume2 = volume => {
    inputRange2Ref.current.value = volume; // Set input range value

    var fraction = parseInt(volume) / 100;
    gain2.gain.value = fraction * fraction;
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

  const togglePlaying1 = () => {
    setPlaying1(!playing1);
  };
  const togglePlaying2 = () => {
    setPlaying2(!playing2);
  };

  useEffect(() => {
    if (playing1) {
      const playHandler = () => {
        // Have to be called on a user action to be able to play 
        context.resume().then(() => audio1.play());
      }
      const errorHandler = e => console.log("Error while loading audio1", e);

      audio1.addEventListener("canplaythrough", playHandler, false);
      audio1.addEventListener("error", errorHandler);

      audio1.src = flux1;
      // audio1.load(); // Needed on iOS? Maybe, but it's not working on Chrome Android!

      return () => {
        audio1.removeEventListener("canplaythrough", playHandler);
        audio1.removeEventListener("error", errorHandler);
      };
    } else {
      audio1.pause();
      audio1.src = ""; // Stop loading previous stream
    }
  }, [playing1]);

  useEffect(() => {
    if (playing2) {
      const playHandler = () => {
        // Have to be called on a user action to be able to play 
        context.resume().then(() => audio2.play());
      }
      const errorHandler = e => console.log("Error while loading audio2", e);

      audio2.addEventListener("canplaythrough", playHandler, false);
      audio2.addEventListener("error", errorHandler);

      audio2.src = flux2;
      // audio2.load(); // Needed on iOS? Maybe, but it's not working on Chrome Android!

      return () => {
        audio2.removeEventListener("canplaythrough", playHandler);
        audio2.removeEventListener("error", errorHandler);
      };
    } else {
      audio2.pause();
      audio2.src = ""; // Stop loading previous stream
    }
  }, [playing2]);

  const crossfade1to2 = () => {
    changeVolume1(100);
    changeVolume2(0);
    setPlaying1(true);
    setPlaying2(true);

    // Wait for starting stream to play
    setTimeout(() => {
      crossfade(changeVolume1, changeVolume2, () => {
        setPlaying1(false);
      });
    }, 2000);
  };

  const crossfade2to1 = () => {
    changeVolume1(0);
    changeVolume2(100);
    setPlaying1(true);
    setPlaying2(true);

    // Wait for starting stream to play
    setTimeout(() => {
      crossfade(changeVolume2, changeVolume1, () => {
        setPlaying2(false);
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
            <button onClick={togglePlaying1}>{playing1 ? "STOP" : "PLAY"}</button>
          </p>
          <p>
            <span>Volume:</span>
            <input type="range" min="0" max="100" step="1" ref={volumeRange1Ref} onChange={onRange1ChangedHandler} />
          </p>
        </fieldset>

        <fieldset style={{ flex: 1 }}>
          <figcaption>Channel 2</figcaption>
          <p>
            <button onClick={togglePlaying2}>{playing2 ? "STOP" : "PLAY"}</button>
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
