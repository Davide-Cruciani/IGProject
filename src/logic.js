import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Character } from './Character.js'
import { readConfigs } from './configLoader.js';

const DEBUG_ON = true;
const TIME_QUANTA = 1e-2;

var clock = 0;
var lastInstant = 0;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.rotateX(Math.PI/4);
camera.translateZ(5);


const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const textRenderer = new CSS2DRenderer();
textRenderer.domElement.style.position = 'absolute';
textRenderer.domElement.style.top = '0';
textRenderer.domElement.style.pointerEvents = 'none';
textRenderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(textRenderer.domElement);

class TextObject extends CSS2DObject{
    constructor(text) {
        var div = document.createElement('div');
        div.className = 'label';
        div.textContent = text;
        div.style.marginTop = '-1em';
        div.style.color = 'white';
        div.id = 'info';
        super(div);
        this.baseEntity = div;
    };
}

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x505050));

readConfigs('./configs/playerCharacterConfigs.json').then((res)=>{
    if (DEBUG_ON) console.log(res);
    const player = new Character('./assets/E-45-Aircraft', scene, res);
    window.player = player;
})



var currentKeys = {
    'a': 0,
    'd': 0,
    's': 0,
    'w': 0,
    'space':0
}

document.addEventListener('keydown', (event)=>{
    switch (event.key.toLowerCase()) {
        case 'a':
            currentKeys['a'] = (event.shiftKey)? 2: 1;
            currentKeys['d'] = 0;
            if (DEBUG_ON) console.log(event.key);
            break;
        case 'c':
            currentKeys['c'] = 1;
            if (DEBUG_ON) console.log(event.key);
            break;
        case 'd':
            currentKeys['d'] = (event.shiftKey)? 2: 1;
            currentKeys['a'] = 0;
            if (DEBUG_ON) console.log(event.key);
            break;
        case 'w':
            currentKeys['w'] = (event.shiftKey)? 2: 1;
            currentKeys['s'] = 0;
            if (DEBUG_ON) console.log(event.key);
            break;
        case 's':
            currentKeys['s'] = (event.shiftKey)? 2: 1;
            currentKeys['w'] = 0;
            if (DEBUG_ON) console.log(event.key);
            break;
        case ' ':
            currentKeys['space'] = 1;
            break;
        default:
            if (DEBUG_ON) console.log('Unknown key: ' + event.key);
            break;
    }
});

document.addEventListener('keyup', (event)=>{
    switch (event.key.toLowerCase()) {
        case 'a':
            currentKeys['a'] = 0;
            break;
        case 'c':
            currentKeys['c'] = 0;
            break;
        case 'd':
            currentKeys['d'] = 0;
            break;
        case 'w':
            currentKeys['w'] = 0;
            break;
        case 's':
            currentKeys['s'] = 0;
            break;
        case ' ':
            currentKeys['space'] = 0;
            break;
        default:
            break;
    }
});

document.addEventListener('wheel', (ev)=>{
    camera.translateZ(ev.deltaY/100);
})

window.setInterval(()=>{ clock+=1; }, TIME_QUANTA);

renderer.setAnimationLoop(()=>{
    var dt = clock - lastInstant;
    lastInstant = clock;
    if (window.player && window.player.loaded)
        window.player.update(currentKeys, dt);
    renderer.render(scene, camera);
    textRenderer.render(scene, camera);
    if (clock > 1e5){
        clock = 0;
        lastInstant = 0;
    }
});
