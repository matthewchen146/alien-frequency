title = "Alien Frequency";

description = `
`;

characters = [
// ufo half
`
     b
    b 
  bbbb
bbbbbb
  bbbb
      
`
];

options = {};

let ufoScale = 1;


// tone and synth

let synth = new Tone.Synth({
    envelope: {
        release: 0
    }
});
let shifter = new Tone.PitchShift(0);
let volume = new Tone.Volume(0).toDestination();
// synth.chain(volume, Tone.Master);
// synth.chain(shifter, Tone.Master);
synth.connect(shifter);
shifter.chain(volume, Tone.Master);
// synth.connect(volume);

let isSynthPlaying = false;

let toneReady = false;

async function startTone() {
    await Tone.start();
    toneReady = true;
    console.log('tone ready');
}

// midi

let midiPlayer = new MidiPlayer.Player((e) => {
    // if (e.track === 3) {
    //     console.log(e);
    // }
});

let midiLoaded = false;

midiPlayer.on('fileLoaded', () => {
    midiLoaded = true;
    console.log('midi loaded')
})

async function loadMidi(url) {
	let response = await fetch(url, {
		method: 'GET',
		mode: 'no-cors'
	});
	let data = await response.arrayBuffer();
    midiPlayer.loadArrayBuffer(data);
    return;
}

midiPlayer.on('endOfFile', () => {
    console.log('midi finished');
});


// howler

let track = new Howl({src: ['./plantasia-no-leads.mp3']});


let midiDivision;
let midiInfo = {};
let leadStartBeat = 17;

// game variables

let lastMeasure = 0;
let lastBeat = -1;
let lastPitch = 0;

let ufoX = 10;
let pitchTopY = 10;
let pitchBottomY = 82;
let pitchHeight = pitchBottomY - pitchTopY;
let pitchRange = 24;
let pitchStart = 8;

// let bottomPitch = 8; // G# / Ab

let currentChords = [];

// let start = Date.now();

let gameState = 'load';

