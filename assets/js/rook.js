//Initialization
var username = null;
var room = null;
var isHost = false;

var playerList = null;

$(document).ready( function() {
    username = window.history.state.username;
    room = window.history.state.room;
    
    $('#room_name').text(room);

    //Figure out if host
    firebase.database().ref(`/rooms/${ room }`).once('value').then( (data) => {
        if (data.val().host === username)
            isHost = true;
    });

    playerListUpdate();

    if (isHost)
        hostStuff();
});

function playerListUpdate() {
    let playerData = firebase.database().ref(`/rooms/${ room }/players`);
    playerData.on('value', (data) => {
        playerList = data.val();
    });
}

function hostStuff() {
    let roomDB = firebase.database().ref(`/rooms/${ room }`);
}