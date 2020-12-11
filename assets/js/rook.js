//Initialization
var username = null;
var room = null;
var isHost = false;
var host = null;
var initializationFinished = false;

var playerList = null;
var isLeaving = false;

var connectionInterval = null;

$(document).ready( function() {
    if (!window.history.state)
        loadContent('home');

    username = window.history.state.username;
    room = window.history.state.room;

    $('#room_name').text(room);

    //Figure out if host
    firebase.database().ref(`/rooms/${ room }`).on('value', (data) => {
        if (!data.exists() && !isLeaving) {
            alert(`Connection to game ${ room } was lost.`);
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

            return;
        }

        if (!isLeaving) {
            host = data.val().host;
            if (host === username)
                isHost = true;
            else
                isHost = false;
        }
    });

    $('#logout-btn').show();
    playerListUpdate();

    hostStuff();

    connectionInterval = setInterval(function() { connectionChecks() }, 20000);
});


// ---- GENERAL UPDATE STUFF FOR ALL CLIENTS

//When called, lets the server know a player is still connected
function connectionChecks() {
    firebase.database().ref(`/rooms/${ room }`).once('value').then( (data) => {
        if (data.exists()) {
            firebase.database().ref(`/rooms/${ room }`).update({ lastUpdate: Date.now() });
            firebase.database().ref(`/rooms/${ room }/players/${ username }`).update({ lastUpdate: Date.now() });
            maintainHost();
            console.log('User connection verified.');
        } else {
            clearInterval(connectionInterval);
        }
    });
}

function playerListUpdate() {
    let playerData = firebase.database().ref(`/rooms/${ room }/players`);
    playerData.on('value', (data) => {
        playerList = data.val();

        if (!playerList || !playerList[username]) {
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

        let numOfPlayers = Object.keys(playerList).length;

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
                initializationFinished = true;
            } else {
                firebase.database().ref(`/rooms/${ room }`).remove();
            }
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

// ---- FUNCTIONS FOR EVERY USER ----

function leaveRoom() {
    let shouldLeave = confirm('Are you sure you want to leave the game?');
    isLeaving = true;
    if (shouldLeave) {
        firebase.database().ref(`/rooms/${ room }/players/${ username }`).remove();

        if (isHost && playerList)
            firebase.database().ref(`/rooms/${ room }`).update({ host: Object.keys(playerList)[0] })
    }
}


// ---- FUNCTIONS FOR THe HOST ----

//If the host hasn't been pinging the server, set a new host
function maintainHost() {
    firebase.database().ref(`/rooms/${ room }/players/${ host }`).once('value').then( (data) => {
        if (!data.exists() || Date.now() - data.val().lastUpdate > 40000)
            firebase.database().ref(`/rooms/${ room }`).update({ host: username })
    });
}

function hostStuff() {
    let interval = null;
    if (isHost)
        interval = setInterval(function() { deletePlayers(); }, 60000);
    else
        clearInterval(interval);
}

function deletePlayers() {
    for (let player in playerList) {
        if (Date.now() - playerList[player].lastUpdate > 60000) {
            console.log(`Purging players from room ${ room }`);
            firebase.database().ref(`/rooms/${ room }/players/${ player }`).remove();
        }
    }
}

/*
    ACTUAL GAMEPLAY PART OF THE SCRIPT
    Miro Manestar & Jacob Bahn
    CPTR-328 Principles of Networking
    Southern Adventist University
*/

var isStarted = false;
$(document).ready(function() {
    $('#game-area').append(`
        <div class="card mx-auto w-50 mt-5 p-3">
            <p class="text-center">
                Waiting for players...
            </p>
            <div class="spinner-border text-primary d-block mx-auto" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
    `);

    if (initializationFinished) {
        //Do stuff
    }
});