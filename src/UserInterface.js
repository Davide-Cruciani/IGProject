import { CanvasTexture, Color, Sprite, SpriteMaterial } from "three";
import { GameState } from '@/GameState'

export class HUD{
    constructor(){
        this.mainElement = document.createElement('div');
        this.mainElement.id = 'hud';
        document.body.append(this.mainElement);
        this.list = [];
    }

    addElement(element){
        const elem = element.getElement();
        this.mainElement.appendChild(elem);
        this.list.push(element);
    }

    removeElement(element){
        const elem = element.getElement();
        this.list = this.list.filter((e)=>{ return !(e === element)});
        if (this.mainElement.contains(elem))
            this.mainElement.removeChild(elem);
    }

    update(){
        this.list.forEach((elem)=>elem.update());
    }

    destroy(){
        document.removeChild(this.mainElement);
    }
}

class HudElement{
    constructor(){
        this.mainElement = document.createElement('div');
    }
    getElement(){
        return this.mainElement;
    }

    update(){}

}


export class FPSIndicator extends HudElement{
    constructor(){
        super();
        this.mainElement.id = 'fps-counter';
    }
    update(){
        const elapsed = GameState.clock.getElapsedTime();
        if (elapsed - GameState.fps.sinceLastLog> 1) {
                this.mainElement.textContent = "FPS: "+ GameState.fps.frameCount;
                GameState.fps.frameCount = 0;
                GameState.fps.sinceLastLog += 1;
            }
    }
}

export class HealthBar extends HudElement{
    constructor(){
        super();
        this.mainElement.id = 'health-container'
        this.filledBar = document.createElement('div');
        this.filledBar.id = 'health-bar'
        this.mainElement.appendChild(this.filledBar);
    }

    update(){
        if (!GameState.player || typeof GameState.player.getHealth !== 'function') return;
        const hp = GameState.player.getHealth();
        const maxHp = GameState.player.getMaxHealth();
        const percentage = Math.max(hp/maxHp*100, 0);
        this.filledBar.style.width = `${percentage}%`;
        if (percentage > 50)
            this.filledBar.style.backgroundColor = 'green';
        else if (percentage > 30)
            this.filledBar.style.backgroundColor = 'orange';
        else if (percentage > 15)
            this.filledBar.style.backgroundColor = 'red';
        else
            this.filledBar.style.backgroundColor = 'darkred';
    }

}

export class WeaponIndicator extends HudElement{
    constructor(){
        super();
        this.mainElement.id = 'weapon-indicator';
    }

    update(){
        if (!GameState.player || typeof GameState.player.getEquippedWeapon !== 'function') return;
        const weaponName = GameState.player.getEquippedWeapon().getName();
        this.mainElement.textContent = (weaponName)? `Equipped: ${weaponName}`: 'No Weapon';
    }

}

export class AlertIcon{
    constructor(){
        this.canvas = document.createElement('canvas');
        this.canvas.width = 64;
        this.canvas.height = 64;
        const ctx = this.canvas.getContext('2d');
        ctx.fillStyle = 'red';
        ctx.font = '48px bold sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', 32,32);

        this.texture = new CanvasTexture(this.canvas);
        this.mlt = new SpriteMaterial({
            map: this.texture,
            depthFunc:false,
        });
        this.sprite = new Sprite(this.mlt);
        this.sprite.scale.set(5,5,5);
        this.sprite.position.set(0,5,0);
    }

    getElement(){
        return this.sprite;
    }

    setVisible(setting){
        this.sprite.visible = setting;
    }

    setAlert(color, text){
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = color;
        ctx.font = '48px bold sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 32, 32);
        this.texture.needsUpdate = true;
    }
}

