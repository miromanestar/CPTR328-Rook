/* 
    Primary script to handle authentication and general dynamic visual
    Miro Manestar & Jacob Bahn
    CPTR-328 Principles of Networking
    Southern Adventist University
    December 4, 2020
*/

//Global variables
var currentUser = null;
var users = null;


//Check for authentication
var loginChecked = false;
firebase.auth().onAuthStateChanged(function(user) {
    if (!loginChecked) {
        checkAuth(user);
        loginChecked = true;
    }
});

function checkAuth(user) {
    currentUser = user;
    if (user) {
        console.log(`User ${ currentUser.displayName } logged in!`);
        loginAnimation();
    } else {
        console.log('No user logged in!');
        displayLogin();
    }
}

//Firebase Login/Logout functions
function login() {
    //Check if username already exists
    let username = $('#name-input').val();
    firebase.database().ref(`/users/${ username }`).once('value').then( (data) => {
        if (!data.exists() || Date.now() - data.val().lastUpdate > 15 * 60 * 1000) //Allow user if user doesn't already exist or hasn't been updated in more than 15 minutes
            firebase.auth().signInAnonymously().then( (info) => {
                info.user.updateProfile({
                    displayName: username
                }).then( () => {
                    checkAuth(info.user);
                    setUserInfo(username);
                });
            }).catch( (error) => {  console.error(`${ error.code }: ${ error.message }`); });
    else
        $('#auth-content').prepend(`
        <div class="alert alert-danger" role="alert">
            <p>
                A user with the name <b><i>${ username }</i></b> is already online. Please choose another username.
            </p>
        </div>
        `);
    });
}

function logout() {
    firebase.auth().signOut().then(function() { }, 
    function(error) {
        console.error('Logout Error:', error);
    });
    window.location.href='/';
}

function displayLogin() {
    $('#auth-content').delay(1000).fadeOut('fast', function() {
        $(this).html(`
        <form id="login-form" class="login" onsubmit="return false;">
                <input id="name-input" class="minimal-input" type="text" name="login-name" placeholder="Display Name">
                <button id="login-btn" type="submit" class="btn btn-primary w-100" onclick="login()">Enter</button>
        </form>
        `);
    }).fadeIn('fast');
}

function loginAnimation() {
    $('#auth-content').delay(500).fadeOut('fast', function() {
        $(this).html(`
        <div class="alert alert-success" role="alert">
            <p>
                Success! You are being logged in as "${ currentUser.displayName }"!
            </p>
            <div class="spinner-border text-primary d-block mx-auto" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
        `).fadeIn('fast', function() {
            $('#auth-overlay').delay(300).fadeOut('fast');
        });
    });
}

function setUserInfo(username) {
    firebase.database().ref(`/users/${ username }`).set({
        uid: firebase.auth().currentUser.uid,
        created: Date.now(),
        lastUpdate: Date.now(),
        type: null
    });
}
