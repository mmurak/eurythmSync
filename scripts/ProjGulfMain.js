// module
import WaveSurfer from 'https://cdn.jsdelivr.net/npm/wavesurfer.js@7/dist/wavesurfer.esm.js';
import RecordPlugin from "https://unpkg.com/wavesurfer.js@7/dist/plugins/record.esm.js";
import { FieldEnabler } from "./FieldEnabler.js";
import { FlexPlayer } from "./FlexPlayer.js";
import { getWavImage } from "./WavImage.js";
import { RecorderSurfer } from "./RecorderSurfer.js";

class GlobalManager {
	constructor() {
		this.inputFile = document.getElementById("InputFile");
		this.timerField = document.getElementById("TimerField");
		this.totalDuration = document.getElementById("TotalDuration");
		this.zoomIn = document.getElementById("ZoomIn");
		this.zoomOut = document.getElementById("ZoomOut");
		this.playPause = document.getElementById("PlayPause");
		this.speedDigits = document.getElementById("SpeedDigits");
		this.speedVal = document.getElementById("SpeedVal");
		this.defaultSpeedButton = document.getElementById("DefaultSpeedButton");
		this.pitchDigits = document.getElementById("PitchDigits");
		this.pitchVal = document.getElementById("PitchVal");
		this.defaultPitchButton = document.getElementById("DefaultPitchButton");
		this.jumpSelector = document.getElementById("JumpSelector");
		this.leftArrowButton = document.getElementById("LeftArrowButton");
		this.rightArrowButton = document.getElementById("RightArrowButton");
		this.container = document.getElementById("recordings");
		this.progress = document.getElementById("Progress");
		this.recButton = document.getElementById("RecButton");
		this.micSelect = document.getElementById("mic-select");
		this.modelDiv = document.getElementById("modelDiv");
		this.modelPlay = document.getElementById("ModelPlay");
		this.startBack = document.getElementById("StartBack");
		this.startForward = document.getElementById("StartForward");
		this.endBack = document.getElementById("EndBack");
		this.endForward = document.getElementById("EndForward");

		this.flexPlayer = null;
		this.recorderSurfer = null;
		this.modelSurfer = null;
		this.fixedDuration = 0;
		this.inRec = false;

		this.currentZoomFactor = 10;
		this.minimumZoomFactor = 10;
		this.zoomDelta = 10;
		this.storedZoomFactor = 10;
		this.timer;
		this.timerObj = null;

		this.speedStorage = 1;
		this.defaultSpeedLabel = "1x Speed";

		this.pitchStorage = 0;
		this.defaultPitchLabel = "Pitch 0";

		this.fieldEnabler = new FieldEnabler([
			"InputFile",
			"PlayPause",
			"SpeedVal",
			"DefaultSpeedButton",
			"LeftArrowButton",
			"RightArrowButton",
			"PitchVal",
			"DefaultPitchButton",
			"RecButton",
			"StartBack",
			"StartForward",
			"ModelPlay",
			"EndBack",
			"EndForward",
		]);

		this.audioContext = null;
		this.shifter = null;

		this.fieldEnabler.setEnable(["InputFile"]);

	}
}
const G = new GlobalManager();

/*
 * Base waveSurfer
 */

// File input
G.inputFile.addEventListener("change", (e) => {
	let file = G.inputFile.files[0];
	if (file) {
		if (G.flexPlayer != null) {
			G.flexPlayer.wavesurfer.destroy();
		}
		G.flexPlayer = new FlexPlayer({
			container: '#waveform',
			waveColor: '#00BFFF',
			progressColor: '#87CEBB',
			readyCallback: 	readyCB,
			playCallback: playCB,
			pauseCallback: pauseCB,
			height: 100,
		});
		const url = URL.createObjectURL(file);
		G.flexPlayer.wavesurfer.on("timeupdate", (time) => {
			updateProgressFromSec(time);
		});
		G.flexPlayer.load(url);
		G.fieldEnabler.setEnable([
			"InputFile",
		]);
	}
});
G.inputFile.addEventListener("focus", () => {G.inputFile.blur()});	// this is to prevent activation by key-input.

// Play/Pause control
G.playPause.addEventListener("click", playPauseControl);

// Reset play speed
G.defaultSpeedButton.addEventListener("click", () => {
	resetPlaySpeed();
});
function resetPlaySpeed() {
	if (G.speedVal.value == 1.0) {
		G.speedVal.value = G.speedStorage;
		G.defaultSpeedButton.value = G.defaultSpeedLabel;
	} else {
		G.speedVal.value = 1.0;
		G.defaultSpeedButton.value = G.speedStorage + "x Speed";
	}
	G.speedVal.dispatchEvent(new Event("input"));
}

