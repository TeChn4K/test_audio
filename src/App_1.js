/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import "./App.css";

import hlsjs from "hls.js";
import "mediaelement";

// Import stylesheet and shims
import "mediaelement/build/mediaelementplayer.min.css";
import "mediaelement/build/mediaelement-flash-video.swf";

const flux1 = "https://novazz.ice.infomaniak.ch/novazz-128.mp3";
const flux2 = "https://ledjamradio.ice.infomaniak.ch/ledjamradio.mp3";

const idAudioTag = "audioTag";

function App() {
  const [player, setPlayer] = useState();
  const [flux, setFlux] = useState();
  /*
   * Init MediaElement player
   */

  const handlerOnSuccess = (...props) => {
    console.log("success", props);
  };
  const handlerOnError = (...props) => {
    console.log("error", props);
  };

  useEffect(() => {
    const { MediaElementPlayer } = global;

    if (!MediaElementPlayer) {
      return;
    }

    const options = {
      // Read the Notes below for more explanation about how to set up the path for shims
      pluginPath: "./static/media/",
      success: (media, node, instance) => handlerOnSuccess(media, node, instance),
      error: (media, node) => handlerOnError(media, node)
    };
    window.Hls = hlsjs;

    setPlayer(new MediaElementPlayer(idAudioTag, options));

    return () => {
      if (player) {
        player.remove();
        setPlayer(null);
      }
    };
  }, []);

  useEffect(() => {
    if (player) {
      if (flux) {
        player.src = flux;
        player.play();
      } else {
        player.pause();
      }
    }
  }, [flux, player]);

  const pause = () => {
    player.pause();
  };

  /*
   * Simple test
   */

  const [isSimple, setSimple] = useState(false);

  useEffect(() => {
    if (player) {
      console.log("simple test", isSimple);

      let timeout;

      const stopIt = () => {
        clearTimeout(timeout);
        setFlux(null);
      };

      let toggled = false;

      const runIt = () => {
        setFlux(toggled ? flux1 : flux2);
        toggled = !toggled;

        timeout = setTimeout(() => {
          runIt();
        }, 5000);
      };

      if (isSimple) {
        runIt();
      } else {
        stopIt();
      }

      return stopIt;
    }
  }, [isSimple]);

  const toggleSimple = () => {
    setSimple(!isSimple);
  };

  return (
    <div className="App">
      <h1> Test audio </h1>

      <p>Each test will switch between 2 radio sources, 5 secondes each.</p>

      <h2>Test 1</h2>
      <p>Based on setInterval and React setState</p>
      <p>
        <button onClick={toggleSimple}>{isSimple ? "STOP" : "RUN"} simple</button>
        Playing: {flux}
      </p>

      <audio id={idAudioTag} width={400}></audio>
    </div>
  );
}

export default App;
