// ===================== Winter 2021 EECS 493 Assignment 2 =====================
// This starter code provides a structure and helper functions for implementing
// the game functionality. It is a suggestion meant to help you, and you are not
// required to use all parts of it. You can (and should) add additional functions
// as needed or change existing functions.

// ==============================================
// ============ Page Scoped Globals Here ========
// ==============================================

// Counters
let throwingItemIdx = 1;

// Size Constants
const FLOAT_1_WIDTH = 149;
const FLOAT_2_WIDTH = 101;
const FLOAT_SPEED = 2;
const PERSON_SPEED = 25;
const OBJECT_REFRESH_RATE = 50;  //ms
const SCORE_UNIT = 100;  // scoring is in 100-point units

// Size vars
let maxPersonPosX, maxPersonPosY;
let maxItemPosX;
let maxItemPosY;

// Global Window Handles (gwh__)
let gwhGame, gwhStatus, gwhScore;

// Global Object Handles
let player;
let paradeRoute;
let paradeFloat1;
let paradeFloat2;
let paradeTimer;

/*
 * This is a handy little container trick: use objects as constants to collect
 * vals for easier (and more understandable) reference to later.
 */
const KEYS = {
  left: 37,
  up: 38,
  right: 39,
  down: 40,
  shift: 16,
  spacebar: 32
};

let createThrowingItemIntervalHandle;
let currentThrowingFrequency = 2000;


// ==============================================
// ============ Functional Code Here ============
// ==============================================

// Main
$(document).ready( function() {
  console.log("Ready!");

  // TODO: Event handlers for the settings panel

  // TODO: Add a splash screen and delay starting the game

  // Set global handles (now that the page is loaded)
  // Allows us to quickly access parts of the DOM tree later
  gwhGame = $('#actualGame');
  gwhStatus = $('.status-window');
  gwhScore = $('#score-box');
  player = $('#player');  // set the global player handle
  paradeRoute = $("#paradeRoute");
  paradeFloat1 = $("#paradeFloat1");
  paradeFloat2 = $("#paradeFloat2");

  // Set global positions for thrown items
  maxItemPosX = $('.game-window').width() - 50;
  maxItemPosY = $('.game-window').height() - 40;

  // Set global positions for the player
  maxPersonPosX = $('.game-window').width() - player.width();
  maxPersonPosY = $('.game-window').height() - player.height();

  // Keypress event handler
  $(window).keydown(keydownRouter);
  
  // Periodically check for collisions with thrown items (instead of checking every position-update)
  setInterval( function() {
    checkCollisions();
  }, 100);

  $("#settings-button").click(function() {
    $(this).hide();
    $('.settings-panel').show();
  });
  $("#discard").click(function(event) {
    event.preventDefault()
    $("#item-freq").val(currentThrowingFrequency);
    $('.settings-panel').hide();
    $('.settings-button').show();

  });
  $("#save").click(function(event) {
    event.preventDefault()
    let user_input = parseInt($("#item-freq").val());
    if (user_input < 100) {
      $("#item-freq").val(currentThrowingFrequency);
      alert("Frequency must be a number greater than 100");
    }
    else {
      currentThrowingFrequency = user_input;
      $("#item-freq").val(currentThrowingFrequency);
      clearInterval(createThrowingItemIntervalHandle);
      createThrowingItemIntervalHandle = setInterval(createThrowingItem, currentThrowingFrequency);
    }
    $('.settings-panel').hide();
    $('.settings-button').show();
  });

  // Move the parade floats
  startParade();

  // Throw items onto the route at the specified frequency
  createThrowingItemIntervalHandle = setInterval(createThrowingItem, currentThrowingFrequency);
});

// Key down event handler
// Check which key is pressed and call the associated function
function keydownRouter(e) {
  switch (e.which) {
    case KEYS.shift:
      break;
    case KEYS.spacebar:
      break;
    case KEYS.left:
    case KEYS.right:
    case KEYS.up:
    case KEYS.down:
      movePerson(e.which);
      break;
    default:
      console.log("Invalid input!");
  }
}

