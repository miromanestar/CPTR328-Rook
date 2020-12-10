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
        let numOfPlayers = 0;
        for (let player in playerList)
            numOfPlayers++;

        full = false;
        firebase.database().ref(`/rooms/${ room }`).once('value').then( (data) => {
            console.log(numOfPlayers - data.val().max_players)
            if (numOfPlayers >= data.val().max_players)
                full = true;
            else
                full = false;
        }).then ( (data) => {
            //Update playerlist related data
            firebase.database().ref(`/rooms/${ room }`).update({player_count: numOfPlayers, full: full});
            displayPlayers();
        });
    });
}

function displayPlayers() {
    $('#player-area').empty();

    for (let player in playerList) {
        let p = playerList[player];
        $('#player-area').append(`
        <div class="card">${ player }</div>
        `);
    }
}

function hostStuff() {
    //Periodically delete players
    //setInterval(function() { deletePlayers(); console.log('Purging players'); }, 60000);

    let roomDB = firebase.database().ref(`/rooms/${ room }`);
}

// ---- HOST FUNCTIONS FOR DELETING DISCONNECTED PLAYERS

function deletePlayers() {
    for (let player in playerList) {
        if (Date.now() - playerList[player].lastUpdate > 60000) {
            firebase.database().ref(`/rooms/${ room }/players/${ player }`).remove();
        }
    }
}