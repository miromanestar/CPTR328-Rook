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

                if (!playerList)
                    firebase.database().ref(`/rooms/${ room }`).remove();
    
                if (isHost && playerList && room)
                    firebase.database().ref(`/rooms/${ room }`).update({ host: Object.keys(playerList)[0] })

                username = null;
                room = null;

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
            if (numOfPlayers > 0 && room) {
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

var isStarted = isStarted || false;
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
        if (Object.keys(playerList).length >= 3 && isStarted === false) {
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
        } else if (isStarted === false) {
            $('#card-stack').html(`
                <p class="text-center">
                    Waiting for players...
                </p>
                <div class="spinner-border text-primary d-block mx-auto" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
            `);
        } else {
            resumeGame();
            firebase.database().ref(`/rooms/${ room }`).off();
        }
    });
}

function startGame() {
    let game = firebase.database().ref(`/rooms/${ room }`);

    isStarted = true;
    game.update({ started: true });

    dealCards();
    let cmdRef = firebase.database().ref(`/rooms/${ room }/cmd`);
    cmdRef.set('displayPlayerCards');

    //Begin bidding
    cmdRef.set('startBidding');
}

function resumeGame() {
    displayPlayerCards();
}

function startTricks() {
    if (isHost)
        firebase.database().ref(`/rooms/${ room }/game/bid`).value('once').then( (data) => {
            let currentPlayer = getNextPlayer(data.val().bidder);
            firebase.database().ref(`/rooms/${ room }/game/tricks`).set({ current: currentPlayer, first: currentPlayer });
        });

    firebase.database().ref(`/rooms/${ room }/game/tricks`).on('value', (data) => {
        if (data.exists()) {
            if (false) {
                //Win?
            } else if (data.val().current === username) {
                $('#card-stack').html(`
                `);
            }
        }
    });
}

function winBid(winner) {
    if (username === winner) {
        firebase.database().ref(`/rooms/${ room }/kitty`).once('value').then( (data) => {
            let cards = data.val();
            for (let card in cards) {
                firebase.database().ref(`/rooms/${ room }/players/${ username }/cards`).update({ [card]: cards[card] });
            }
            $('#card-stack').html(`
                <p class="text-center">
                    Select ${ Object.keys(cards).length } cards to discard.
                </p>
            `);
            displayPlayerCards(`markCard(this, ${ Object.keys(cards).length })`);
        });
    } else {
        $('#card-stack').html(`
                <p class="text-center">
                    Waiting on ${ winner } to discard kitty cards and select trump card...
                </p>
                <div class="spinner-border text-primary d-block mx-auto" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
            `);  
    }
}

//Mark card to discard back to the kitty
function markCard(card, kitty_length) {
    let markedCards = $('.card.marked').length;

    if ($(card).hasClass('marked')) {
        markedCards--;
        $(card).removeClass('marked');
        $('#card-stack').html(`
            <p class="text-center">
                Select ${ kitty_length - markedCards } more card(s)
            </p>
        `);
    } else if (markedCards < kitty_length) {
        $(card).addClass('marked');
        markedCards++;

        if (kitty_length > markedCards)
            $('#card-stack').html(`
                <p class="text-center">
                    Select ${ kitty_length - markedCards } more card(s).
                </p>
            `);
        else
            $('#card-stack').html(`
                <p class="text-center">You have selected ${ markedCards }. Are you finished?</p>
                <button id="finish-bid-btn" type="button" onclick="discardMarkedCards()" class="btn btn-info w-100 mt-3">Finish</button>
            `);
    }
}

function discardMarkedCards() {
    firebase.database().ref(`/rooms/${ room }/kitty`).remove();

    firebase.database().ref(`/rooms/${ room }/players/${ username }/cards`).once('value').then( (data) => {
        let cards = data.val();
        let kitty = {};
        $('.card.marked').each(function() {
            let card = $(this).attr('name');
            kitty[card] = cards[card];
            firebase.database().ref(`/rooms/${ room }/players/${ username }/cards/${ card }`).remove();
        });
        firebase.database().ref(`/rooms/${ room }/players/${ username }`).update({ kitty: kitty });
    });

    $('#card-stack').html(`
        <label class="text-center">Select round's trump suit</label>
        <select class="form-control minimal-input" id="trump-select">
                <option>Black</option>
                <option>Green</option>
                <option>Red</option>
                <option>Yellow</option>
        </select>
        <button id="trump-select-btn" type="button" onclick="setTrumpSuit()" class="btn btn-info w-100 mt-3">Select</button>
    `);
}

