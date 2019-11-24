import * as PIXI from 'pixi.js'
import demoSongs from './demo-songs/*.mp3'
import get_chord from './chord_analyzer.js'

const MARGIN = 8
let trippyMode = false
const rad15deg = Math.PI / 12
let smallerSide

PIXI.GRAPHICS_CURVES.adaptive = true
PIXI.GRAPHICS_CURVES.maxLength = 5

const app = new PIXI.Application({
    view: document.getElementById('canvas'),
    antialias: true,
    resolution: window.devicePixelRatio,
    backgroundColor: 0x0f0f0f,
    autoDensity: true
})

app.ticker.maxFPS = 120
app.ticker.minFPS = 120


window.addEventListener('resize', resize, false)
resize()
function resize() {
    app.renderer.resize(window.innerWidth, window.innerHeight)
    smallerSide = Math.min(window.innerWidth, window.innerHeight)
}

const graphics = new PIXI.Graphics()
app.stage.addChild(graphics)

const UI = document.getElementById('ui')
function toggleUI() {
    if (!UI.style.visibility || UI.style.visibility === 'visible') UI.style.visibility = 'hidden'
    else UI.style.visibility = 'visible'
}
document.addEventListener('keydown', e => {
    if (e.keyCode === 72) toggleUI()
})

document.getElementById('record').onclick = e => {
    if (navigator.mediaDevices) {
        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then(stream => changeInput(e.target, stream))
            .catch(err => console.log('The following gUM error occured: ' + err))
    } else {
        console.log('getUserMedia not supported on your browser!')
    }
}

const songs = document.getElementsByClassName('song')
for (const song of songs) {
    song.addEventListener('pointerdown', () => {
        changeInput(song, audioEl)
    })
}

document.getElementById('trippy').onclick = e => {
    initAudioContext()
    trippyMode = !trippyMode
    if (trippyMode) {
        e.target.classList.add('active')

        lowAnalyzer.smoothingTimeConstant = 0.83
        highAnalyzer.smoothingTimeConstant = 0.78
    } else {
        e.target.classList.remove('active')

        lowAnalyzer.smoothingTimeConstant = 0.89
        highAnalyzer.smoothingTimeConstant = 0.87
    }
}

const audioEl = document.createElement('audio')

document.body.appendChild(audioEl)

let activeSongEl
let audioSourceNode
let mediaStreamAudioSourceNode
let mediaElementAudioSourceNode

function changeInput(htmlEl, input) {
    if (activeSongEl === htmlEl) return

    if (activeSongEl) activeSongEl.classList.remove('active')
    htmlEl.classList.add('active')
    activeSongEl = htmlEl

    initAudioContext()
    initMIDIDetection()

    if (audioSourceNode !== undefined) audioSourceNode.disconnect()

    if (input instanceof MediaStream) {
        audioEl.pause()

        if (mediaStreamAudioSourceNode === undefined) {
            mediaStreamAudioSourceNode = audioCtx.createMediaStreamSource(input)
        }

        mediaStreamAudioSourceNode.connect(lowFilter)
        mediaStreamAudioSourceNode.connect(highFilter)
        audioSourceNode = mediaStreamAudioSourceNode
    } else if (input instanceof HTMLAudioElement) {
        audioEl.src = demoSongs[htmlEl.dataset.id]
        audioEl.play()

        if (mediaElementAudioSourceNode === undefined) {
            mediaElementAudioSourceNode = audioCtx.createMediaElementSource(input)
        }

        mediaElementAudioSourceNode.connect(lowFilter)
        mediaElementAudioSourceNode.connect(highFilter)
        mediaElementAudioSourceNode.connect(audioCtx.destination)
        audioSourceNode = mediaElementAudioSourceNode
    }
}

let audioCtx
let lowFilter
let highFilter
let lowAnalyzer
let highAnalyzer

function initAudioContext() {
    if (audioCtx) return

    audioCtx = new AudioContext()

    lowAnalyzer = audioCtx.createAnalyser()
    lowAnalyzer.minDecibels = -80
    lowAnalyzer.maxDecibels = -20
    lowAnalyzer.fftSize = 32
    lowAnalyzer.smoothingTimeConstant = 0.89
    const lowFrequencyData = new Uint8Array(lowAnalyzer.frequencyBinCount)

    highAnalyzer = audioCtx.createAnalyser()
    highAnalyzer.minDecibels = -80
    highAnalyzer.maxDecibels = -20
    highAnalyzer.fftSize = 32
    highAnalyzer.smoothingTimeConstant = 0.87
    const highFrequencyData = new Uint8Array(highAnalyzer.frequencyBinCount)

    lowFilter = audioCtx.createBiquadFilter()
    lowFilter.type = 'lowpass'
    lowFilter.frequency.setValueAtTime(200, 0)

    highFilter = audioCtx.createBiquadFilter()
    highFilter.type = 'highpass'
    highFilter.frequency.setValueAtTime(200, 0)

    lowFilter.connect(lowAnalyzer)
    highFilter.connect(highAnalyzer)

    app.ticker.add(() => {
        graphics.clear()
        draw(lowFrequencyData, highFrequencyData)
    })

}


