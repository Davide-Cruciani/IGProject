import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Character } from './Character.js'
import { DebugBoard } from './DebugBoard.js';
import { Corvette } from './enemies/Corvette.js';

const DEBUG_ON = true;
const DESIRED_FPS = 60;
const FRAME_DURATION = 1/DESIRED_FPS;

var animationCnt = 0;
var lastFrameTime = 0;
var lastFrameLog = 0;
document.body.style.cursor = 'none';
window.bulletList = [];
window.enemyList = [];

const scene = new THREE.Scene();
const clock = new THREE.Clock();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
const canvas = renderer.domElement;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(canvas);

const textRenderer = new CSS2DRenderer();
textRenderer.domElement.style.position = 'absolute';
textRenderer.domElement.style.top = '0';
textRenderer.domElement.style.pointerEvents = 'none';
textRenderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(textRenderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);
scene.add(new THREE.AmbientLight(0xf0f0f0));

const player = new Character('./assets/E-45-Aircraft', scene, camera);
window.player = player;

const board = new DebugBoard(10,600,10);
scene.add(board.getMesh());

const enemy1 = new Corvette(new THREE.Vector3(0,0,2), scene);
var currentInputs = {
    'a': 0,
    'd': 0,
    's': 0,
    'w': 0,
    'c':0,
    'mb1':0,
    'mb0':0,
    'mouseX':0,
    'mouseY':0
}

function keydownHandler(event){
    switch (event.key.toLowerCase()) {
        case 'a':
            currentInputs['a'] = (event.shiftKey)? 2: 1;
            currentInputs['d'] = 0;
            if (DEBUG_ON) console.log(event.key);
            break;
        case 'c':
            currentInputs['c'] = 1;
            if (DEBUG_ON) console.log(event.key);
            break;
        case 'd':
            currentInputs['d'] = (event.shiftKey)? 2: 1;
            currentInputs['a'] = 0;
            if (DEBUG_ON) console.log(event.key);
            break;
        case 'w':
            currentInputs['w'] = (event.shiftKey)? 2: 1;
            currentInputs['s'] = 0;
            if (DEBUG_ON) console.log(event.key);
            break;
        case 's':
            currentInputs['s'] = (event.shiftKey)? 2: 1;
            currentInputs['w'] = 0;
            if (DEBUG_ON) console.log(event.key);
            break;
        default:
            if (DEBUG_ON) console.log('Unknown key: ' + event.key);
            break;
    }
}

function keyupHandler(event){
    switch (event.key.toLowerCase()) {
        case 'a':
            currentInputs['a'] = 0;
            break;
        case 'c':
            currentInputs['c'] = 0;
            break;
        case 'd':
            currentInputs['d'] = 0;
            break;
        case 'w':
            currentInputs['w'] = 0;
            break;
        case 's':
            currentInputs['s'] = 0;
            break;
        default:
            break;
    }
}

function mousedownHandler(event){
    switch (event.button){
        case 0:
            currentInputs['mb0'] = 1;
            break;
        case 1:
            currentInputs['mb1'] = 1;
            break;
        default:
            console.log('Unused mouse button', (event.button));
            break;
    }
}

function mouseupHandler(event){
    switch (event.button){
        case 0:
            currentInputs['mb0'] = 0;
            break;
        case 1:
            currentInputs['mb1'] = 0;
            break;
        default:
            console.log('Unused mouse button', (event.button));
            break;
    }
}

function mousemoveHand(event){
    var x = event.movementX || 0;
    var y = event.movementY || 0;

    currentInputs['mouseX'] = x;
    currentInputs['mouseY'] = y;
}

document.addEventListener('mousedown', mousedownHandler);
document.addEventListener('mouseup', mouseupHandler);
document.addEventListener('keyup', keyupHandler);
document.addEventListener('keydown', keydownHandler);

canvas.addEventListener('click', ()=>{
    canvas.requestPointerLock();
})

document.addEventListener('pointerlockchange', ()=>{
    if (document.pointerLockElement === canvas){
        document.addEventListener('mousemove', mousemoveHand)
    }else{
        document.removeEventListener('mousemove', mousemoveHand)
    }
})

document.addEventListener('wheel', (event)=>{
    camera.translateZ(event.deltaY/100);
})

function loop(){
    const elapsed = clock.getElapsedTime();
    var deltaTime = elapsed - lastFrameTime;
    if(deltaTime < FRAME_DURATION) return;
    
    lastFrameTime += FRAME_DURATION;
    animationCnt++;

    if (elapsed - lastFrameLog> 1) {
        console.log(currentInputs);
        console.log("FPS: ", animationCnt);
        animationCnt = 0;
        lastFrameLog += 1;
    }

    if (window.player && window.player.loaded)
        window.player.update(currentInputs, deltaTime);
    else if (!window.player)
        console.log("Object player not create yet");
    else if (!window.player.loaded)
        console.log("Player model not loaded yet");
    let toKeep = [];
    for(let i=0; i<window.bulletList.length; i++){
        let bullet = window.bulletList[i];
        if (bullet['timer'].getElapsedTime() < bullet['ttl']){
            bullet['obj'].update(deltaTime);
            toKeep.push(bullet);
        }else{
            scene.remove(bullet['obj'].getMesh());
            bullet['obj'].delete();
        }
    }
    var enemyToKeep = []
    for (let i=0;i<window.enemyList.length; i++){
        let enemyPtr = window.enemyList[i];
        if(!enemyPtr || !enemyPtr.loaded) continue;
        else{
            enemyPtr.update()
            if(!enemyPtr.isDead()) enemyToKeep.push(enemyPtr);
        }
    }

    window.bulletList = toKeep;
    renderer.render(scene, camera);
    textRenderer.render(scene, camera);
    currentInputs.mouseX = 0;
    currentInputs.mouseY = 0;
}

renderer.setAnimationLoop(loop);
