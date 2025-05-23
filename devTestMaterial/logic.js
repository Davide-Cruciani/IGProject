import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';


const DEBUG_ON = true;
const TIME_QUANTA = 1e-2;
const BASE_DRAG = 1.001;
const BREAKS_DRAG = 2;

var clock = 0;
var lastInstant = 0;



const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
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

class Character extends THREE.Mesh{
    constructor(){
        var geometry = new THREE.BoxGeometry(2,2,2);
        var material = new THREE.MeshBasicMaterial({color: 0xffffff});
        super(geometry, material);
        this.geometry = geometry;
        this.material = material;
        this.velocity = 0;
        this.angVelocity = 0;
        this.acceleration = 0.01;
        this.angAcceleration = 0.01;
        this.dir = new THREE.Vector3(1,0,0); 
    };
    update(keys, time){
        var a = keys['a'];
        var d = keys['d'];
        var w = keys['w'];
        var s = keys['s'];
        if (w>0) this.velocity += this.acceleration*((a===2)? 0.1: 1) * time;
        else if(s>0) this.velocity -= this.acceleration*((d===2)? 0.1: 1) * time;
        
        if (a>0) this.angVelocity += this.angAcceleration*((w===2)? 0.1: 1) * time;
        else if(d>0) this.angVelocity -= this.angAcceleration*((s===2)? 0.1: 1) * time;
        
        var drag = (keys['space'])? BREAKS_DRAG: BASE_DRAG; 

        this.velocity /= drag
        this.angVelocity /= drag

        this.translateY(this.velocity * time);
        this.rotateZ(this.angVelocity * time);
    }
}

const player = new Character();
const label = new TextObject('Name');

scene.add(player);
player.add(label);
label.position.set(0,0,1.5);

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
            if (DEBUG_ON) console.log(event.key);
            break;
    }
});

document.addEventListener('keyup', (event)=>{
    switch (event.key.toLowerCase()) {
        case 'a':
            currentKeys['a'] = 0;
            if (DEBUG_ON) console.log(event.key);
            break;
        case 'd':
            currentKeys['d'] = 0;
            if (DEBUG_ON) console.log(event.key);
            break;
        case 'w':
            currentKeys['w'] = 0;
            if (DEBUG_ON) console.log(event.key);
            break;
        case 's':
            currentKeys['s'] = 0;
            if (DEBUG_ON) console.log(event.key);
            break;
        case ' ':
            currentKeys['space'] = 0;
            break;
        default:
            if (DEBUG_ON) console.log(event.key);
            break;
    }
});


window.setInterval(()=>{ clock+=1; }, TIME_QUANTA);
renderer.setAnimationLoop(()=>{
    var dt = clock - lastInstant;
    lastInstant = clock;
    player.update(currentKeys, dt);
    renderer.render(scene, camera);
    textRenderer.render(scene, camera);
    if (clock > 1e5){
        clock = 0;
        lastInstant = 0;
    }
});
