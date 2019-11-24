/**
 * Gets the chord out of a set of currently played notes.
 * 
 * @param currently_played_notes: Array of notes currently pressed
 * 
 * Each note is an object with the following properties:
 * number: The MIDI number useful for sorting and comparing intervals
 * name: The actual name of the note, e.g. A, B, C, etc
 * octave: The octave location of the played note. (not used here but still provided)
 */
export default function get_chord(currently_played_notes){
    // Sort notes
    let chord_notes = currently_played_notes.sort(function(a, b){
        return a.number - b.number;
    });


    // TODO: Currently, we use root as the chord, and we determine maj or min from the 3rd interval
    // We should use a more sophisticated library, so that it also takes into account 7ths, 9ths, dim, aug, etc

    let root_note = chord_notes[0];
    let third = chord_notes[1];
    let interval = third.number - root_note.number;

    // Default, chord is major, represented just by the root note without the octave
    let chord_name = root_note.name;
    if(interval == 3){
        // minor chord, add a "m" next to the root note
        chord_name += "m";
    }
    return chord_name;
}