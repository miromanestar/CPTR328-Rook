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
    firebase.database().ref(`/rooms/${ room }`).on('value', (data) => {
        if (data.val().host === username)
            isHost = true;
        else
            isHost = false;
    });

    $('#logout-btn').show();
    playerListUpdate();

    if (isHost)
        hostStuff();

    setInterval(function() { connectionChecks() }, 20000);
});


// ---- GENERAL UPDATE STUFF FOR ALL CLIENTS

function connectionChecks() {
    firebase.database().ref(`/rooms/${ room }`).once('value').then( (data) => {
        if (data.exists()) {
            firebase.database().ref(`/rooms/${ room }`).update({ lastUpdate: Date.now() });
            firebase.database().ref(`/rooms/${ room }/players/${ username }`).update({ lastUpdate: Date.now() });
            console.log('User connection verified.');
        } else {
            alert(`The room ${ room } was forcibly closed.`);
            $('#auth-content').html(`
                <div class="alert alert-info" role="alert">
                        <p>
                            Leaving room "${ room }".
                        </p>
                        <div class="spinner-border text-primary d-block mx-auto" role="status">
                            <span class="sr-only">Loading...</span>
                        </div>
                </div>
                `);

                $('#auth-overlay').fadeIn('fast', function() {
                    $('#auth-overlay').delay(500).fadeOut('fast', loadContent('home'));
                });
        }
    });
}

function playerListUpdate() {
    let playerData = firebase.database().ref(`/rooms/${ room }/players`);
    playerData.on('value', (data) => {
        playerList = data.val();
        let numOfPlayers = 0;
        for (let player in playerList)
            numOfPlayers++;

        full = false;
        firebase.database().ref(`/rooms/${ room }`).once('value').then( (data) => {
            if (numOfPlayers >= data.val().max_players)
                full = true;
            else
                full = false;
        }).then ( (data) => {
            //Update playerlist related data
            if (numOfPlayers > 0) {
                firebase.database().ref(`/rooms/${ room }`).update({player_count: numOfPlayers, full: full});
                displayPlayers();
            } else {
                firebase.database().ref(`/rooms/${ room }`).remove();
            }
        });

        if (!playerList[username]) {
            $('#auth-content').html(`
                <div class="alert alert-info" role="alert">
                        <p>
                            Leaving room "${ room }".
                        </p>
                        <div class="spinner-border text-primary d-block mx-auto" role="status">
                            <span class="sr-only">Loading...</span>
                        </div>
                </div>
                `);

                $('#auth-overlay').fadeIn('fast', function() {
                    $('#logout-btn').hide();
                    $('#auth-overlay').delay(500).fadeOut('fast', loadContent('home'));
                });
        }
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

// ---- FUNCTIONS FOR EVERY USER ----

function leaveRoom() {
    let shouldLeave = confirm('Are you sure you want to leave the game?');
    if (shouldLeave) {
        firebase.database().ref(`/rooms/${ room }/players/${ username }`).remove();

        if (isHost && playerList)
            firebase.database().ref(`/rooms/${ room }`).update({ host: Object.keys(playerList)[0] })
    }
}


// ---- FUNCTION FOR THe HOST ----

function maintainHost() {

}

function hostStuff() {
    //Periodically delete players
    setInterval(function() { deletePlayers(); }, 60000);

    let roomDB = firebase.database().ref(`/rooms/${ room }`);


}

function deletePlayers() {
    for (let player in playerList) {
        if (Date.now() - playerList[player].lastUpdate > 60000) {
            console.log(`Purging players from room ${ room }`);
            firebase.database().ref(`/rooms/${ room }/players/${ player }`).remove();
        }
    }
}