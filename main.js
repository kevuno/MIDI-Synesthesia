// Create audio context and resume it only after clicking on the Press to Play button
// (required by https://goo.gl/7K7WLu)
var context = new AudioContext();

document.querySelector('#play').addEventListener('click', function() {
    context.resume().then(() => {
        console.log('Playback Started successfully');

        // Enable Web MIDI
        WebMidi.enable(function (err) {
            if (err) {
                 console.log("WebMidi could not be enabled.", err);
            } else {
                console.log("WebMidi enabled!");
            }

            // List All MIDI inputs
            WebMidi.inputs.forEach(input => {
                console.log(`Input is ${input.id}: ${input.name}`)
            });
        
            // Retrieve input from Midi Keyboard
            var keyboard = WebMidi.getInputByName("MPK249 Port A");

            // Create virtual instrumet to play πnotes
            const synth = new Tone.AMSynth().toMaster();

            var currently_played_notes = new Set();;
        
            // Listen for a 'note on'
            // Note that it is monophonicß, so only one note at a time is played
            keyboard.addListener('noteon', "all",
                function (e) {
                    let played_note = get_webmidi_note_full_name(e);

                    console.log("Received 'noteon' message " + played_note);
                    synth.triggerAttack(played_note);

                    // Register note played
                    note_played(currently_played_notes, played_note);
                }
            );
            
            // Listen to a 'note off' 
            keyboard.addListener('noteoff', "all",
                function (e) {

                    let played_note = get_webmidi_note_full_name(e);
                    console.log("Received 'noteoff' message (" + played_note + ").");
                    synth.triggerRelease();

                    // Remove from notes played
                    currently_played_notes.delete(played_note);
                }
            )
        });
    });
});


function note_played(currently_played_notes, note_played){
    // Only work with triads
    if(currently_played_notes.size >= 3) return;

    currently_played_notes.add(note_played);

    // Analyze chord
    if(currently_played_notes.size == 3){
        let chord = get_chord(currently_played_notes);
        console.log("Chord played!!: " + chord);
    }
    
}

////
/** UTIL FUNCTIONs **/
////

/**
 * Gets the String representation of a WebMidi Note
 */
function get_webmidi_note_full_name(played_note){
    return played_note.note.name + played_note.note.octave;
}