// Left Button (REW) click
G.leftArrowButton.addEventListener("click", leftButtonClick);
function leftButtonClick() {
	G.flexPlayer.setTime(G.flexPlayer.getCurrentTime() - Number(G.jumpSelector.value));
}

// Right Button (FF) click
G.rightArrowButton.addEventListener("click", rightButtonClick);
function rightButtonClick() {
	G.flexPlayer.setTime(G.flexPlayer.getCurrentTime() + Number(G.jumpSelector.value));
}

// Change play speed
G.speedVal.addEventListener("input", _changePlaySpeed);
function _changePlaySpeed() {
	const sp = Number(G.speedVal.value).toFixed(2);
	G.speedDigits.innerHTML = sp;
	if (sp != 1) {
		G.speedStorage = sp;
		G.defaultSpeedButton.value = G.defaultSpeedLabel;
	}
	G.flexPlayer.setTempo(G.speedVal.value);
}
G.speedVal.addEventListener("focus", () => { G.speedVal.blur(); });

// Reset play pitch
G.defaultPitchButton.addEventListener("click", () => {
	resetPlayPitch();
});
function resetPlayPitch() {
//	shiftPitch(0);
	if (G.pitchVal.value == 0) {
		G.pitchVal.value = (G.pitchStorage * 100.0).toFixed(2);
		G.defaultPitchButton.value = G.defaultPitchLabel;
	} else {
		G.pitchVal.value = 0;
		G.defaultPitchButton.value = "Pitch " + G.pitchStorage;
	}
	G.pitchVal.dispatchEvent(new Event("input"));
}

// Change play pitch
G.pitchVal.addEventListener("input", _changePlayPitch);
function _changePlayPitch() {
	const pitch = (Number(G.pitchVal.value) / 100.0).toFixed(2);
	G.pitchDigits.innerHTML = pitch;
	if (pitch != 0) {
		G.pitchStorage = pitch;
		G.defaultPitchButton.value = G.defaultPitchLabel;
	}
	G.flexPlayer.setPitch(Number(G.pitchVal.value) / 100.0);
}
G.pitchVal.addEventListener("focus", () => { G.pitchVal.blur(); });

// Callback functions (for fieldEnabler)
function readyCB() {
	G.fieldEnabler.setEnable([
		"InputFile",
		"PlayPause",
		"SpeedVal",
		"DefaultSpeedButton",
		"LeftArrowButton",
		"RightArrowButton",
		"PitchVal",
		"DefaultPitchButton",
		"RecButton",
	]);
	G.zoomIn.disabled = false;
	G.zoomOut.disabled = true;

	G.currentZoomFactor = Math.trunc(window.innerWidth / G.flexPlayer.wavesurfer.getDuration());
	if (G.currentZoomFactor < 1)
		G.currentZoomFactor = 1;
	G.minimumZoomFactor = G.currentZoomFactor;
	G.zoomDelta = G.currentZoomFactor;
	G.storedZoomFactor = G.currentZoomFactor;
	G.flexPlayer.wavesurfer.zoom(G.currentZoomFactor);

	G.speedVal.value = 1.0;
	G.defaultSpeedButton.value = G.defaultSpeedLabel;
	G.speedDigits.innerHTML = Number(G.speedVal.value).toFixed(2);
	G.speedStorage = 1;
	G.pitchVal.value = 0;
	G.defaultPitchButton.value = G.defaultPitchLabel;
	G.pitchDigits.innerHTML = (Number(G.pitchVal.value) / 100.0).toFixed(2);
	G.pitchStorage = 0;
	G.totalDuration.innerHTML = convertTimeRep(G.flexPlayer.wavesurfer.getDuration());
}
function playCB() {
	G.fieldEnabler.setEnable([
		"PlayPause",
		"SpeedVal",
		"DefaultSpeedButton",
		"LeftArrowButton",
		"RightArrowButton",
		"PitchVal",
		"DefaultPitchButton",
		"RecButton",
	]);
	G.playPause.value = "Pause";
}
function pauseCB() {
	G.fieldEnabler.setEnable([
		"InputFile",
		"PlayPause",
		"SpeedVal",
		"DefaultSpeedButton",
		"LeftArrowButton",
		"RightArrowButton",
		"PitchVal",
		"DefaultPitchButton",
		"RecButton",
	]);
	G.playPause.value = "Play";
}

function playPauseControl() {
	if (G.flexPlayer.isPlaying()) {
		G.flexPlayer.pause();
	} else {
		G.flexPlayer.play();
	}
}

