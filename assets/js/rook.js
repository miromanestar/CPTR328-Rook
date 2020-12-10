//Initialization
$(document).ready( function() {
    var username = window.history.state.username;
    var room = window.history.state.room;
    
    $('#room_name').text(room);
});