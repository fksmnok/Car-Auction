const socketio = io();
var sendData = {
    chat:chatname
};
socketio.emit('c2s-join',sendData);
const form = document.getElementById('chatForm');
form.addEventListener("submit", function(event) {
    event.preventDefault();
    var sendData = {
        chat:chatname,
        email : document.getElementById('name-input').value,
        message : document.getElementById('comment-input').value
    }
    socketio.emit('c2s-chat', sendData);
}); 

socketio.on('s2c-chat', function(msg){
    console.log('ソケットs2c-chat1:' + msg);
    var ul = document.getElementById('output');
    var li = document.createElement('li');
    li.innerHTML = msg.email + " : " + msg.message;
    ul.appendChild(li);
});