document.addEventListener("keydown", (evt) => {
	if (G.playPause.disabled)  return;
	if (evt.key == " ") {
		playPauseControl();
		evt.preventDefault();
	} else if (evt.key == "ArrowLeft") {
		leftButtonClick();
	} else if (evt.key == "ArrowRight") {
		rightButtonClick();
	} else if ((evt.key >= "1") && (evt.key <= 9)) {
		let delta = (evt.ctrlKey) ? Number(evt.key) : -Number(evt.key);
		G.flexPlayer.setTime(G.flexPlayer.getCurrentTime() + delta);
	} else if (evt.key == "ArrowUp") {
		G.speedVal.value = Number(G.speedVal.value) + 0.05;
		_changePlaySpeed();
	} else if (evt.key == "ArrowDown") {
		G.speedVal.value = Number(G.speedVal.value) - 0.05;
		_changePlaySpeed();
	} else if ((evt.key == "d") || (evt.key == "D")) {
		resetPlaySpeed();
	} else if ((evt.key == "p") || (evt.key == "P")) {
		resetPlayPitch();
	} else if ((evt.key == "i") || (evt.key == "I")) {
		processZoomIn(evt);
	} else if ((evt.key == "o") || (evt.key == "O")) {
		processZoomOut(evt);
	}
	evt.stopPropagation();
	evt.preventDefault();
	return false;
});

// Double-click disabler
document.addEventListener("dblclick", (e) => {
	e.preventDefault();
});

G.jumpSelector.addEventListener("change", (evt) => {
	evt.preventDefault();
});

G.zoomIn.addEventListener("click", (evt) => { processZoomIn(evt); });
function processZoomIn(evt) {
	G.zoomOut.disabled = false;
	if (evt.ctrlKey) {
		G.currentZoomFactor = G.storedZoomFactor;
	} else {
		G.currentZoomFactor += G.zoomDelta;
		G.storedZoomFactor = G.currentZoomFactor;
	}
	G.flexPlayer.wavesurfer.zoom(G.currentZoomFactor);
}

G.zoomOut.addEventListener("click", (evt) => { processZoomOut(evt); });
function processZoomOut(evt) {
	if (G.currentZoomFactor > G.minimumZoomFactor) {
		if (evt.ctrlKey) {
			G.storedZoomFactor = G.currentZoomFactor;
			G.currentZoomFactor = G.minimumZoomFactor;
		} else {
			G.currentZoomFactor -= G.zoomDelta;
		}
		G.flexPlayer.wavesurfer.zoom(G.currentZoomFactor);
		if (G.currentZoomFactor == G.minimumZoomFactor) {
			G.zoomOut.disabled = true;
		}
	}
}

/*
 * END OF Base waveSurfer
 */






/*
createFrameSurfer();
*/
G.recorderSurfer = new RecorderSurfer({
	micContainer: "#mic",
	micHeight: 30,
	micWaveColor: "rgb(255, 0, 0)",
	micProgressColor: "rgb(255, 0, 0)",
	progressArea: G.progress,
	recContainer: G.container,
	recWaveColor:  "rgb(0, 0, 255)",
	recProgressColor: "rgb(0, 0, 128)",
	recEndCB: createModelSurfer,
});



/* 
 * Utility functions
 */

// Microphone selector
async function populateMicSelect() {
	try {
		const devices = await RecordPlugin.getAvailableAudioDevices();
		devices.forEach((device) => {
			const option = document.createElement('option');
			option.value = device.deviceId;
			option.text = device.label || device.deviceId;
			G.micSelect.appendChild(option);
		});
	} catch (error) {
		console.error("Error fetching audio devices:", error);
		// Handle error appropriately, like showing an error message
	}
}
// Call the function
populateMicSelect();



function convertTimeRep(time) {
	let formattedTime = [
		Math.floor(time / 60), // minutes
		Math.floor(time % 60), // seconds
	].map((v) => (v < 10 ? '0' + v : v)).join(':');
	formattedTime += "." + ("" + Math.trunc(time * 100) % 100).padStart(2, "0");
	return formattedTime;
}

function updateProgressFromSec(time) {
	G.timerField.innerHTML = convertTimeRep(time);
}



G.recButton.addEventListener("mousedown", (evt) => {
	if (G.flexPlayer.isPlaying()) {
		G.flexPlayer.pause();
	}
	G.fieldEnabler.setEnable([
		"RecButton",
	]);
	document.getElementById("PlayRecordedButton").disabled = true;
	G.recButton.value = 'Release to Stop';
	const deviceId = G.micSelect.value;
	G.recorderSurfer.startRecording({ deviceId });
	G.inRec = true;
});

G.recButton.addEventListener("mouseup", recordingStop);
G.recButton.addEventListener("mouseleave", recordingStop);

// Double-click disabler for recording button
G.recButton.addEventListener("dblclick", (evt) => {
	setTimeout(recordingStop, 300);
	evt.preventDefault();
});


function recordingStop() {
	if (G.inRec && !G.recorderSurfer.isRecording()) {	// dirty patch to remedy timing glitch
		setTimeout(recordingStop, 50);
		return;
	}
	G.recorderSurfer.recordingStop();
	G.recButton.value = 'Press to Record';
	G.inRec = false;
}



