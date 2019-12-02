import * as PIXI from 'pixi.js'
import demoSongs from './demo-songs/*.mp3'
import get_chord from './chord_analyzer.js'

const MARGIN = 8
let trippyMode = false
const rad15deg = Math.PI / 12
let smallerSide
let current_chord_name = "C"

PIXI.GRAPHICS_CURVES.adaptive = true
PIXI.GRAPHICS_CURVES.maxLength = 5

const app = new PIXI.Application({
    view: document.getElementById('canvas'),
    antialias: true,
    resolution: window.devicePixelRatio,
    backgroundColor: 0x1f1f1f,
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
    if (e.keyCode === 32) app.ticker.stop()
})

// Stop playing if spacebar is pressed
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
    console.log("LOWS:")
    console.log(lowFrequencyData)
    console.log("HIGHS:")
    console.log(highFrequencyData)

    // Drawing the outter ring
    // Get color from current chord
    let outter_ring_color = get_primary_chord_color()
    graphics.lineStyle(1.5, outter_ring_color)
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
    
    let inner_ring_color = get_secondary_chord_color();
    graphics.lineStyle(1.5, inner_ring_color);
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
        // Get Chord name and set global variable
        current_chord_name = get_chord(Array.from(currently_played_notes.values()));
        
        // Change color of screen and display name
        $("#chord").html(current_chord_name);
        // set_canvas_hex_color(get_primary_chord_color());
        
    }
    
}

/**
 * Removes a note from the map of current played notes
 */
function note_released(currently_played_notes, note_played){
    currently_played_notes.delete(note_played.number);
}

/**
 * Sets the background of the canvas
 * @param {hex} color Color number
 */
function set_canvas_hex_color(color){
    app.renderer.backgroundColor = color;
}

/**
 * Gets the name of the chord without any modifiers
 */
function get_current_chord_name_string(){
    // Remove minor label in case it has it
    if(current_chord_name.includes("m")){
        return current_chord_name.slice(0, -1);
    }
    return current_chord_name;
}

/**
 * Gets the primary color of the current chord
 */
function get_background_chord_color(){
    return chord_to_color[get_current_chord_name_string()];
}

/**
 * Gets the primary color of the current chord
 */
function get_primary_chord_color(){
    let color_hex = chord_to_color[get_current_chord_name_string()];
    let shaded_color_str = shadeColor(RGB_hex_to_string(color_hex), 10);
    return RGB_string_to_hex(shaded_color_str);
}

/**
 * Gets the primary color of the current chord
 */
function get_secondary_chord_color(){
    let color_hex = chord_to_color[get_current_chord_name_string()] + 0x030303;
    let shaded_color_str = shadeColor(RGB_hex_to_string(color_hex), 40);
    return RGB_string_to_hex(shaded_color_str);
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

/**
 * Shades the given color by the a given percentage
 * @param {string} color Given in the format #abcdef
 * @param {int} percent Amount of change of shade
 */
function shadeColor(color, percent) {

    var R = parseInt(color.substring(1,3),16);
    var G = parseInt(color.substring(3,5),16);
    var B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    if (R == 0) R = 32; if (G == 0) G = 32; if (B == 0) B = 32;

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

        console.log("#"+RR+GG+BB)
    return "#"+RR+GG+BB;
}


/**
 * Converts a hex number into a color hex string
 * @param {hex} number  in the format "0x123456"
 */
function RGB_hex_to_string(hex){
    return "#" + hex.toString(16);
}

/**
 * Converts a color hex string into a hex number
 * @param {str} string  in the format "#abcdef"
 */
function RGB_string_to_hex(str){
    return parseInt("0x" + str.substring(1))
}