// Handle player movement events
// TODO: Stop the player from moving into the parade float. Only update if
// there won't be a collision
function movePerson(arrow) {
  
  switch (arrow) {
    case KEYS.left: { // left arrow
      let newPos = parseInt(player.css('left'))-PERSON_SPEED;
      if (newPos < 0) {
        newPos = 0;
      }
      if (willCollideFloat(player, paradeFloat1, paradeFloat2, -1 * PERSON_SPEED, 0)) {
        break;
      }
      player.css('left', newPos);
      break;
    }
    case KEYS.right: { // right arrow
      let newPos = parseInt(player.css('left'))+PERSON_SPEED;
      if (newPos > maxPersonPosX) {
        newPos = maxPersonPosX;
      }
      if (willCollideFloat(player, paradeFloat1, paradeFloat2, PERSON_SPEED, 0)) {
        break;
      }
      player.css('left', newPos);
      break;
    }
    case KEYS.up: { // up arrow
      let newPos = parseInt(player.css('top'))-PERSON_SPEED;
      if (newPos < 0) {
        newPos = 0;
      }
      if (willCollideFloat(player, paradeFloat1, paradeFloat2, 0, -1 * PERSON_SPEED)) {
        break;
      }
      player.css('top', newPos);
      break;
    }
    case KEYS.down: { // down arrow
      let newPos = parseInt(player.css('top'))+PERSON_SPEED;
      if (newPos > maxPersonPosY) {
        newPos = maxPersonPosY;
      }
      if (willCollideFloat(player, paradeFloat1, paradeFloat2, 0, PERSON_SPEED)) {
        break;
      }
      player.css('top', newPos);
      break;
    }
  }
}

// Check for any collisions with thrown items
// If needed, score and remove the appropriate item
function checkCollisions() {
  $('.throwingItem' + '> img').each(function() {
    if(isColliding($(this), player)) {
      if (!$(this).parent().hasClass('circle')) {
        gwhScore.html(parseInt(gwhScore.text()) + 100);
        if($(this).parent().hasClass('beads')) {
          $('#beadsCounter').html(parseInt($('#beadsCounter').text()) + 1);
        }
        else {
          $('#candyCounter').html(parseInt($('#candyCounter').text()) + 1);
        }
        
      }
      $(this).parent().addClass('circle');
      graduallyFadeAndRemoveElement($(this).parent(), 1000);
    }
  });
}

// Move the parade floats (Unless they are about to collide with the player)
function startParade(){
  console.log("Starting parade...");
  paradeTimer = setInterval( function() {
    let game_width = $('.game-window').width();
    let newPos1 = parseInt(paradeFloat1.css('left')) + FLOAT_SPEED; 
    let newPos2 = parseInt(paradeFloat2.css('left')) + FLOAT_SPEED; 
    
    let float_one_location = parseInt(paradeFloat1.css('left'));
    let float_two_location = parseInt(paradeFloat2.css('left'));
    if (!willCollide(paradeFloat2, player, FLOAT_SPEED, 0)) {
      if (float_two_location > game_width) {
        paradeFloat2.css('left', -150);
      }
      else if (float_two_location > float_one_location) {
        paradeFloat2.css('left', newPos2);
      }
      
      if (float_one_location < game_width) {
        paradeFloat1.css('left', newPos1);
      }
      else {
        paradeFloat1.css('left', -300);
      }
    }

    

      // TODO: (Depending on current position) update left value for each 
      // parade float, check for collision with player, etc.
      checkCollisions();
      

  }, OBJECT_REFRESH_RATE);
}