G.modelPlay.onclick = () => {
	if (G.modelSurfer.isPlaying()) {
		G.modelSurfer.pause();
	} else {
		G.modelSurfer.setTempo(G.modelTempo);
		G.modelSurfer.setPitch(G.modelPitch);
		G.modelSurfer.play();
	}
}
G.modelPlay.addEventListener("focus", () => {G.modelPlay.blur()});	// this is to prevent activation by key-input.

function readyCallback() {
}
function playCallback() {
	G.modelPlay.value = "Pause model track";
}
function pauseCallback() {
	G.modelPlay.value = "Play model track";
}



function createModelSurfer(duration) {
	G.fieldEnabler.setEnable([
		"InputFile",
		"PlayPause",
		"SpeedVal",
		"DefaultSpeedButton",
		"LeftArrowButton",
		"RightArrowButton",
		"PitchVal",
		"DefaultPitchButton",
		"RecButton",
		"StartBack",
		"StartForward",
		"ModelPlay",
		"EndBack",
		"EndForward",
//		"PlayRecordedButton",
]);
	document.getElementById("PlayRecordedButton").disabled = false;

	G.fixedDuration = Number(G.speedVal.value) * duration;
	G.modelTempo = Number(G.speedVal.value);
	G.modelPitch = Number(G.pitchVal.value) / 100.0;
	createModelSurferBody();
}

function createModelSurferBody() {
	let endTime = G.flexPlayer.getCurrentTime();
	let startTime = endTime - G.fixedDuration / 1000.0;
	if (startTime < 0)  startTime = 0;
	let audioBuffer = G.flexPlayer.getDecodedData();
	let noc = audioBuffer.numberOfChannels;
	let sr = audioBuffer.sampleRate;
	const nod = Math.floor((endTime - startTime) * sr);

	let ptrList = [];
	for (let ch = 0; ch < noc; ch++) {
		const channelData = audioBuffer.getChannelData(ch);
		ptrList.push(channelData);
	}
	const interleaved = new Float32Array(nod * noc);
	let sourcePtr = Math.floor(startTime * sr);
	let destPtr = 0;
	for (let i = 0; i < nod; i++) {
		for (let chdata of ptrList) {
			interleaved[destPtr++] = chdata[sourcePtr];
		}
		sourcePtr++;
	}



	const wavBytes = getWavImage(interleaved.buffer, noc, sr);
	const wav = new Blob([wavBytes], { type: 'audio/wav' });
	let url = URL.createObjectURL(wav);

	if (G.modelSurfer != null) {
		G.modelSurfer.wavesurfer.destroy();
	}

	G.modelSurfer = new FlexPlayer({
		container: "#modelDiv",
		waveColor: 'rgb(0, 128, 0)',
		progressColor: 'rgb(0, 128, 0)',
		readyCallback: 	readyCallback,
		playCallback: playCallback,
		pauseCallback: pauseCallback,
		height: 100,
	});
	G.modelSurfer.load(url);

}

G.endBack.addEventListener("click", () => {
	let delta = getDelta();
	let t = G.flexPlayer.getCurrentTime() - delta;
	if (t < 0)  t = 0.0;
	G.flexPlayer.setTime(t);
	G.fixedDuration -= (delta * 1000);
	if (G.fixedDuration < 0) G.fixedDuration = 0;
	createModelSurferBody();
});
G.endBack.addEventListener("focus", () => { G.endBack.blur(); });
G.endForward.addEventListener("click", () => {
	let delta = getDelta();
	let t = G.flexPlayer.getCurrentTime() + delta;
	let max = G.flexPlayer.getDuration();
	if (t > max)  t = max;
	G.flexPlayer.setTime(t);
	G.fixedDuration += (delta * 1000);
	let fence = G.flexPlayer.getCurrentTime() * 1000;
	if (G.fixedDuration > fence) G.fixedDuration = fence;
	createModelSurferBody();
});
G.endForward.addEventListener("focus", () => { G.endForward.blur(); });
G.startBack.addEventListener("click", () => {
	let delta = getDelta();
	G.fixedDuration += (delta * 1000);
	let fence = G.flexPlayer.getCurrentTime() * 1000;
	if (G.fixedDuration > fence) G.fixedDuration = fence;
	createModelSurferBody();
});
G.startBack.addEventListener("focus", () => { G.startBack.blur(); });
G.startForward.addEventListener("click", () => {
	let delta = getDelta();
	G.fixedDuration -= (delta * 1000);
	if (G.fixedDuration < 0) G.fixedDuration = 0;
	createModelSurferBody();
});
G.startForward.addEventListener("focus", () => { G.startForward.blur(); });
function getDelta() {
	return Number(G.speedVal.value) * 0.1;
}
