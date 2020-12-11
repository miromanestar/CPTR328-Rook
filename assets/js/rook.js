//Initialization
var username = username || null;
var room = room || null;
var isHost = false;
var host = null;
var initializationFinished = false;

var playerList = null;
var isLeaving = false;

var connectionInterval = null;

$(document).ready( function() {
    if (window.history.state) {
        username = window.history.state.username;
        room = window.history.state.room;
    }

    $('#room_name').text(room);

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

        hostStuff();
    });

    if (room && username) {
        $('#logout-btn').show();
        playerListUpdate();
    }

    if (!connectionInterval)
        connectionInterval = setInterval(function() { connectionChecks() }, 20000);

    if (!room && !username)
        clearInterval(connectionInterval);
});


// ---- GENERAL UPDATE STUFF FOR ALL CLIENTS

//When called, lets the server know a player is still connected
function connectionChecks() {
    if (room && username) {
        firebase.database().ref(`/rooms/${ room }`).once('value').then( (data) => {
            if (data.exists() && playerList && playerList[username]) {
                firebase.database().ref(`/rooms/${ room }`).update({ lastUpdate: Date.now() });
                firebase.database().ref(`/rooms/${ room }/players/${ username }`).update({ lastUpdate: Date.now() });
                maintainHost();
                console.log('User connection verified.');
            } else {
                clearInterval(connectionInterval);
            }
        });
    }
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

                if (!playerList)
                    firebase.database().ref(`/rooms/${ room }`).remove();
    
                if (isHost && playerList)
                    firebase.database().ref(`/rooms/${ room }`).update({ host: Object.keys(playerList)[0] })

                username = null;
                room = null;
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
        interval = setInterval(function() { deletePlayers(); }, 30000);
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
    $('#card-stack').html(`
        <div id="game-launcher" class="card mx-auto w-50 mt-5 p-3">
            <p class="text-center">
                Waiting for players...
            </p>
            <div class="spinner-border text-primary d-block mx-auto" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
    `);

    if (initializationFinished) {
        initializeGame();
    }
});

function initializeGame() {
    firebase.database().ref(`/rooms/${ room }`).on('value', (data) => {
        if (Object.keys(playerList).length >= 3 & isStarted === false) {
            if (isHost) {
                $('#card-stack').html(`
                    <button id="login-btn" type="submit" class="btn btn-primary" onclick="startGame();">Start</button>
                `);
            } else {
                $('#card-stack').html(`
                    <p class="text-center">
                        Waiting on the host to begin the game...
                    </p>
                    <div class="spinner-border text-primary d-block mx-auto" role="status">
                        <span class="sr-only">Loading...</span>
                    </div>
                `);  
            }
            //Tells all connected clients to run whatever command is specified
            firebase.database().ref(`/rooms/${ room }/cmd`).on('value', (data) => {
                window[data.val()]();
            });
        } else {
            $('#card-stack').html(`
                <p class="text-center">
                    Waiting for players...
                </p>
                <div class="spinner-border text-primary d-block mx-auto" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
            `);
        }
    });
}

function startGame() {
    let game = firebase.database().ref(`/rooms/${ room }`);

    isStarted = true;
    game.update({ started: true });

    dealCards();
    beginGame();
}

function dealCards() {
    let cards = {};
    for (let color of ['Black', 'Green', 'Red', 'Yellow']) {
        for (let i = 1; i <= 14; i++) {
            if (i !== 2 && i !== 3 && i !== 4) {
                cards[color + ' ' + i] = {
                    value: i !== 1 ? i : 15,
                    name: color + ' ' + (i < 10 ? '0' + i : i),
                    path: '/assets/images/cards/' + color + ' ' + (i < 10 ? '0' + i : i) + '.svg'
                };
            }
        }
    }
    cards['Rook'] = {
        value: 20,
        name: 'Rook',
        path: '/assets/images/cards/Crow.svg'
    };

    firebase.database().ref(`/rooms/${ room }`).update({ cards: cards });

    let cardRef = firebase.database().ref(`/rooms/${ room }/cards`);
    let kittyRef = firebase.database().ref(`/rooms/${ room }/kitty`);

    kittyRef.remove();
    if (Object.keys(playerList).length === 3) {
        for (let i = 0; i < 6; i++) {
            cards = getKittyCard(cards);
        }
    } else if (Object.keys(playerList).length === 4) {
        for (let i = 0; i < 5; i++) {
            cards = getKittyCard(cards);        
        }
    } else if (Object.keys(playerList).length === 5) {
        for (let i = 0; i < 4; i++) {
            cards = getKittyCard(cards);
        }
    } else if (Object.keys(playerList).length === 6) {
        for (let i = 0; i < 3; i++) {
            cards = getKittyCard(cards);
        }
    }

    firebase.database().ref(`/rooms/${ room }`).update({ cards: cards });

    kittyRef.off('value');

    while (Object.keys(cards).length > 0) {
        for (let player in playerList) {
            let keys = Object.keys(cards);
            let cardKey = keys[Math.floor(keys.length * Math.random())];
            let card = cards[cardKey];
            firebase.database().ref(`/rooms/${ room }/players/${ player }/cards`).update({ [cardKey]: card });
            delete cards[cardKey];
        }
    }

    firebase.database().ref(`/rooms/${ room }`).update({ cards: cards });

    cardRef.off('value');
}

function getKittyCard(cards) {
    let keys = Object.keys(cards);
    let cardKey = keys[Math.floor(keys.length * Math.random())];
    let card = cards[cardKey];
    firebase.database().ref(`/rooms/${ room }/kitty`).update({ [cardKey]: card });
    delete cards[cardKey];

    return cards;
}

//Will dynamically update the card display for the user as they make changes
function displayPlayerCards() {
    firebase.database().ref(`/rooms/${ room }/players/${ username }/cards/`).on('value', (data) => {
        $('#player-cards').empty();

        let cards = data.val();
        for (let card in cards) {
            $('#player-cards').append(`
                <div class="card player-card" onclick="alert('Idk')" style="background: url('${ cards[card].path }'); background-size: 100% 100%;">
                </div>
            `);
        }
    });
}

function beginGame() {
    let cmdRef = firebase.database().ref(`/rooms/${ room }/cmd`);
    cmdRef.set('displayPlayerCards');
    $('#card-stack').html(`
        <p>Game has begun... I guess... Now what?
    `)
}