const socketio = io();
var sendData = {
    chat: room
};
socketio.emit('c2s-join',sendData);

const form = document.getElementById('chatForm');
form.addEventListener("submit", function(event) {
    event.preventDefault();
    var sendData = {
        chat: room,
        value: 10000,
        username: username
    }
    socketio.emit('c2s-chat', sendData);
});

socketio.on('s2c-chat', function(price){
    console.log('ソケットs2c-chat:' + price);
    document.getElementById('output').innerHTML = price;
});


function countdownTimer(){
    var nowDate = new Date();
    var difference = endDate - nowDate;
    if(difference >= 0){
        var hour = Math.floor(difference / (1000 * 60 * 60));
        difference -= (hour *(1000 * 60 * 60));
        var minutes = Math.floor(difference / (1000 * 60));
        difference -= (minutes *(1000 * 60));
        var second = Math.floor(difference / 1000);
        var remaining = "";
        remaining += hour + ':';
        remaining += minutes + ':';
        remaining += second;
        // document.getElementById('nowdate').innerHTML = new Date().toString();
        document.getElementById('remainingdate').innerHTML = remaining;
        setTimeout(countdownTimer, 100);
    } else {
        var inputElement = document.querySelector('button[type=submit]');
        inputElement.disabled = true;
        document.getElementById('text').innerHTML = '<a id="result" href="/comp/' + id + '">結果確認</a>';
    }
}
countdownTimer();