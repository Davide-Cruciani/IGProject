import { Vector3, Quaternion, Matrix4, Euler } from "three";
import * as THREE from 'three';
import { SimpleGun } from "../weapons/Weapons";
import { Enemy } from "./Enemy";
import { GameState } from "@/GameState";

export class Corvette extends Enemy{
    constructor(position, team){
        super("spaceship1", position, team);
        this.name = 'Corvette-'+ team +"-"+ GameState.npcUUID;
        GameState.npcUUID++;
        this.MAX_SPEED = 2;
        this.ACCELERATION = 3;
        this.TURN_SPEED = Math.PI/4;
        this.BASE_DRAG = 1.005;
        this.MAX_HEALTH = 500;
        this.MASS = 10;
        this.SIGHT_CONE = Math.PI/4;
        this.SIGHT_DISTANCE = 60;
        this.AGGRO_GRACE = 5;
        this.AGGRO_TIME = 15;
        this.RADAR_CD = 60;
        this.MOV_CD = 7;
        this.SAFETY_DIST = 30;
        this.REST_ANGLES = new Vector3(Math.PI/2,2*Math.PI*Math.random(),0);


        this.celestialDanger = false;
        this.waitForRadar = 0;
        this.suspects = [];
        this.lastBehavior = this.currentBehavior;
        this.currentHealth = this.MAX_HEALTH;
        this.target = null;
        this.targetLastSeen = 0;
        this.orderReceived = false;
        this.destination = null;
        this.sinceArrival = 0;


        this.mainGun = new SimpleGun(this);
    }

    update(dt){
        const time = dt*GameState.timeDial;
        if (!this.loaded || !this.obj) return;
        this.obj.updateMatrixWorld(true);
        this.dealWithCollisions();

        if(this.waitForRadar > 0) this.waitForRadar -= time;
        if(this.sinceArrival > 0) this.sinceArrival -= time;

        if(!this.target && this.suspects.length > 0){
            this.checkOnSuspects(time);
            console.log(this.suspects.length)
        }
        else if(!this.target){
            this.findSuspects();
        }
        else{
            const visible = this.isSeen(this.target);
            if(visible>0 && visible<this.SIGHT_DISTANCE){
                this.targetLastSeen = 0;
                this.fireArmaments();
                this.alert.setAlert('red', '!');
                this.alert.setVisible(true);
            }else if(this.targetLastSeen > this.AGGRO_TIME){
                this.target = null;
                this.targetLastSeen = 0;
                this.targetPosition = null;
                this.alert.setVisible(false);
            }else{
                this.targetLastSeen+=time;
                this.alert.setAlert('yellow',"!");
                this.alert.setVisible(true);
            }
        }

        this.whereToGo();

        this.movement(time);
    }

    onAttack(enemy){
        if(!enemy || enemy.getTeam() === this.team) return;
        this.aggroTimeout = this.AGGRO_TIME;
        if(this.target !== enemy){
            this.lastBehavior = this.currentBehavior;
        }

        this.target = enemy;
    }

    goto(pos){
        this.destination = pos.clone();
    }

    whereToGo(){
        const pos = this.getWorldPosition();
        var minDist = Infinity;
        var closestBody = null;
        for(const body of [...GameState.planets, GameState.sun]){
            if(body.getMesh().visible === false) continue;
            const bodyPos = body.getWorldPosition();
            const dist = new Vector3().subVectors(bodyPos, pos);
            const length = dist.length();
            if(length > this.SAFETY_DIST) continue;
            if(length < minDist){
                minDist = length;
                closestBody = body;
            } 
        }
        if(closestBody){
            const bodyPos = closestBody.getWorldPosition();
            const toBody = new Vector3().subVectors(bodyPos, pos);
            const toDestination = this.forward.clone().normalize();

            const projectionLength = toBody.dot(toDestination);

            const closestPoint = pos.clone().add(toDestination.clone().multiplyScalar(projectionLength));

            const distToPath = bodyPos.distanceTo(closestPoint);

            const safetyRadius = this.SAFETY_DIST * 0.9;

            if(distToPath < safetyRadius && projectionLength > 0){
                let avoidanceDir = new Vector3().crossVectors(toDestination, toBody).normalize();

                if(avoidanceDir.lengthSq() < 0.0001) {
                    avoidanceDir.set(toDestination.y, -toDestination.x, toDestination.z).normalize();
                }

                const avoidanceStrength = safetyRadius * 1.5;
                const avoidanceVector = avoidanceDir.multiplyScalar(avoidanceStrength);

                this.forward.add(avoidanceVector).normalize();

                console.log(this.getName(), "Avoiding collision with", closestBody.getName());
            }
        }

        if(!this.destination && this.sinceArrival <= 0){
            if(!this.target && this.waitForRadar > 0){
                const newOffset = new Vector3(
                    (Math.random()-0.5)*40 + 10,
                    (Math.random()-0.5)*10 + 10,
                    (Math.random()-0.5)*40 +10
                )
                this.destination = this.getWorldPosition().clone().add(newOffset);
                // console.log("Decided to go to random dir: ", this.destination);
            }
            else if(!this.target){
                
                var closest = Infinity;
                var name = ''
                for(const ship of [...GameState.npcs, GameState.player]){
                    const OtherPos = ship.getWorldPosition();
                    const dist = new Vector3().subVectors(OtherPos, pos);
                    if(dist.length() < closest){
                        this.destination = OtherPos;
                        closest = dist.length();
                        name = ship.getName();
                    } 
                }
                console.log(this.getName(), "Radar: ", name);
                this.waitForRadar = this.RADAR_CD;
                // console.log("used radar");
            }else{
                this.destination = this.target.getWorldPosition();
                // console.log("Chasing player");
            }
        }else if(this.target){
            this.destination = this.target.getWorldPosition();
            // console.log("Have a destination because: Chasing player");
        }
    }

