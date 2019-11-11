/* eslint-disable no-undef */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from "react";

import player from "./player";

import "./App.css";

const streams = [
  "https://novazz.ice.infomaniak.ch/novazz-128.mp3",
  "https://ledjamradio.ice.infomaniak.ch/ledjamradio.mp3",
  "https://radiocapital-lh.akamaihd.net/i/RadioCapital_Live_1@196312/master.m3u8"
];

player.init();

function App() {
  const [playing1, setPlaying1] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const sliderRef = useRef();
  const delayRef = useRef(null);

  const sliderChangedHandler = () => {
    player.setVolume(sliderRef.current.value);
  };

  const play = index => {
    setLoading(true);
    player.play(streams[index], parseInt(delayRef.current.value)).then(() => {
      console.log("playing now!");
      setLoading(false);
    });
  };

  const stop = () => {
    player.stop(parseInt(delayRef.current.value));
    setLoading(false);
  };

  const next = () => {
    const index = current < streams.length - 1 ? current + 1 : 0;
    play(index);
    setCurrent(index);
  };

  const togglePlaying1 = flag => {
    if (flag) {
      play(current);
    } else {
      stop();
    }
    setPlaying1(flag);
  };

  // Init
  useEffect(() => {
    player.setVolume(100);
    sliderRef.current.value = 100;
  }, []);

  let status = "Paused";
  if (playing1) {
    status = "Playing";
  }
  if (isLoading) {
    status = "Loading";
  }

  return (
    <div className="App">
      <h1>
        Test audio <small style={{ fontSize: "0.95rem" }}>v3</small>
      </h1>

      <div style={{ display: "flex" }}>
        <fieldset style={{ flex: 1 }}>
          <p>
            Stream {current + 1}: {streams[current]}
          </p>
          <p>
            <button onClick={() => togglePlaying1(!playing1)}>{playing1 ? "STOP" : "PLAY"}</button>{" "}
            <button onClick={() => next()} disabled={!playing1}>
              Next
            </button>
          </p>
          <p>
            Transition delay (0 to disable) <input type="number" defaultValue="1500" step="100" ref={delayRef} />
          </p>
          <p>
            Status: {status} {playing1 && !isLoading && `(channel ${player._getCurrentChannel()})`}
          </p>
          <p>
            <span>Volume:</span>
            <input type="range" min="0" max="100" step="1" ref={sliderRef} onChange={sliderChangedHandler} />
          </p>
        </fieldset>
      </div>
    </div>
  );
}

export default App;
