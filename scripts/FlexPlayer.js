import WaveSurfer from 'https://cdn.jsdelivr.net/npm/wavesurfer.js@7/dist/wavesurfer.esm.js';
//import * as Tone from "./Tone.js";		// Tone.js is installed at index.html.

/*
 * FlexPlayer Class
 *  parameters:
 *   container
 *   waveColor
 *   progressColor
 *   readyCallback
 *   playCallback
 *   pauseCallback
 *
 *  methods:
 *   load(url)
 *   isPlaying()
 *   pause()
 *   play()
 *   setTempo(value)
 *   setPitch(value)
 *   getCurrentTime()
 *   getDecodedData()
 */
export class FlexPlayer {
	constructor(paramDict) {
		this.readyCallback = paramDict.readyCallback;
		this.playCallback = paramDict.playCallback;
		this.pauseCallback = paramDict.pauseCallback;
		this.audioContext = null;
		this.shifter = null;

		this.wavesurfer = WaveSurfer.create({
			container: paramDict.container,
			waveColor: paramDict.waveColor,
			progressColor: paramDict.progressColor,
			height: paramDict.height,
		});

		this.wavesurfer.on("ready", () => {
			this.readyCallback();
			this.audioContext = new Tone.Context();
			Tone.setContext(this.audioContext);
			const mediaNode = this.audioContext.createMediaElementSource(this.wavesurfer.getMediaElement());

			this.shifter = new Tone.PitchShift({
				windowSize: 0.1,
				delayTime: 0,
				feedback: 0,
				pitch: 0.0,
			}).toDestination();
			Tone.connect(mediaNode, this.shifter);
		});

		this.wavesurfer.on("play", () => {
			this.playCallback();
		});

		this.wavesurfer.on("pause", () => {
			this.pauseCallback();
		});

	}

	load(url) {
		this.wavesurfer.load(url);
	}

	isPlaying() {
		return this.wavesurfer.isPlaying();
	}

	pause() {
		this.wavesurfer.pause();
	}

	play() {
		this.wavesurfer.play();
	}

	setTempo(val) {
		this.wavesurfer.setPlaybackRate(val, true);
	}

	setPitch(val) {
		this.shifter.pitch = val;
	}

	getDuration() {
		return this.wavesurfer.getDuration();
	}

	getCurrentTime() {
		return this.wavesurfer.getCurrentTime();
	}

	setTime(newTime) {
		return this.wavesurfer.setTime(newTime);
	}

	getDecodedData() {
		return this.wavesurfer.getDecodedData();
	}
}
