/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import "./App.css";

import hlsjs from "hls.js";
import "mediaelement";

// Import stylesheet and shims
import "mediaelement/build/mediaelementplayer.min.css";
import "mediaelement/build/mediaelement-flash-video.swf";

const flux1 = "https://direct.franceinter.fr/live/franceinter-midfi.mp3";
const flux2 = "https://icecast.radiofrance.fr/franceinfo-midfi.mp3";

const idAudioTag = "audioTag";

function App() {
  const [player, setPlayer] = useState();

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
      };

      let toggled = false;

      const runIt = () => {
        player.setSrc(toggled ? flux1 : flux2);
        player.play()
        toggled = !toggled;

        timeout = setTimeout(() => {
          runIt();
        }, 5000);
      };

      if (isSimple) {
        runIt();
      } else {
        player.pause()
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
      <h1>Test audio </h1>

      <h2>Test 2</h2>
      <p>Based on setInterval and MediaElement API setSource</p>
      <p>
        <button onClick={toggleSimple}>{isSimple ? "STOP" : "RUN"} test 2</button>
      </p>

      <audio id={idAudioTag} width={400}></audio>
    </div>
  );
}

export default App;