// Get random position to throw object to, create the item, begin throwing
function createThrowingItem(){
  let float_two_location = parseInt(paradeFloat2.css("left"));
  let game_width = $('.game-window').width();
  if (float_two_location < -74 || float_two_location > game_width - 72) {
    return;
  }
  x_value = Math.floor(getRandomNumber(0, maxItemPosX));
  y_value = Math.floor(getRandomNumber(0, maxItemPosY));

  let imageString;
  let type;
  if (getRandomInt(3) === 2) {
    type = "candy";
    imageString = "candy.png";
  }
  else {
    type = "beads";
    imageString = "beads.png"
  }
  gwhGame.append(createItemDivString(throwingItemIdx, type, imageString));
  let current_item = $('#i-'+ throwingItemIdx);
  let start_x = parseInt(paradeFloat2.css("left")) + FLOAT_2_WIDTH - 50;
  let start_y = 230;
  current_item.css("left", start_x);
  current_item.css("top", start_y);
  throwingItemIdx++;

  num_refreshes = 2000 / OBJECT_REFRESH_RATE;
  x_change = (x_value - start_x) / num_refreshes
  y_change = (y_value - start_y) / num_refreshes;
  updateThrownItemPosition(current_item, x_change, y_change, num_refreshes);


}

// Helper function for creating items
// throwingItemIdx - index of the item (a unique identifier)
// type - beads or candy
// imageString - beads.png or candy.png
function createItemDivString(itemIndex, type, imageString){
  return "<div id='i-" + itemIndex + "' class='throwingItem " + type + "'><img src='img/" + imageString + "'/></div>";
}

// Throw the item. Meant to be run recursively using setTimeout, decreasing the 
// number of iterationsLeft each time. You can also use your own implementation.
// If the item is at it's final postion, start removing it.
function updateThrownItemPosition(elementObj, xChange, yChange, iterationsLeft){
  if (iterationsLeft !== 0) {
    x_i = parseInt(elementObj.css("left"));
    y_i = parseInt(elementObj.css("top"));
    let new_x = x_i + xChange;
    let new_y = y_i + yChange;
    if (new_x < 0) {
      new_x = 0;
      new_y = y_i;
    }
    if (new_y < 0) {
      new_y = 0;
      new_x = x_i;
    }
    elementObj.css("left", new_x);
    elementObj.css("top", new_y);
    setTimeout(function() {updateThrownItemPosition(elementObj, xChange, yChange, iterationsLeft - 1)}, OBJECT_REFRESH_RATE);
  }
  else {
    setTimeout(function() {graduallyFadeAndRemoveElement(elementObj)}, 5000);
  }
  
}

function graduallyFadeAndRemoveElement(elementObj, time=2000){
  // Fade to 0 opacity over 2 seconds
  elementObj.fadeTo(time, 0, function(){
    $(this).remove();
  });
}

// ==============================================
// =========== Utility Functions Here ===========
// ==============================================

// Are two elements currently colliding?
function isColliding(o1, o2) {
  return isOrWillCollide(o1, o2, 0, 0);
}

// Will two elements collide soon?
// Input: Two elements, upcoming change in position for the moving element
function willCollide(o1, o2, o1_xChange, o1_yChange){
  return isOrWillCollide(o1, o2, o1_xChange, o1_yChange);
}

// Are two elements colliding or will they collide soon?
// Input: Two elements, upcoming change in position for the moving element
// Use example: isOrWillCollide(paradeFloat2, person, FLOAT_SPEED, 0)
function isOrWillCollide(o1, o2, o1_xChange, o1_yChange){
  const o1D = { 'left': o1.offset().left + o1_xChange,
        'right': o1.offset().left + o1.width() + o1_xChange,
        'top': o1.offset().top + o1_yChange,
        'bottom': o1.offset().top + o1.height() + o1_yChange
  };
  const o2D = { 'left': o2.offset().left,
        'right': o2.offset().left + o2.width(),
        'top': o2.offset().top,
        'bottom': o2.offset().top + o2.height()
  };
  // Adapted from https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
  if (o1D.left < o2D.right &&
    o1D.right > o2D.left &&
    o1D.top < o2D.bottom &&
    o1D.bottom > o2D.top) {
     // collision detected!
     return true;
  }
  return false;
}
function willCollideFloat(o1, o2, o3, o1_xChange, o1_yChange) {
  return willCollide(o1, o2, o1_xChange, o1_yChange) || willCollide(o1, o3, o1_xChange, o1_yChange);
}

// Get random number between min and max integer
function getRandomNumber(min, max){
  return (Math.random() * (max - min)) + min;
}
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
function getRandomIntRange(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
