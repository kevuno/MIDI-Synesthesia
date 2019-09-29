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
        
            // Retrieve a specific input by name
            var input = WebMidi.getInputByName("MPK249 Port A");

            // Create virtual instrumet to play notes
            const synth = new Tone.AMSynth().toMaster()
        
            // Listen for a 'note on'
            // Note that it is monophonic for now, so only one note at a time is played
            input.addListener('noteon', "all",
                function (e) {
                    let played_note = e.note.name + e.note.octave
                    console.log("Received 'noteon' message " + played_note);
                    synth.triggerAttack(played_note)
                }
            );
            
            // Listen to a 'note off' 
            input.addListener('noteoff', "all",
                function (e) {
                    console.log("Received 'noteoff' message (" + e.note.name + e.note.octave + ").");
                    synth.triggerRelease()
                }
            )
        });
    });
});
