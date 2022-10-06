

const noteToPitchMap = {
    'C': 0,
    'C#': 1,
    'Db': 1,
    'D': 2,
    'D#': 3,
    'Eb': 3,
    'E': 4,
    'Fb': 4,
    'E#': 5,
    'F': 5,
    'F#': 6,
    'Gb': 6,
    'G': 7,
    'G#': 8,
    'Ab': 8,
    'A': 9,
    'A#':10,
    'Bb': 10,
    'B': 11,
    'Cb': 11,
    'B#': 0,
}

const pitchToNoteMap = {
}

for (let [key, value] of Object.entries(noteToPitchMap)) {
    if (!pitchToNoteMap[value]) {
        pitchToNoteMap[value] = key;
    }
}

// pitch being an int
function getNoteFromPitch(pitch) {
    pitch = Math.abs(pitch);
    let octave = pitch / 12 + 3;
    return pitchToNoteMap[pitch % 12] + octave.toString();
}

// note ex: C#, Db, E, Ab4
function getPitchFromNote(note) {
    if (!isNaN(parseInt(note.charAt(note.length - 1)))) {
        note = note.substring(0, note.length - 1);
    }
    return noteToPitchMap[note];
}

const chordMap = {
    'maj': [0,4,7],
    '7': [0,4,7,10],
    'min': [0,3,7]
}

function getNextChordFromBeat(beat) {
    let length = Object.keys(midiChords).length;
    let currBeat = beat + 1;
    while (true) {
        if (midiChords[currBeat]) {
            return midiChords
        }

        currBeat += 1;
    }
}