function update() {
    if (!ticks) {
        // start = Date.now();
        lastBeat = -20;
        lastMeasure = -1;

    }

    text(gameState, 22, 3);

    switch (gameState) {
        case 'load':
            startTone();
            loadMidi('./plantasia.mid');
            gameState = 'loading'; 
            return;
        case 'loading':
            if (midiLoaded && toneReady && track.state() === 'loaded') {
                gameState = 'pre';
                midiDivision = midiPlayer.getDivision();

                midiInfo.totalBeats = midiDivision.totalTicks / 960;
                midiInfo.totalMeasures = midiDivision.totalTicks / 960 / 4;
                midiInfo.beatsPerSecond = midiDivision.tempo / 60;
                midiInfo.secondsPerBeat = 60 / midiDivision.tempo;
                midiInfo.ticksPerSecond = 960 * midiDivision.tempo / 60;
                midiInfo.secondsPerTick = 60 / (960 * midiDivision.tempo);
                midiInfo.secondsPerMeasure = 4 * 60 / midiDivision.tempo;
            }
            return;
        case 'pre':
            track.play();
            midiPlayer.play();
            synth.triggerAttack('G#3');
            console.log('started synth');
            gameState = 'running';
            break;
        case 'running':
            let songElapsed = Date.now() - midiDivision.startTime + (midiInfo.secondsPerTick * 1000 * midiDivision.startTick);
            
            let currentBeat = songElapsed / (midiInfo.secondsPerBeat * 1000) + 1;
            let floorCurrentBeat = Math.floor(currentBeat);

            let currentMeasure = songElapsed / (midiInfo.secondsPerMeasure * 1000) + 1;
            let beatWidth = 25;
            let measureWidth = beatWidth * 4;            


            let octaveOffset = 1;

            // draw chord names

            for (let i = 0; i < currentChords.length; i++) {

                let chordData = currentChords[i];
                let x = ufoX + beatWidth * (chordData.beat - currentBeat);
                let y = pitchBottomY + 4;

                let width = beatWidth * chordData.beatLength;

                if (i === currentChords.length - 1) {
                    width = 100;
                }

                if (x < -width && i < currentChords.length - 1) {
                    currentChords.splice(i, 1);
                    i -= 1;
                } else {
                    text(chordData.chord, x, y);

                    // draw chord notes
                    let split = chordData.chord.split('_');
                    let chordNote = split[0];
                    let chordType = split[1];
                    let pitchOffsets = chordMap[chordType];

                    let rectX = x;
                    let rectHeight = pitchHeight / pitchRange;

                    if (i === currentChords.length - 1 && x < 0) {
                        rectX = 0;
                    } 

                    for (let j = 0; j < pitchOffsets.length; j++) {

                        let notePitch = getPitchFromNote(chordNote) + pitchOffsets[j] + octaveOffset * 12;
                        color('red');
                        rect(rectX, pitchBottomY - ((notePitch - pitchStart) / pitchRange) * pitchHeight - rectHeight * .5, width, rectHeight);
                        color('black');
                    }
                    
                }


                // draw measure bars

                rect(ufoX + measureWidth - (currentMeasure % 1) * measureWidth, pitchTopY, 1, pitchHeight)
                rect(ufoX - ((currentMeasure) % 1) * measureWidth, pitchTopY, 1, pitchHeight)

            }

            // create chord names ahead of time

            if (floorCurrentBeat !== lastBeat) {
                lastBeat = floorCurrentBeat;
                let comingBeat = floorCurrentBeat + 4;
                if (comingBeat > leadStartBeat && midiChords[comingBeat]) {
                    if (currentChords.length > 0) {
                        let prevChord = currentChords[currentChords.length - 1];
                        prevChord.beatLength = comingBeat - prevChord.beat;
                    }
                    currentChords.push({
                        beat: comingBeat,
                        chord: midiChords[comingBeat],
                        beatLength: 12
                    })
                }
            }


            let pitchPercent = (pitchBottomY - input.pos.y) / pitchHeight;
            let pitchShift = pitchStart + pitchPercent * pitchRange;
            
            
            // pitchShift = Math.floor(pitchShift);

            // get current chord
            let currentChord;

            for (let i = 0; i < currentChords.length; i++) {
                let chordData = currentChords[i];
                if (currentBeat > chordData.beat && (chordData.length > 1) ? currentBeat < currentChords[i + 1].beat : true) {
                    
                    currentChord = chordData;
                    break;
                }
            }
            
            // note at this point, pitch shift is exact (0 being C, 8 being Ab/G#)
            // getPitchFromNote is also exact, 0 -> C, 8 -> G#/Ab

            if (currentChord) {
                let split = currentChord.chord.split('_');
                let chordNote = split[0];
                let chordType = split[1];
                let pitchOffsets = chordMap[chordType];
                // get closest pitch
                let closestPitch;
                let closestDistance = 0;
                for (let offset of pitchOffsets) {
                    let chordPitch = getPitchFromNote(chordNote) + offset + octaveOffset * 12;
                    let inputPitch = pitchShift;
                    if (!closestPitch) {
                        closestPitch = chordPitch;
                        closestDistance = Math.abs(inputPitch - chordPitch);
                    } else if (Math.abs(inputPitch - chordPitch) < closestDistance) {
                        closestPitch = chordPitch;
                        closestDistance = Math.abs(inputPitch - chordPitch);
                    }
                }
                pitchShift = Math.floor(closestPitch);
            } else {
                pitchShift = Math.floor(pitchShift);
            }

            // console.log(getPitchFromNote('Ab'))

            if (lastPitch !== pitchShift) {
                lastPitch = pitchShift;
                let note = getNoteFromPitch(pitchShift);
                synth.triggerAttack(note);
            }


            // draw ufo

            // let ufoY = input.pos.y;
            let ufoY = pitchBottomY - ((pitchShift - pitchStart) / pitchRange) * pitchHeight;

            char('a', ufoX - 3 * ufoScale, ufoY, {
                scale: {x: ufoScale, y: ufoScale}
            });
            char('a', ufoX + 3 * ufoScale, ufoY, {
                scale: {x: ufoScale, y: ufoScale},
                mirror: {x: -1, y: 1}
            });


            // display beat for testing
            score = floorCurrentBeat

            break;
        default:
            break;
    }


    

    
    
    // shifter.pitch = pitchShift;
    // let note = getNoteFromPitch(pitchShift);
    // synth.triggerAttack(note);

    rect(0, pitchTopY, 100, 1);
    rect(0, pitchBottomY, 100, 1);

    if (input.isJustPressed) {
        synth.triggerRelease();
    }
}