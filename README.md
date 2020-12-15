# CPTR328-Rook
### Welcome to the github repository for our game, Rook!
#### Miro Manestar & Jacob Bahn - Principles of Computer Networking

## How To Use
- To play the game, please visit [here](https://rook.miromanestar.com)
- You will see a list of rooms. There likely won't be any rooms available, so simply click "create".
- In the create menu, you can specify a name for the room, the max players, and a room password. 
    * (However, the password function doesn't do anything since I ran out of time)
- Once you hit "create room", it'll ask you to input a display name for the room. Please be civil.
- Once you enter the room, you'll see a "waiting for players" sign. There must at least be 3 players to start a game.
- Once 3 players join, the host will get a "start game" button. The host will be whoever created the room 
 * (If the host leaves the room, another client will become the host soon after. However, since the game requires at least three players to run, this is only meant to be used before the game is actually started).

Also, please note that you can horizontally scroll on the cards since it's impossible to fit them all within the screen vertically without something looking awkard.
You may drag on them or use the scrollbar.

## Gameplay
The game goes through two "states" after it is started, listed below:
1. Bidding
2. Discarding
3. Tricks

**NOTE: If you visit another page while the game is in session, you won't be able to properly join back into the game. *You'll have to restart the game.***

The host will control the transitions between each "state". Only they will get a button to start the game, and a button between tricks and rounds to begin the next cycle.

The game ends with the first player to reach a score over 500 points.

Click [here](https://rook.miromanestar.com/rules) for a more comprehensive set of rules.

### Bidding
In bidding, the player whose name is alphabetically just above the host becomes the first bidder. They may choose to pass or bid at least 5 points above the minimum bid of 80 (The bids must be in increments of 5). The maximum bid is 200. A bid winner is selected when all three players consecutively pass in bidding. At the end of the round, if the bid winner got at least as many points as they bid for the hand, they get the bid added to their score. Otherwise, they get the bid subtracted from their score.

### Discarding
After a bid winner is chosen, the bid winner also gets the select a number of cards from the center "kitty" and choose which ones they'd like to discard back into the central "kitty" from both their hand and the kitty. At the end of the game, the winner of the last trick will get the points in this kitty as well as an additional 20 points.

### Tricks
After the bid winner discards cards back to the kitty, the game will prompt the bid winner to select the "trump" suit for the round, then it will enter the "trick" state. The first trick of a round will be played first by the bid winner, with each consecutive trick being played by whoever wins the trick. The first card played in a trick will determine the suit of the trick. Cards will be darkened if you cannot play them. Be sure to scroll around on your cards if all the cards currently viewable are darkened.
At the end of each round, the game will calculate the players round scores and add that to their score totals and display them.

### Game ending
Once the first player reaches above a score of 500, the game ends. At this point, you must create a new room to start a new game.

# Troubleshooting
If you're having an issue, look here to see how you might fix them:
- You have at least three players in a room, but the host isn't getting the "start game" button
    * This is pretty simple. If you're the host, simply click the "home" button, then click the "rejoin button. If this doesn't work, leave the room, refresh, and make a new one.
- The game isn't continuing on somewhere; it's stuck
    * Unfortunately, if this happens, you pretty much have to create a new room (And preferably refresh before you do). It happens from time to time and I have no idea why.
- The room didn't delete itself when everyone left!
    * Because this game is pretty much entirely client side, it means that even clients have to delete rooms when they leave. Unfortunately, sometimes due to latency between the database and the client, the client fails to receive updated information in time and sometimes the room stays active. Your client will automatically delete the room if it remains inactive for more than 15 minutes.
- I keep getting "leaving room "null" after leaving a room.
    * This means that a listener failed to deactivate when you left a room. Refresh the window to get rid of it.

# Disclaimer
This game is quite buggy, so a lot of things tend to break in unpredictable ways. Also... PLEASE do not stress test this thing. It will NOT survive. It is built with whatever the programming equivalent of scotch tape and prayers are. It is not robust, merely a proof of concept. This game is basically "serverless", and has a topology better resembling a P2P network with a single point of failure more than anything else. On the plus side, it is really convenient and easy to use... mostly.


**Miro Manestar & Jacob Bahn &copy; 2020. All Rights Reserved.**
