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
                $("#content").show();
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

            var currently_played_notes = new Map();
        
            // Listen for a 'note on'
            // Note that it is monophonicß, so only one note at a time is played
            keyboard.addListener('noteon', "all",
                function (e) {
                    let played_note = get_webmidi_note_full_name(e);

                    console.log("Received 'noteon' message " + played_note);
                    synth.triggerAttack(played_note);

                    // Register note played
                    note_played(currently_played_notes, e.note);
                }
            );
            
            // Listen to a 'note off' 
            keyboard.addListener('noteoff', "all",
                function (e) {
                    let played_note = get_webmidi_note_full_name(e);
                    console.log("Received 'noteoff' message " + played_note);
                    synth.triggerRelease();

                    // Remove from notes played
                    note_released(currently_played_notes, e.note);
                }
            )
        });
    });
});


function note_played(currently_played_notes, note_played){
    console.log(currently_played_notes);
    if(currently_played_notes.size >= 3) return;

    // Add note to chord
    currently_played_notes.set(note_played.number,  note_played);

    // Analyze chord only of there are 3 notes
    if(currently_played_notes.size == 3){
        let chord = get_chord(Array.from(currently_played_notes.values()));
        $("#chord").html(chord);
        console.log("Chord played!!: " + chord);
        
    }
    
}

function note_released(currently_played_notes, note_played){
    currently_played_notes.delete(note_played.number);
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