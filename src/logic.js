import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Character } from './Character.js'
import { Corvette } from './enemies/Corvette.js';
import { Skysphere } from './Skysphere.js';
import { Planet, Star } from './Cosmology.js';
import { FPSIndicator, HUD } from './UserInterface.js';
import { GameState } from '@/GameState';
import { KeyboardInputs } from './KeyboardInputs.js';
import { DebugBoard } from './Debugging.js';

const DENSITY = 5;
const DEBUG_ON = true;
const DESIRED_FPS = 60;
const FRAME_DURATION = 1/DESIRED_FPS;
const ZOOM_SENSITIVITY = 0.001;


var animationCnt = 0;
var lastFrameTime = 0;
var lastFrameLog = 0;
document.body.style.cursor = 'none';


const scene = new THREE.Scene();
const clock = new THREE.Clock();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1200);

const renderer = new THREE.WebGLRenderer();
const canvas = renderer.domElement;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMappingExposure = 2.0;
document.body.appendChild(canvas);


const textRenderer = new CSS2DRenderer();
textRenderer.domElement.style.position = 'absolute';
textRenderer.domElement.style.top = '0';
textRenderer.domElement.style.pointerEvents = 'none';
textRenderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(textRenderer.domElement);

const hud = new HUD();

const fpsDisplay = new FPSIndicator("FPS: ---");
hud.addChild(fpsDisplay.getElement());


const skysphere = new Skysphere();
scene.add(skysphere.getMesh());

const sun = new Star(new THREE.Vector3(0, 0, 0), 100, 10000);
scene.add(sun.getMesh());
GameState.sun = sun;
GameState.planets.push(sun);

function generatePlanetPosition(){
    const sunPos = GameState.sun.getWorldPosition();

    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);

    const radius = 300 + Math.random() * 200;

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    const offset = new THREE.Vector3(x, y, z);
    return sunPos.clone().add(offset);
}


for(let i=0; i<5; i++){
    const planetPosition = generatePlanetPosition();
    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    const size = Math.random() * 50 + 10
    const mass = size * DENSITY;
    const planet = new Planet(planetPosition, size, mass, color);
    scene.add(planet.getMesh());
    GameState.planets.push(planet);
    planet.initPlanetSpeed(sun.getWorldPosition());

}

scene.add(new THREE.AmbientLight(0xffffff,0.2));

const player = new Character(scene, camera, new THREE.Vector3(0,-10,200));
GameState.player = player;


const enemy1 = new Corvette(new THREE.Vector3(0,30,200), scene, "team1");
GameState.npcs.push(enemy1);


// const debugTable = new  DebugBoard(200, 200, 20);
// scene.add(debugTable.getMesh());
// debugTable.setPosition(new THREE.Vector3(0, 0, 180));


function keydownHandler(event){
    switch (event.key.toLowerCase()) {
        case 'a':
            KeyboardInputs['a'] = (event.shiftKey)? 2: 1;
            KeyboardInputs['d'] = 0;
            break;
        case 'c':
            KeyboardInputs['c'] = 1;
            break;
        case 'd':
            KeyboardInputs['d'] = (event.shiftKey)? 2: 1;
            KeyboardInputs['a'] = 0;
            break;
        case 'w':
            KeyboardInputs['w'] = (event.shiftKey)? 2: 1;
            KeyboardInputs['s'] = 0;
            break;
        case 's':
            KeyboardInputs['s'] = (event.shiftKey)? 2: 1;
            KeyboardInputs['w'] = 0;
            break;
        case '+':
            KeyboardInputs['+'] = 1-KeyboardInputs['+'];
            break;
        default:
            if (DEBUG_ON) console.log('Unknown key: ' + event.key);
            break;
    }
}

function keyupHandler(event){
    switch (event.key.toLowerCase()) {
        case 'a':
            KeyboardInputs['a'] = 0;
            break;
        case 'c':
            KeyboardInputs['c'] = 0;
            break;
        case 'd':
            KeyboardInputs['d'] = 0;
            break;
        case 'w':
            KeyboardInputs['w'] = 0;
            break;
        case 's':
            KeyboardInputs['s'] = 0;
            break;
        default:
            break;
    }
}

function mousedownHandler(event){
    switch (event.button){
        case 0:
            KeyboardInputs['mb0'] = 1;
            break;
        case 1:
            KeyboardInputs['mb1'] = 1;
            break;
        default:
            console.log('Unused mouse button', (event.button));
            break;
    }
}

function mouseupHandler(event){
    switch (event.button){
        case 0:
            KeyboardInputs['mb0'] = 0;
            break;
        case 1:
            KeyboardInputs['mb1'] = 0;
            break;
        default:
            console.log('Unused mouse button', (event.button));
            break;
    }
}

function mousemoveHand(event){
    var x = event.movementX || 0;
    var y = event.movementY || 0;

    KeyboardInputs['mouseX'] = x;
    KeyboardInputs['mouseY'] = y;
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
    GameState.zoom.level += event.deltaY * ZOOM_SENSITIVITY;
    GameState.zoom.level = Math.min(GameState.zoom.max, Math.max(GameState.zoom.level, GameState.zoom.min));
})

GameState.objects.push(player);
GameState.objects.push(enemy1);

var frozen = false;

function loop(){

    if(KeyboardInputs['+'] === 1) {
        frozen = true;
        clock.stop();
    }

    if(KeyboardInputs['+'] === 0 && frozen){
        clock.start();
        frozen = false;
    }

    const elapsed = clock.getElapsedTime();
    var deltaTime = elapsed - lastFrameTime;
    if(deltaTime < FRAME_DURATION) return;
    
    lastFrameTime += deltaTime;
    animationCnt++;

    if (elapsed - lastFrameLog> 1) {
        fpsDisplay.setText("FPS: "+animationCnt);
        animationCnt = 0;
        lastFrameLog += 1;
    }

    if (GameState.player && GameState.player.loaded)
        GameState.player.update(KeyboardInputs, deltaTime);
    else if (!GameState.player)
        console.log("Object player not create yet");
    else if (!GameState.player.loaded)
        console.log("Player model not loaded yet");

    GameState.bullets = GameState.bullets.filter((bullet)=>{
        const valid = bullet.timer.getElapsedTime() < bullet.ttl;
        if(!valid){
            scene.remove(bullet.ptr.getMesh());
            bullet.ptr.delete();
        }else{
            bullet.ptr.update(deltaTime);
        }
        return valid;
    });
    
    GameState.planets.forEach((planet)=>{
        planet.update(deltaTime);
    })

    GameState.npcs = GameState.npcs.filter((npcPtr)=>{
        if(!npcPtr || !npcPtr.loaded) return true;
        else{
            npcPtr.update(deltaTime);
            const dead = npcPtr.isDead();
            if (dead) npcPtr.kill();
            return !dead;
        }
    })

    skysphere.getMesh().position.copy(camera.position);
    renderer.render(scene, camera);
    textRenderer.render(scene, camera);
    KeyboardInputs.mouseX = 0;
    KeyboardInputs.mouseY = 0;
}

renderer.setAnimationLoop(loop);