function draw(lowFrequencyData, highFrequencyData){
    lowAnalyzer.getByteFrequencyData(lowFrequencyData)
    highAnalyzer.getByteFrequencyData(highFrequencyData)

    // Drawing the outter ring
    graphics.lineStyle(1.5, 0x009688)
    console.log("LOWS:")
    console.log(lowFrequencyData)
    for (let i = 0; i < lowFrequencyData.length; i++) {
        if (lowFrequencyData[i] !== 0) {
            const R = (lowFrequencyData[i] * smallerSide) / 512
            if (trippyMode) graphics.lineStyle(1.5, 0xffffff * Math.random())
            drawArcV1(R, 1, 5)
            drawArcV1(R, 7, 11)
            drawArcV1(R, 13, 17)
            drawArcV1(R, 19, 23)
        }
    }

    // Drawing the inner ring
    console.log("HIGHS:")
    console.log(highFrequencyData)
    graphics.lineStyle(1.5, 0xff9800)
    for (let i = 0; i < highFrequencyData.length; i++) {
        if (highFrequencyData[i] !== 0) {
            const R = (highFrequencyData[i] * smallerSide) / 1024
            if (trippyMode) graphics.lineStyle(1.5, 0xffffff * Math.random())
            drawArcV2(i, R, 1, 5)
            drawArcV2(i, R, 7, 11)
            drawArcV2(i, R, 13, 17)
            drawArcV2(i, R, 19, 23)
        }
    }
}


function drawArcV1(r, a, b) {
    const v = 0.75 - r / (smallerSide / 2 - MARGIN)
    const A = rad15deg * a + v
    const B = rad15deg * b - v
    if (B > A) {
        drawArc(r, A, B)
    }
}

function drawArcV2(i, r, a, b) {
    drawArc(r, rad15deg * (a + i), rad15deg * (b + i), true)
}

function drawArc(radius, startAngle, endAngle, spikes = false) {
    const X = window.innerWidth / 2
    const Y = window.innerHeight / 2
    const startX = X + Math.cos(startAngle) * (radius - MARGIN)
    const startY = Y + Math.sin(startAngle) * (radius - MARGIN)
    graphics.moveTo(startX, startY)
    graphics.arc(X, Y, radius - MARGIN - (spikes ? 4 : 0), startAngle, endAngle)
}


/// MIDI additions ///

var chord_to_color = {
    "C": 0xfdcb01,
    "C#": 0x34034b,
    "D": 0x02b3fd,
    "D#": 0xf43705,
    "E": 0xfa6ffc,
    "F": 0x03fc24,
    "F#": 0x035844,
    "G": 0xfc0101,
    "G#": 0x0f1869,
    "A": 0xfbf5ad,
    "A#": 0x01f3fc,
    "B": 0xdbbff4
}

function initMIDIDetection(){
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
        // const synth = new Tone.AMSynth().toMaster();

        var currently_played_notes = new Map();
    
        // Listen for a 'note on'
        // Note that it is monophonicß, so only one note at a time is played
        keyboard.addListener('noteon', "all",
            function (e) {
                let played_note = get_webmidi_note_full_name(e);

                console.log("Received 'noteon' message " + played_note);
                // synth.triggerAttack(played_note);

                // Register note played
                note_played(currently_played_notes, e.note);
            }
        );
        
        // Listen to a 'note off' 
        keyboard.addListener('noteoff', "all",
            function (e) {
                let played_note = get_webmidi_note_full_name(e);
                console.log("Received 'noteoff' message " + played_note);
                // synth.triggerRelease();

                // Remove from notes played
                note_released(currently_played_notes, e.note);
            }
        )
    });
}

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
    // Remove minor label in case it has it
    if(chord_name.includes("m")){
        chord_name = chord_name.slice(0, -1);
    }
    app.backgroundColor = chord_to_color[chord_name];
    app.renderer.backgroundColor = chord_to_color[chord_name];

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