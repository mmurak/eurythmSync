export function getWavImage(buffer, numOfChannels, sampleRate) {
	const numOfFrames = buffer.byteLength / Float32Array.BYTES_PER_ELEMENT;

	const headerBytes = getWavHeader(
		numOfFrames, 
		numOfChannels, 
		sampleRate
	);
	const wavBytes = new Uint8Array(headerBytes.length + buffer.byteLength);

	wavBytes.set(headerBytes, 0)
	wavBytes.set(new Uint8Array(buffer), headerBytes.length)

	return wavBytes
}


function getWavHeader(numOfFrames, numOfChannels, sampleRate) {

	const blockAlign = numOfChannels * 4;
	const byteRate = sampleRate * blockAlign;
	const dataSize = numOfFrames * blockAlign;

	const buffer = new ArrayBuffer(44);
	const dv = new DataView(buffer);

	let p = 0;

	function writeString(str) {
		for (let i = 0; i < str.length; i++) {
			dv.setUint8(p + i, str.charCodeAt(i))
		}
		p += str.length
	}

	function writeUint32(d) {
		dv.setUint32(p, d, true)
		p += 4
	}

	function writeUint16(d) {
		dv.setUint16(p, d, true)
		p += 2
	}

	writeString("RIFF");	
	writeUint32(dataSize + 36);
	writeString("WAVE");
	writeString("fmt ");
	writeUint32(16);
	writeUint16(3);
	writeUint16(numOfChannels);
	writeUint32(sampleRate);
	writeUint32(byteRate);
	writeUint16(blockAlign);
	writeUint16(32);
	writeString("data");
	writeUint32(dataSize);

	return new Uint8Array(buffer)

}
