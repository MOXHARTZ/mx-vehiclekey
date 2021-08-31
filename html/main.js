$(function(){
    nowSound = null
    window.addEventListener('message', function(event){
        if (event.data.type == 'StartSound') {
            if (nowSound != null) {
                nowSound.pause();
            }
            nowSound = new Audio("./lock.mp3");
            nowSound.volume = 0.3;
            nowSound.play();
        }
    });
});