// module
import WaveSurfer from 'https://cdn.jsdelivr.net/npm/wavesurfer.js@7/dist/wavesurfer.esm.js';
import RecordPlugin from "https://unpkg.com/wavesurfer.js@7/dist/plugins/record.esm.js";

/*
 * RecorderSurfer Class
 *  parameters:
 *   micContainer
 *   micHeight
 *   micWaveColor
 *   micProgressColor
 *   progressArea
 *   recContainer
 *   recWaveColor
 *   recProgressColor
 *   recEndCB
 *
 *  methods:
 */
export class RecorderSurfer {
	constructor(paramDict) {
		// Callbacks
		this.recordEndFunc = paramDict.recEndCB;
		this.progressArea = paramDict.progressArea;
		this.saveLink = null;
		// Create an instance of WaveSurfer for monitoring
		this.monitorSurfer = WaveSurfer.create({
			container: paramDict.micContainer,
			height: paramDict.micHeight,
			waveColor: paramDict.micWaveColor,
			progressColor: paramDict.micProgressColor,
		});

		// Initialize the Record plugin
		this.recorder = this.monitorSurfer.registerPlugin(
			RecordPlugin.create({
				scrollingWaveform: false,
				renderRecordedAudio: false,
			})
		);

		// Initialize the recorded surfer
		this.recordedSurfer = WaveSurfer.create({
			container: paramDict.recContainer,
			waveColor: paramDict.recWaveColor,
			progressColor: paramDict.recProgressColor,
		});
		// Play/Pause button
		const button = paramDict.recContainer.appendChild(document.createElement('button'));
		button.textContent = 'Play';
		button.id = "PlayRecordedButton";
		button.disabled = true;
		button.style = "width: 20%; height: 28px;";
		button.onclick = () => this.recordedSurfer.playPause();
		button.addEventListener("focus", () => {button.blur()});
		this.recordedSurfer.on('pause', () => (button.textContent = 'Play'));
		this.recordedSurfer.on('play', () => (button.textContent = 'Pause'));
		// Save link
		this.saveLink = paramDict.recContainer.appendChild(document.createElement('a'));

		
		this.recorder.on("record-end", (blob) => {
			this.duration = this.recorder.getDuration();
			if (this.duration < 100.0)  return;
			this.recordEndFunc(this.duration);
			let recordedUrl = URL.createObjectURL(blob);
			this.recordedSurfer.load(recordedUrl);
			Object.assign(this.saveLink, {
				href: recordedUrl,
				download: 'recording.' + blob.type.split(';')[0].split('/')[1] || 'webm',
				textContent: 'Save recording',
			});
		});

		this.recorder.on("record-progress", (time) => {
			this.updateProgress(time);
		});
	}

	startRecording(param) {
		this.recorder.startRecording(param).then(() => {});
	}

	isRecording() {
		return this.recorder.isRecording();
	}

	recordingStop() {
		this.recorder.stopRecording();
	}




	updateProgress(time) {
		// time will be in milliseconds, convert it to mm:ss format
		let formattedTime = [
			Math.floor(time / 60000), // minutes
			Math.floor((time % 60000) / 1000), // seconds
		].map((v) => (v < 10 ? '0' + v : v)).join(':');
		formattedTime += "." + ("0" + Math.floor((time % 1000) / 10)).slice(-2);
		this.progressArea.textContent = formattedTime;
	}
}
