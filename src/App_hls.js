import Hls from "hls.js";
import React from "react";
import "./App.css";

class Player {
	constructor(url) {
		this.url = url;

		this.playingCallback = () => {};
		this.audio = document.createElement('audio');
		this.audio.addEventListener('playing', () => {
			this.playingCallback(true);
			this.playingCallback = () => {};
		});
		this.audio.addEventListener('error', () => {
			this.playingCallback(false);
			this.playingCallback = () => {};
		});

		this.isHls = this.url.slice(-5) === '.m3u8';
		this.hls = null;
		if (!Hls.isSupported()) {
			console.log('MSE are not supported on your platform');
		}
	}

	setVolume(vol) {
		// Do not use this.player.setVolume, sound crackling on Firefox!
		this.player.media.volume = vol * vol;
	}

	play(callback) {
		if (callback) {
			this.playingCallback = callback;
		}

		if (this.isHls) {
			this.hls = new Hls({ enableWorker: false }); // https://github.com/video-dev/hls.js/issues/2064#issuecomment-469888615
			this.hls.attachMedia(this.audio);
			this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
				console.log("loading " + this.url);
				this.hls.loadSource(this.url);
				this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
					this.audio.play();
					console.log('play');
				});
			});
			this.hls.on(Hls.Events.ERROR, function (event, data) {
				const { type, details, fatal } = data;
				console.log("error type=" + type + " details=" + details + " fatal=" + fatal);
				this.playingCallback(false);
			});
		} else {
			this.audio.src = this.url;
			this.audio.play();
			console.log('play');
		}
	}

	stop() {
		this.audio.pause();
		if (this.isHls) {
			this.hls.destroy();
		}
		console.log('stop');
	}
}

const SWITCH_DELAY = 3000;
const SWITCH_LIMIT = Number.MAX_SAFE_INTEGER;

function run() {
	const urls = [
		"https://radiocapital-lh.akamaihd.net/i/RadioCapital_Live_1@196312/master.m3u8",
		"https://novazz.ice.infomaniak.ch/novazz-128.mp3",
		// "https://ledjamradio.ice.infomaniak.ch/ledjamradio.mp3",
	];

	const players = urls.map(url => new Player(url));

	let i = 0;
	const n = players.length;

	players[0].play();

	const runner = function() {
		console.log(i);
		setTimeout(() => {
			players[(i + 1) % n].play(function(success) {
				// wait for new player to play before shutting down the previous one.
				players[i % n].stop();
				if (i < SWITCH_LIMIT && success) {
					i++;
					runner();
				}
			});
		}, SWITCH_DELAY);
	}
	runner();
}


function App() {
	return <button onClick={() => run()}>PLAY</button>;
}

export default App;