function setTrumpSuit() {
    firebase.database().ref(`/rooms/${ room }/game`).update({ trump: $('#trump-select').val() });
    firebase.database().ref(`/rooms/${ room }/cmd`).set('startTricks');
}

function startBidding() {
    if (isHost)
        firebase.database().ref(`/rooms/${ room }/game/bid`).set({ bidder: Object.keys(playerList)[0], value: 80 });

    firebase.database().ref(`/rooms/${ room }/game/bid`).on('value', (data) => {
        if (data.exists()) {
            if (data.val().consPasses === Object.keys(playerList).length - 1 || data.val().bid >= 200) {
                firebase.database().ref(`/rooms/${ room }/game/bid`).off();
                winBid(data.val().bidder);
            } else if (data.val().bidder === username) {
                $('#card-stack').html(`
                    <div>
                        <p>Current Bidder: ${ data.val().bidder }</p>
                        <p>Current Bid: ${ data.val().value }</p>
                    </div>
                    <form id="bidding-form" class="bidform" onsubmit="bid(${ data.val().consPasses }); return false;">
                        <input id="bid-input" class="minimal-input" type="number" oninput="toggleBidButton(this.value);" step="5" min="${ parseInt(data.val().value) + 5 }" max="200" name="bid-input" placeholder="Enter bid">
                        <button id="bid-btn" type="submit" class="btn btn-danger w-100 mt-3">Pass</button>
                    </form>
                `);
            } else {
                $('#card-stack').html(`
                    <div>
                        <p>Current Bidder: ${ data.val().bidder }</p>
                        <p>Last Bid: ${ data.val().value }</p>
                    </div>
                `);
            }
        }
    });
}

function bid(passes) {
    let oldBidderIndex = Object.keys(playerList).indexOf(username);
    let newBidderIndex = oldBidderIndex + 1;
    if (oldBidderIndex >= Object.keys(playerList).length - 1)
        newBidderIndex = 0;

    if ($('#bid-input').val() !== '') {
        firebase.database().ref(`/rooms/${ room }/game/bid`).set({ 
                value: $('#bid-input').val(),
                bidder: Object.keys(playerList)[newBidderIndex],
                consPasses: null
            });
    } else {
        firebase.database().ref(`/rooms/${ room }/game/bid`).update({
            bidder: Object.keys(playerList)[newBidderIndex],
            consPasses: passes + 1 || 1
        });
    }
    
    return false;
}

function toggleBidButton(value) {
    if (value === '') {
        $('#bid-btn').text('Pass');
        $('#bid-btn').removeClass('btn-primary').addClass('btn-danger');
    } else {
        $('#bid-btn').text('Bid');
        $('#bid-btn').removeClass('btn-danger').addClass('btn-primary');
    }
}

function dealCards() {
    let cards = {};
    for (let color of ['Black', 'Green', 'Red', 'Yellow']) {
        for (let i = 1; i <= 14; i++) {
            if (i !== 2 && i !== 3 && i !== 4) {
                cards[color + ' ' + i] = {
                    value: i !== 1 ? i : 15,
                    name: color + ' ' + (i < 10 ? '0' + i : i),
                    suit: color,
                    path: '/assets/images/cards/' + color + ' ' + (i < 10 ? '0' + i : i) + '.svg'
                };
            }
        }
    }
    cards['Rook'] = {
        value: 20,
        name: 'Rook',
        suit: 'Rook',
        path: '/assets/images/cards/Crow.svg'
    };

    firebase.database().ref(`/rooms/${ room }`).update({ cards: cards });

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
function displayPlayerCards(command) {
    isStarted = true;
    firebase.database().ref(`/rooms/${ room }/players/${ username }/cards/`).on('value', (data) => {
        $('#player-cards').empty();

        let cards = data.val();
        for (let card in cards) {
            $('#player-cards').append(`
                <div class="card player-card" name="${ card }" onclick="${ command }" style="background: url('${ cards[card].path }'); background-size: 100% 100%;">
                </div>
            `);
        }
    });
}

function getNextPlayer(current) {
    let currentPlayerIndex = Object.keys(playerList).indexOf(current);
    let nextPlayerIndex = currentPlayerIndex + 1;
    if (currentPlayerIndex >= Object.keys(playerList).length - 1)
        nextPlayerIndex = 0;
    return Object.keys(playerList)[nextPlayerIndex];
}