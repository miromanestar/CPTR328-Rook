/* 
    Primary script to handle authentication and general dynamic visual
    Miro Manestar & Jacob Bahn
    CPTR-328 Principles of Networking
    Southern Adventist University
    December 4, 2020
*/

$(document).ready(function () {
    stickyHeader();
});

/*
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
*/

// -------------- PAGE LOADING FUNCTIONS --------------

window.addEventListener('popstate', function (e) {
    if (window.location.pathname === '/') {
        loadContent(`home`, '', false);
    } else {
        loadContent(window.location.pathname.substr(1), '', false);
    }
});

//When the page is loaded/refreshed, direct to correct page.
function onFirstLoad() {
    if (sessionStorage.getItem('redirect404') !== null) {
        loadContent(sessionStorage.getItem('redirect404').substr(1));
        sessionStorage.removeItem('redirect404');
    } else {
        loadContent('home');
    }
}

function loadContent(selection, state, changeState) {
    $('#page-content').fadeOut('fast', function () {
        $('#page-content').load(`${window.location.origin}/pages/${selection}`, function (response, status) {
            $('.navbar-collapse').collapse('hide');
            if (status === 'success') {
                loadPartials(); //Check for partials every time the page is reloaded, then finally run insertLightbox() when finished.
                $('#page-content').fadeIn('fast');
            }
            if (status === 'error') {
                loadContent('404'); //Possible infinite loop?
                return;
            }
        });
    });
    
    if (typeof changeState === 'undefined' && changeState !== false) {
        if (selection === 'home') { //Instead of home having a /home.html url, display as base domain.
            if (window.location.pathname !== '/') {
                window.history.pushState(state, '', '/');
                $('base').attr('href', '/')
            }
        } else if (selection !== '404' && selection !== window.location.pathname.substr(1)) { //Maintain page url despite 404
            window.history.pushState(state, '', `/${selection}`);
            $('base').attr('href', `${ location.origin }`)
        }
    }

    //Something I added specifically for rook
    if (window.username && window.room && selection !== 'room')
        $('#rejoin-btn').show();
    else
        $('#rejoin-btn').hide();

    //Make header link active based on URL
    $('.nav-link').each(function () {
        if ($(this).html().toLowerCase() === location.pathname.split('/')[1] || ( $(this).html().toLowerCase() === 'home' && location.pathname === '/' )) { //Highlight if on home page
            $(this).addClass('active');
        } else {
            $(this).removeClass('active');
        }
        //Activate dropdowns
        if ($(this).hasClass('dropdown-toggle')) {
            if (location.pathname.split('/').length > 2 && $(this).prev().hasClass('active')) {
                $(this).addClass('active');
            } else {
                $(this).removeClass('active');
            }
        }
    });

    //Activate dropdown items
    $('.dropdown-item').each(function () {
        if ($(this).attr('onclick').split("'")[1] === location.pathname.substr(1)) {
            $(this).addClass('active');
        } else {
            $(this).removeClass('active');
        }
    });
}

// -------------- MISCELLANEOUS FUNCTIONS --------------

function stickyHeader() {
    $(window).scroll(function () {
        if ($('.navigation').offset().top >= 50) {
            $('.navigation').addClass('nav-bg');
            $('header').addClass('divider-grey');
        } else {
            $('.navigation').removeClass('nav-bg');
            $('header').removeClass('divider-grey');
        }
    });
}

function loadPartials(callback) {
    $('[partial]').each(function (i) {
        $(this).load(`${ window.location.origin }/partials/${$(this).attr('partial')}`, function (response, status) {
            $(this).contents().unwrap();
            if (status === 'error') {
                $(this).html(`Error loading partial: ${$(this).attr('partial')}`);
            }
        });
    });
    
    if(callback)
        callback();
}