    movement(time){
        if(this.sinceArrival > 0) return;
        if(!this.loaded || !this.obj) return;
        this.computeGravity();
        const integrity = isNaN(this.gravityVector.x)||isNaN(this.gravityVector.y)||isNaN(this.gravityVector.z);
        if(integrity) this.gravityVector.set(0,0,0);
    
        const dest = this.destination.clone();
        const position = this.getWorldPosition();

        const direction = new Vector3().subVectors(dest, position);
        // console.log('Distance from dest', direction.length());
        if(direction.length()> 2){
            const norm = direction.clone().normalize();

            this.vel.addScaledVector(norm, this.ACCELERATION*time);
            this.vel.addScaledVector(this.gravityVector, time);
            this.obj.position.addScaledVector(this.vel, time);
            
            if(this.target){
                const targetVel = this.target.getVelocity();
                const lookTarget  = dest.clone().addScaledVector(targetVel, time);
                this.obj.lookAt(lookTarget);
                this.obj.rotation.z = 0;
            }
            else{
                this.obj.lookAt(dest);
                this.obj.rotation.z = 0;
            }
            
        }else{
            this.vel.set(0,0,0);
            this.sinceArrival = this.MOV_CD;
            const currentRot = this.obj.rotation.clone();
            const targetRot = this.REST_ANGLES;

            const linearIntFactor = 0.2;

            currentRot.x += (targetRot.x - currentRot.x) * linearIntFactor;
            currentRot.y += (targetRot.y - currentRot.y) * linearIntFactor;
            currentRot.z += (targetRot.z - currentRot.z) * linearIntFactor;

            this.obj.rotation.set(currentRot.x, currentRot.y, currentRot.z);
        }

        // console.log("dest: ", this.destination.toArray());
        // console.log("Vel: ",this.vel.toArray())
    }

    getVelocity(){
        return this.vel.clone();
    }
    

    checkOnSuspects(time){
        this.suspects = this.suspects.filter((suspect)=>{
            if(!suspect.ptr || !suspect.ptr.loaded) return true;
            const distance = this.isSeen(suspect.ptr);
            
            if (distance<0 || distance>this.SIGHT_DISTANCE)
                suspect.time -= time;    
            else
                suspect.time += time * (this.SIGHT_DISTANCE+5 - distance)/this.SIGHT_DISTANCE;

            if(suspect.time > this.AGGRO_GRACE){
                this.target = suspect.ptr;
                return false;
            }
            return (suspect.time > 0)
        });

        if(this.target){
            this.suspects = [];
            this.alert.setAlert('red', "!");
            this.alert.setVisible(true);
        }else{
            if (this.suspects.length > 0){
                this.alert.setAlert("yellow", "?");
                this.alert.setVisible(true);
            }
            else{
                this.alert.setVisible(false);
            }
        }
    }

    findSuspects(){

        const candidates = [];

        const playerVis = this.isSeen(GameState.player);
        if(playerVis>0 && playerVis<this.SIGHT_DISTANCE){
            var suspect = {
                ptr: GameState.player,
                time:0
            }
            candidates.push(suspect);
        }

        for(let entry of GameState.npcs){
            if(!entry || !entry.loaded || entry === this || entry.getTeam() === this.team) continue;
            const visible = this.isSeen(entry);
            if(visible>0 && visible<this.SIGHT_DISTANCE){
                const suspect = {
                    ptr: entry,
                    time:0
                }
                candidates.push(suspect);
            }
        }

        candidates.forEach((candidate)=>{
            const exists = this.suspects.find((val)=> val.ptr === candidate.ptr);
            if (!exists) this.suspects.push(candidate);
        })

        if (this.suspects.length > 0){
            this.alert.setVisible(true);
            this.alert.setAlert('yellow','?');
        }
    }

    fireArmaments(){
        this.mainGun.shoot();
    }
    kill(){
        this.destroy();
    }
}