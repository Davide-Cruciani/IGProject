import * as THREE from 'three';
import * as IOHAND from './PeripheralsInputs.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Character } from './Character.js'
import { Corvette } from './enemies/Corvette.js';
import { Skysphere } from './Skysphere.js';
import { Planet, Star, generatePlanetPosition, BLOOM_LAYER } from './Cosmology.js';
import { FPSIndicator, HealthBar, HUD, WeaponIndicator } from './UserInterface.js';
import { GameState } from '@/GameState';
import { EffectComposer } from 'three/examples/jsm/Addons.js';
import { UnrealBloomPass } from 'three/examples/jsm/Addons.js';
import { RenderPass } from 'three/examples/jsm/Addons.js';
import { BloomMaterialHandler } from './BloomMaterialHandler.js';
import { DebugBoard } from './Debugging.js';

const DENSITY = 5;
const DESIRED_FPS = 60;
const FRAME_DURATION = 1/DESIRED_FPS;
const ZOOM_SENSITIVITY = 0.001;

document.body.style.cursor = 'none';


const scene = new THREE.Scene();
GameState.clock = new THREE.Clock();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1200);

const renderer = new THREE.WebGLRenderer();
const canvas = renderer.domElement;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMappingExposure = 2.0;
document.body.appendChild(canvas);

const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    2.0,0.4,0.1
);

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

const bloomMtlHandler = new BloomMaterialHandler();

const textRenderer = new CSS2DRenderer();
textRenderer.domElement.style.position = 'absolute';
textRenderer.domElement.style.top = '0';
textRenderer.domElement.style.pointerEvents = 'none';
textRenderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(textRenderer.domElement);

const hud = new HUD();

const fpsDisplay = new FPSIndicator("FPS: ---");
hud.addElement(fpsDisplay);

const healthBar = new HealthBar();
hud.addElement(healthBar);

const weaponIndicator = new WeaponIndicator();
hud.addElement(weaponIndicator);


const skysphere = new Skysphere();
scene.add(skysphere.getMesh());

const sun = new Star(new THREE.Vector3(0, 0, 0), 100, 50000);
scene.add(sun.getMesh());
GameState.sun = sun;
GameState.planets.push(sun);


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

scene.add(new THREE.AmbientLight(0xffffff,0.4));

const player = new Character(scene, camera, new THREE.Vector3(0,-10,200));
GameState.player = player;


const enemy1 = new Corvette(new THREE.Vector3(0,30,200), scene, "team1");
GameState.npcs.push(enemy1);


document.addEventListener('mousedown', IOHAND.mousedownHandler);
document.addEventListener('mouseup', IOHAND.mouseupHandler);
document.addEventListener('keyup', IOHAND.keyupHandler);
document.addEventListener('keydown', IOHAND.keydownHandler);

canvas.addEventListener('click', ()=>{
    canvas.requestPointerLock();
})

document.addEventListener('pointerlockchange', ()=>{
    if (document.pointerLockElement === canvas){
        document.addEventListener('mousemove', IOHAND.mousemoveHand)
    }else{
        document.removeEventListener('mousemove', IOHAND.mousemoveHand)
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

    if(IOHAND.PeripheralsInputs['+'] === 1) {
        frozen = true;
        GameState.clock.stop();
    }

    if(IOHAND.PeripheralsInputs['+'] === 0 && frozen){
        GameState.clock.start();
        frozen = false;
    }

    const elapsed = GameState.clock.getElapsedTime();
    var deltaTime = elapsed - GameState.fps.sinceLast;
    if(deltaTime < FRAME_DURATION) return;
    
    GameState.fps.sinceLast += deltaTime;
    GameState.fps.frameCount++;


    

    if (GameState.player && GameState.player.loaded){
        GameState.player.update(deltaTime);
        hud.update();
    }
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

    scene.traverse(bloomMtlHandler.darkenNonBloom);
    camera.layers.set(BLOOM_LAYER);
    composer.render();
    
    scene.traverse(bloomMtlHandler.restoreNormalMaterials);
    camera.layers.set(0);
    renderer.render(scene, camera);
    
    textRenderer.render(scene, camera);

    IOHAND.PeripheralsInputs.mouseX = 0;
    IOHAND.PeripheralsInputs.mouseY = 0;
}

renderer.setAnimationLoop(loop);
