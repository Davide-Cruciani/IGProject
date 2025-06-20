import { Enemy } from "./Enemy";
import { Vector3 } from "three";
import { AlertIcon } from "../UserInterface";

export class Corvette extends Enemy{
    constructor(position, scene){
        super("spaceship1", position, scene);
        this.SPEED = 1;
        this.TURN_SPEED = 0.5;
        this.BASE_DRAG = 1.005;
        this.MAX_HP = 10;
        this.SIGHT_CONE = Math.PI/6;
        this.SIGHT_DISTANCE = 30;
        this.AGGRO_TIME = 10;
        this.damageReceived = 0;
        this.playerSpotted = false;
        this.playerLastSeen = 0;
        this.alert = new AlertIcon();
        this.alert.setVisible(false);
        this.obj.add(this.alert.getElement());
    }

    update(time, player, objectList){
        if(!player || !player.loaded) return;
        const playerInSight = this.isSeen(player, this.SIGHT_CONE, this.SIGHT_DISTANCE); 
        if(!this.playerSpotted){
            if(playerInSight){
                this.playerSpotted = true;
                this.alert.setVisible(true);
                this.playerLastSeen = 0;
            }
        }
        if(this.playerSpotted){
            if (playerInSight)
                this.playerLastSeen += time;
            else if (this.playerLastSeen < this.AGGRO_TIME){
                this.playerSpotted = false;
                this.alert.setVisible(false);
            }
            this.fireArmaments();
        }
        this.movement(time);
        this.collision(objectList);
    }

    movement(){
        
    }


    collision(){

    }

    fireArmaments(){

    }
}