/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef, useCallback } from "react";
import "./App.css";
import player from "./player";

player.init();

const flux1 = "https://novazz.ice.infomaniak.ch/novazz-128.mp3";
const flux2 = "https://ledjamradio.ice.infomaniak.ch/ledjamradio.mp3";

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



function App() {
  const [playing1, setPlaying1] = useState(false);
  const [playing2, setPlaying2] = useState(false);

  const inputRange1Ref = useRef(null);
  const inputRange2Ref = useRef(null);
  const inputRangeMasterRef = useRef(null);

  // Set programmaticaly
  const changeVolume1 = volume => {
    inputRange1Ref.current.value = volume; // Set input range value
    player.changeVolume1(volume);
  };

  const changeVolume2 = volume => {
    inputRange2Ref.current.value = volume; // Set input range value
    player.changeVolume2(volume);
  };

  const changeVolumeMaster = volume => {
    inputRangeMasterRef.current.value = volume; // Set input range value
    player.setVolume(volume);
  };

  const volumeRange1Ref = useCallback(node => {
    inputRange1Ref.current = node;
    changeVolume1(100);
  }, []);

  const volumeRange2Ref = useCallback(node => {
    inputRange2Ref.current = node;
    changeVolume2(100);
  }, []);

  const volumeRangeMasterRef = useCallback(node => {
    inputRangeMasterRef.current = node;
    changeVolumeMaster(100);
  }, []);

  const onRange1ChangedHandler = () => {
    player.changeVolume1(inputRange1Ref.current.value);
  };
  const onRange2ChangedHandler = () => {
    player.changeVolume2(inputRange2Ref.current.value);
  };
  const onRangeMasterChangedHandler = () => {
    player.setVolume(inputRangeMasterRef.current.value);
  };

  const togglePlaying1 = () => {
    setPlaying1(!playing1);
  };
  const togglePlaying2 = () => {
    setPlaying2(!playing2);
  };

  useEffect(() => {
    if (playing1) {
      player.play(flux1).then(() => console.log("Now playing..."));
    } else {
      player.stop();
    }
  }, [playing1]);

  // useEffect(() => {
  //   if (playing2) {
  //     const playHandler = () => audio2.play();
  //     const errorHandler = e => console.log("Error while loading audio2", e);

  //     audio2.addEventListener("canplaythrough", playHandler, false);
  //     audio2.addEventListener("error", errorHandler);

  //     audio2.src = flux2;
  //     audio2.load(); // Needed on iOS

  //     return () => {
  //       audio2.removeEventListener("canplaythrough", playHandler);
  //       audio2.removeEventListener("error", errorHandler);
  //     };
  //   } else {
  //     audio2.pause();
  //     audio2.src = ""; // Stop loading previous stream
  //   }
  // }, [playing2]);

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
      crossfade1to2()

      setTimeout(() => {
        crossfade2to1()

        setTimeout(() => {
          runner()
        }, 10000);

      }, 10000);
    }
    runner();
  };

  return (
    <div className="App">
      <h1> Test audio </h1>

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
      <p>
            <span>Master volume:</span>
            <input type="range" min="0" max="100" step="1" ref={volumeRangeMasterRef} onChange={onRangeMasterChangedHandler} />
          </p>
      </div>
      <div>
        <h2>Actions</h2>
        <p>Manual crossfade:</p>
        <button onClick={crossfade1to2}>Crossfade 1 to 2</button>&nbsp;
        <button onClick={crossfade2to1}>Crossfade 2 to 1</button>

        <p>Auto crossfade:<br />Crossfade from one source to another every 10s.<br />Reload page to stop!</p>
        <button onClick={permanentCrossfade}>Crossfade</button>
      </div>
    </div>
  );
}

export default App;
