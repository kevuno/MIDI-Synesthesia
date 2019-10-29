// Create audio context and resume it only after clicking on the Press to Play button
// (required by https://goo.gl/7K7WLu)
var context = new AudioContext();

var chord_to_color = {
    "C": "#fdcb01",
    "C#": "#34034b",
    "D": "#02b3fd",
    "D#": "#f43705",
    "E": "#fa6ffc",
    "F": "#03fc24",
    "F#": "#035844",
    "G": "fc0101",
    "G#": "#0f1869",
    "A": "#fbf5ad",
    "A#": "#01f3fc",
    "B": "#dbbff4"
}

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

        // Change color of screen
        set_canvas_color(chord);
        
    }
    
}

function note_released(currently_played_notes, note_played){
    currently_played_notes.delete(note_played.number);
}


function set_canvas_color(chord_name){
    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext("2d");

    // Remove minor label in case it has it
    if(chord_name.includes("m")){
        chord_name = chord_name.slice(0, -1);
    }
    ctx.fillStyle = chord_to_color[chord_name];
    ctx.fillRect(0, 0, 1000, 600);

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