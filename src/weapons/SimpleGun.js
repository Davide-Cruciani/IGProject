import { Clock } from "three";
import { Bullet } from "./Bullet";
import { GameState } from "@/GameState";


export class SimpleGun{
    constructor(ship, scene){
        this.PRIMARY_CD = 0.25;
        this.BULLET_TTL = 4;
        this.ship = ship;
        this.scene = scene;

        this.timeKeeper = new Clock(true);
        this.timeLastBullet = 0;
    }

    shoot(){
        // console.log("Shooting command received by gun");
        const elapsed = this.timeKeeper.getElapsedTime();
        if (elapsed - this.timeLastBullet > this.PRIMARY_CD){
                const shipPos = this.ship.getWorldPosition();
                const shipDir = this.ship.getWorldDirection();
                const bullet = new Bullet(shipPos, shipDir, this.ship);
                this.timeLastBullet = elapsed;
                const clock = new Clock(false);
                const bulletRecord = {
                    timer: clock,
                    ttl: this.BULLET_TTL,
                    ptr: bullet,
                }
                clock.start();
                // console.log('Bullets before :>> ', GameState.bullets.length);
                GameState.bullets.push(bulletRecord);
                // console.log('Bullet after :>> ', GameState.bullets.length);
                this.scene.add(bullet.getMesh());
            }
    }

}