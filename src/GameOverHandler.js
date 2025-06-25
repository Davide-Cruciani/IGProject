class GameOverHandler{
    constructor(){
        this.mainElement = document.createElement('div');
        this.mainElement.id = 'game-over-screen';
        this.textElement = document.createElement('div');
        this.textElement.id = 'game-over-text';
        this.textElement.textContent = 'YOU DIED'
        this.button = document.createElement('button');
        this.button.id = 'restart-button';
        this.button.textContent = 'Retry?';
        this.mainElement.appendChild(this.textElement);
        this.mainElement.appendChild(this.button);
        this.restartFunction = ()=>{


            this.mainElement.style.display = 'none';
        }
        this.button.addEventListener('click', this.restartFunction);
        document.body.appendChild(this.mainElement);
    
    }
    showGameOverScreen(){
        this.mainElement.style.display = 'flex';
    }


} 

export const GameOver = new GameOverHandler();