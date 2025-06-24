import { Clock, Vector3, Quaternion } from "three";
import { Bullet } from "./Bullet";
import { GameState } from "@/GameState";


export class SimpleGun{
    constructor(ship, scene){
        this.CD = 0.25;
        this.BULLET_TTL = 5;
        this.NAME = 'Basic Gun';
        this.ship = ship;
        this.scene = scene;

        this.timeKeeper = new Clock(true);
        this.timeLastBullet = 0;
    }

    shoot(){
        const elapsed = this.timeKeeper.getElapsedTime();
        if (elapsed - this.timeLastBullet > this.CD){
                const shipPos = this.ship.getWorldPosition();
                const shipDir = this.ship.getWorldDirection();
                const bullet = new Bullet(shipPos, shipDir, this.ship, 0.07);
                this.timeLastBullet = elapsed;
                const clock = new Clock(false);
                const bulletRecord = {
                    timer: clock,
                    ttl: this.BULLET_TTL,
                    ptr: bullet,
                }
                clock.start();
                GameState.bullets.push(bulletRecord);
                this.scene.add(bullet.getMesh());
            }
    }

    getName(){
        return this.NAME;
    }

}

export class Shotgun extends SimpleGun{
    constructor(ship, scene) {
        super(ship, scene);
        this.NAME = 'ShotGun';
        this.CD = 1.5;
        this.BULLET_TTL = 5;
        this.BULLETS_IN_SHELL = 4;
        this.SPREAD = Math.PI/6;
    }
    shoot(){
        const elapsed = this.timeKeeper.getElapsedTime();
        if (elapsed - this.timeLastBullet> this.CD){
            const shipPos = this.ship.getWorldPosition();
            const shipDir = this.ship.getWorldDirection();
            for(let i=0;i<this.BULLETS_IN_SHELL;i++){
                const randomAxis = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
                const randomAngle = Math.random() * this.SPREAD;

                const spreadQuat = new Quaternion().setFromAxisAngle(randomAxis, randomAngle);
                const spreadDir = shipDir.clone().applyQuaternion(spreadQuat).normalize();

                const bullet = new Bullet(shipPos, spreadDir, this.ship, 0.12);
                const clock = new Clock(false);
                const bulletRecord = {
                    timer: clock,
                    ttl: this.BULLET_TTL,
                    ptr: bullet,
                }
                clock.start();
                GameState.bullets.push(bulletRecord);
                this.scene.add(bullet.getMesh());
            }
            this.timeLastBullet = elapsed;
        }
    }
}