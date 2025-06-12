import { Enemy } from "../enemy";

export class Corvette extends Enemy{
    constructor(path, position, scene){
        super(path, position, scene);
        this.SPEED = 1;
        this.BASE_DRAG = 1.005;
    }

    update(){
        this.collision();
        this.movement();
        this.fireArmaments();
    }

    collision(){}
    movement(){}
    fireArmaments(){}
}