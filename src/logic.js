import * as THREE from 'three';
import * as IOHAND from './PeripheralsInputs.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Character } from './Character.js'
import { Corvette } from './enemies/Corvette.js';
import { Skysphere } from './Skysphere.js';
import { Planet, Star, generatePlanetPosition } from './Cosmology.js';
import * as HUD from './UserInterface.js';
import { Pause } from './PauseHandler.js';
import { GameState } from '@/GameState';
import { GameConfigs } from './GameConfigs.js'
import { DebugBoard } from './Debugging.js';


const DESIRED_FPS = 60;
const FRAME_DURATION = 1/DESIRED_FPS;
const ZOOM_SENSITIVITY = 0.001;

document.body.style.cursor = 'none';


GameState.scene = new THREE.Scene();
GameState.clock = new THREE.Clock();
GameState.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1200);
GameState.cameraRecoilOffset = new THREE.Vector3();

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

const hud = new HUD.Hud();

const fpsDisplay = new HUD.FPSIndicator("FPS: ---");
hud.addElement(fpsDisplay);

const healthBar = new HUD.HealthBar();
hud.addElement(healthBar);

const weaponIndicator = new HUD.WeaponIndicator();
hud.addElement(weaponIndicator);

const crossHair = new HUD.CrossHair();
hud.addElement(crossHair);

const compass = new HUD.Compass();
hud.addElement(compass);

const dialBar = new HUD.DilationBar();
hud.addElement(dialBar);

const skysphere = new Skysphere();
GameState.scene.add(skysphere.getMesh());

const sun = new Star(new THREE.Vector3(0, 0, 0), 100, 50000);
GameState.sun = sun;


for(let i=0; i<5; i++){
    const planetPosition = generatePlanetPosition();
    const size = Math.random() * 50 + 10
    const mass = size * GameConfigs.DENSITY;
    const type = Math.floor(Math.random()*3);

    const planet = new Planet(planetPosition, size, mass, type);
    GameState.planets.push(planet);
    planet.initPlanetSpeed(sun.getWorldPosition());

}

GameState.scene.add(new THREE.AmbientLight(0xffffff,0.4));

const player = new Character(new THREE.Vector3(0,-20,150));
GameState.player = player;


const enemy1 = new Corvette(new THREE.Vector3(0,20,150), "team1");
GameState.npcs.push(enemy1);


document.addEventListener('mousedown', IOHAND.mousedownHandler);
document.addEventListener('mouseup', IOHAND.mouseupHandler);
document.addEventListener('keyup', IOHAND.keyupHandler);
document.addEventListener('keydown', IOHAND.keydownHandler);


GameState.paused = false;

canvas.addEventListener('click', ()=>{
    canvas.requestPointerLock();
    if(GameState.paused){
            console.log("Pause end");
            GameState.clock.start();
            GameState.clock.getDelta();
            Pause.deactivate();
            GameState.fps.sinceLast = GameState.clock.getElapsedTime();
            GameState.paused = false;
        }
})

document.addEventListener('pointerlockchange', ()=>{
    if (document.pointerLockElement === canvas){
        document.addEventListener('mousemove', IOHAND.mousemoveHand)
        document.body.style.cursor = 'none';
        
    }else{
        document.removeEventListener('mousemove', IOHAND.mousemoveHand)
        document.body.style.cursor = 'pointer';

        if(!GameState.paused){
            console.log("Pause start");
            GameState.clock.stop();
            Pause.activate()
            GameState.paused = true;
        }

    }
})

document.addEventListener('wheel', (event)=>{
    GameState.zoom.level += event.deltaY * ZOOM_SENSITIVITY;
    GameState.zoom.level = Math.min(GameState.zoom.max, Math.max(GameState.zoom.level, GameState.zoom.min));
});


function loop(){
    if(GameState.paused) return;

    if(GameState.dialActive)
        GameState.timeDial = 0.25;
    else
        GameState.timeDial = 1;
    
    const elapsed = GameState.clock.getElapsedTime();
    var deltaTime = elapsed - GameState.fps.sinceLast;
    deltaTime = Math.min(deltaTime, 0.05);
    
    if(deltaTime < FRAME_DURATION) return;
    
    GameState.fps.sinceLast += deltaTime;
    GameState.fps.frameCount++;

    if (GameState.player && GameState.player.loaded){
        GameState.npcs.forEach((npc)=>{
            GameState.player.shipCollision(npc)
        });
        GameState.planets.forEach((planet)=>{
            GameState.player.planetCollision(planet);
        });
        GameState.player.planetCollision(GameState.sun);
        GameState.bullets.forEach((bullet)=>{
            if(!bullet.isValid()) return;
            GameState.player.bulletCollision(bullet)
        });

        GameState.player.update(deltaTime);
        hud.update();
    }
    else if (!GameState.player)
        console.log("Object player not create yet");
    else if (!GameState.player.loaded)
        console.log("Player model not loaded yet");

    GameState.npcs.forEach((npcPtr)=>{
        if(!npcPtr)
            console.warn("Empty entry in NPCs list");
        else if(!npcPtr.loaded)
            console.log('['+npcPtr.getName()+'] Not loaded yet');
        else{
            GameState.npcs.forEach((other)=>{
                npcPtr.shipCollision(other);
            })
            GameState.planets.forEach((planet)=>{
                npcPtr.planetCollision(planet);
            })
            npcPtr.planetCollision(GameState.sun);
            GameState.bullets.forEach((bullet)=>{
                if(!bullet.isValid()) return;
                npcPtr.bulletCollision(bullet);
            })
            npcPtr.update(deltaTime);
        }
    });

    const playerPos = GameState.player.getWorldPosition();

    GameState.planets.forEach((planet)=>{
        if (playerPos.length()!==0){
            const planetPos = planet.getWorldPosition();
            const dist = new THREE.Vector3();
            dist.subVectors(planetPos, playerPos);
            if(dist.length() - planet.getHitboxSize() < GameConfigs.SKYBOX_RADIUS){
                planet.setVisible(true);
                GameState.planets.forEach((other)=>{
                    planet.collision(other);
                })
                GameState.sun.collision(planet);
            }
            else planet.setVisible(false);
        }
        planet.update(deltaTime);
    });

    GameState.bullets = GameState.bullets.filter((bullet)=>{
        GameState.planets.forEach((planet)=>{
            bullet.checkCelestial(planet);
        })
        bullet.checkCelestial(GameState.sun);
        bullet.update(deltaTime);
        return bullet.isValid();
    });
    

    GameState.explosions = GameState.explosions.filter((explosion)=>{
        explosion.update(deltaTime);
        return !explosion.finished;
    });

    skysphere.getMesh().position.copy(GameState.camera.position);
    renderer.render(GameState.scene, GameState.camera);
    
    textRenderer.render(GameState.scene, GameState.camera);

    IOHAND.PeripheralsInputs.mouseX = 0;
    IOHAND.PeripheralsInputs.mouseY = 0;
}

renderer.setAnimationLoop(loop);
