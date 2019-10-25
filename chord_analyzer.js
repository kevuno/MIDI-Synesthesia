
// TODO: No Sharps or Flats for now
var note_order_value = {
    "A0": 0,
    "B0": 1,
    "C1": 2,
    "D1": 3,
    "E1": 4,
    "F1": 5,
    "G1": 6,
    "A2": 7,
    "B2": 8,
    "C2": 9,
    "D2": 10,
    "E2": 11,
    "F2": 12,
    "G2": 13,
    "A3": 14,
    "B3": 15,
    "C3": 16,
    "D3": 17,
    "E3": 18,
    "F3": 19,
    "G3": 20,
    "A4": 21,
    "B4": 22,
    "C4": 23,
    "D4": 24,
    "E4": 25,
    "F4": 26,
    "G4": 27,
    "A5": 28,
    "B5": 29,
    "C5": 30,
    "D5": 31,
    "E5": 32,
    "F5": 33,
    "G5": 34,
    "A6": 35,
    "B6": 36,
    "C6": 37,
    "D6": 38,
    "E6": 39,
    "F6": 40,
    "G6": 41,
}


function get_chord(currently_played_notes){
    // Sort notes
    let chord_notes = Array.from(currently_played_notes).sort(function(a, b){
        return note_order_value[a] - note_order_value[a];
    });

    // TODO: Currently, we use root as the chord, and we determine maj or min from the 3rd interval
    // We should use a more sophisticated library, so that it also takes into account 7ths, 9ths, dim, aug, etc

    let root_note = chord_notes[0];
    let third = chord_notes[1];
    let interval = note_order_value[third] - note_order_value[root_note];

    // Default, chord is major, represented just by the root note without the octave
    let chord_name = root_note[0];
    if(interval == 3){
        // minor chord, add a "m" next to the root note
        chord_name += root_note + "m";
    }
    return chord_name;
}