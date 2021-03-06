var Modal = ReactBootstrap.Modal;
var Well = ReactBootstrap.Well;
var ButtonToolbar = ReactBootstrap.ButtonToolbar;
var Button = ReactBootstrap.Button;

var RogueLikeDungeonCrawlerGameBoard = React.createClass({
  getInitialState: function() {
    return {
      width: 85,
      height: 40,
      carveDensity: .165, // lower = open / higher = narrow
      minDungeonSize: 150,
      level: 1,
      player: {health: 100, maxHealth: 100, attack: 15, exp: 0},
      objectPos: [],
      numEnemies: 0,
      currentEnemy: {health: '', attack: 0, maxHealth: ''},
      fog: true,
      board: [],
      showDeathModal: false,
      showWinModal: false
    }
  },

  componentWillMount: function() {
    this.startGame();
  },

  startGame: function(player) {
    this.createBoard(player);
    document.addEventListener("keydown", this.movePlayer);
  },

  pauseGame: function(modal) {
    if(modal == 'win') {
      this.setState({
        showWinModal: true
      })
    } else if(modal == 'lose') {
      this.setState({
        showDeathModal: true
      })
    }
    document.removeEventListener("keydown", this.movePlayer);
  },

  restartGame: function(isContinue) {
    var currChar = this.state.player;

    if(isContinue) {
      if(this.state.showDeathModal) {
        currChar.health = currChar.maxHealth;
      }
      this.setState({
        showDeathModal: false,
        showWinModal: false,
        player: currChar
      });
      document.addEventListener("keydown", this.movePlayer);
    } else {
      this.setState({
        showDeathModal: false,
        showWinModal: false,
        carveDensity: .18,
        level: 1,
        player: {health: 100, maxHealth: 100, attack: 15, exp: 0},
        currentEnemy: {health: '', attack: 0}
      });

      setTimeout(function() {
        this.startGame();
      }.bind(this));
    }
  },

  createBoard: function(startPos) {
    var newObjectPos = [];
    var open = [];
    var initCharPos;
    var numEnemies;

    var enemyDensity = 75;

    if(startPos && startPos.x && startPos.y && startPos.health > 0) {
      open.push({x: startPos.x, y: startPos.y, carve: true});
      initCharPos = startPos;
    } else {
      open.push({x: Math.floor(this.state.width/2), y: Math.floor(this.state.height/2), carve: true});
      initCharPos = this.state.player;
      initCharPos.x = open[0].x;
      initCharPos.y = open[0].y;
    }

    var newBoard = [];
    for (var j=0; j < this.state.height; j++) {
      var newRow = [];
      for (var i=0; i < this.state.width; i++) {
        newRow.push({type: 0, revealed: 0});
      }
      newBoard.push(newRow);
    }

    newBoard[open[0].y][open[0].x] = {type: 1, revealed: 1};

    for(var i=0; i<open.length; i++) {
      var carveNum;
      var randClose = Math.random()

    if(i == open.length-1) {
      carveNum = getRandomInt(2,3);
      randClose = 1;
    } else {
      carveNum = getRandomInt(1,2);
    }

    if(randClose < this.state.carveDensity && open.length > this.state.minDungeonSize) {
      open[i].carve = false;
    }

    if(open[i].carve) {
      var carveCount = 0;

      while(carveCount < carveNum) {

        if( (open[i].y-1 <= 1 || newBoard[open[i].y-1][open[i].x].type !== 0) &&
          (open[i].x-1 <= 1 || newBoard[open[i].y][open[i].x-1].type !== 0) &&
          (open[i].y+1 >= this.state.height-2 || newBoard[open[i].y+1][open[i].x].type !== 0) &&
          (open[i].x+1 >= this.state.width-2 || newBoard[open[i].y][open[i].x+1].type !== 0) ) {
          open[i].carve = false;
          carveCount = carveNum;
        }

        var direction = Math.random();
        if(direction < .25) {
          //Carve top
          if(open[i].y > 1) {
            if(newBoard[open[i].y-1][open[i].x].type == 0) {
              newBoard[open[i].y-1][open[i].x] = {type: 1, revealed: 0};
              carveCount++;
              open.push({
                x: open[i].x,
                y: open[i].y-1,
                carve: true
              });
            }
          }

        } else if(direction < .5) {
          //Carve right
          if(open[i].x < this.state.width-2) {
            if(newBoard[open[i].y][open[i].x+1].type == 0) {
              newBoard[open[i].y][open[i].x+1] = {type: 1, revealed: 0};
              carveCount++;
              open.push({
                x: open[i].x+1,
                y: open[i].y,
                carve: true
              });
            }
          }

        } else if (direction < .75) {
          //Carve bottom
          if(open[i].y < this.state.height-2) {
            if(newBoard[open[i].y+1][open[i].x].type == 0) {
              newBoard[open[i].y+1][open[i].x] = {type: 1, revealed: 0};
              carveCount++;
              open.push({
                x: open[i].x,
                y: open[i].y+1,
                carve: true
              });
            }
          }

        } else {
          //Carve left
          if(open[i].x > 1) {
            if(newBoard[open[i].y][open[i].x-1].type == 0) {
              newBoard[open[i].y][open[i].x-1] = {type: 1, revealed: 0};
              carveCount++;
              open.push({
                x: open[i].x-1,
                y: open[i].y,
                carve: true
              });
            }
          }
        }

        i = 0;
      }
    }
  }

    if(this.state.level < 5) {
      newObjectPos = this.spawnObjects('enemy', Math.ceil(open.length/enemyDensity), open, newObjectPos);
      numEnemies = newObjectPos.length;

      newObjectPos.push({type: 'end', x: open[open.length-1].x, y: open[open.length-1].y, health: 1, attack: 0})

      newObjectPos = this.spawnObjects('weapon', 1, open, newObjectPos);
    } else {
      newObjectPos.push({type: 'enemy', special: 'boss', x: open[open.length-1].x, y: open[open.length-1].y, health: 500, maxHealth: 500, attack: getRandomInt(15,20), currentEnemy: false});
      numEnemies = 1;
    }

    newObjectPos = this.spawnObjects('health', 6-this.state.level, open, newObjectPos);
      this.setState({
        player: initCharPos,
        objectPos: newObjectPos,
        numEnemies: numEnemies,
        board: newBoard
      });

      setTimeout(function() {
        this.movePlayer(0);
      }.bind(this))
  },

  spawnObjects: function(type, amt, open, newItemPos) {
    var randHealth, randAttack, randOpen, isOverlap, special;

    for(var i=0; i<amt; i++) {
      randHealth = type == 'enemy' ? getRandomInt(25+(this.state.level*25),75+(this.state.level*25)) : 1;
      randAttack = type == 'enemy' ? getRandomInt(this.state.level*4,this.state.level*5) : 0;
      randOpen = getRandomInt(1, open.length-1);
      isOverlap = false;

      for(var j=0; j<newItemPos.length; j++) {
      if(open[randOpen].x == newItemPos[j].x && open[randOpen].y == newItemPos[j].y) isOverlap = true;
      }
      if(!isOverlap) {
      newItemPos.push({type: type, special: '', x: open[randOpen].x, y: open[randOpen].y, health: randHealth, maxHealth: randHealth, attack: randAttack, currentEnemy: false});
      }
    }
    return newItemPos;
  },

  movePlayer: function(event) {
    if(event) {
      event.preventDefault();
    }

    var newBoard;
    var newPos = this.state.player;
    var newCurrEnemy = this.state.currentEnemy;
    var newObjectPos = this.state.objectPos.slice(0);
    var numEnemies = this.state.numEnemies;
    var isCollision = false;
    var combatResults;
    var collisionResults;
    var isEnd = false;

    switch(event.keyCode) {
      case 37: // Left
        for(var i=0; i<newObjectPos.length; i++) {
          if(newObjectPos[i].x == newPos.x-1 && newObjectPos[i].y == newPos.y) {
          if(newObjectPos[i].type == 'end') {
            isEnd = true;
            break;
          }
          collisionResults = this.checkCollision(newObjectPos[i], newPos, 'left');
          newObjectPos[i] = collisionResults.thing;
          newPos = collisionResults.char;
          if(newObjectPos[i].type == 'enemy') newCurrEnemy = newObjectPos[i];
          isCollision = true;
          }
          if(newObjectPos[i].health == 0) {
          if(newObjectPos[i].type == 'enemy') numEnemies--;
          newObjectPos.splice(i,1);
          }
        }
        if(this.state.board[newPos.y][newPos.x-1].type !== 0 && !isCollision) newPos.x--;
          break;
      case 38: // Up
        for(var i=0; i<newObjectPos.length; i++) {
          if(newObjectPos[i].x == newPos.x && newObjectPos[i].y == newPos.y-1) {
          if(newObjectPos[i].type == 'end') {
            isEnd = true;
            break;
          }
          collisionResults = this.checkCollision(newObjectPos[i], newPos, 'top');
          newObjectPos[i] = collisionResults.thing;
          newPos = collisionResults.char;
          if(newObjectPos[i].type == 'enemy') newCurrEnemy = newObjectPos[i];
          isCollision = true;
          }
          if(newObjectPos[i].health == 0) {
          if(newObjectPos[i].type == 'enemy') numEnemies--;
          newObjectPos.splice(i,1);
          }
        }
        if(this.state.board[newPos.y-1][newPos.x].type !== 0 && !isCollision) newPos.y--;
          break;
      case 39: // Right
        for(var i=0; i<newObjectPos.length; i++) {
          if(newObjectPos[i].x == newPos.x+1 && newObjectPos[i].y == newPos.y) {
          if(newObjectPos[i].type == 'end') {
            isEnd = true;
            break;
          }
          collisionResults = this.checkCollision(newObjectPos[i], newPos, 'right');
          newObjectPos[i] = collisionResults.thing;
          newPos = collisionResults.char;
          if(newObjectPos[i].type == 'enemy') newCurrEnemy = newObjectPos[i];
          isCollision = true;
          }
          if(newObjectPos[i].health == 0) {
          if(newObjectPos[i].type == 'enemy') numEnemies--;
          newObjectPos.splice(i,1);
          }
        }
        if(this.state.board[newPos.y][newPos.x+1].type !== 0 && !isCollision)	newPos.x++;
          break;
      case 40: // Down
        for(var i=0; i<newObjectPos.length; i++) {
          if(newObjectPos[i].x == newPos.x && newObjectPos[i].y == newPos.y+1) {
          if(newObjectPos[i].type == 'end') {
            isEnd = true;
            break;
          }
          collisionResults = this.checkCollision(newObjectPos[i], newPos, 'bottom');
          newObjectPos[i] = collisionResults.thing;
          newPos = collisionResults.char;
          if(newObjectPos[i].type == 'enemy') newCurrEnemy = newObjectPos[i];
          isCollision = true;
          }
          if(newObjectPos[i].health == 0) {
          if(newObjectPos[i].type == 'enemy') numEnemies--;
          newObjectPos.splice(i,1);
          }
        }
        if(this.state.board[newPos.y+1][newPos.x].type !== 0 && !isCollision) newPos.y++;
          break;
      };

      if(newPos.health <= 0) {
        this.pauseGame('lose');
      }

      newBoard = this.state.board;

      var minY = newPos.y-6 < 0 ? -newPos.y : -6;
      var minX = newPos.x-6 < 0 ? -newPos.x : -6;
      var maxY = newPos.y+6 > this.state.height-1 ? this.state.height-1 - newPos.y : 6;
      var maxX = newPos.x+6 > this.state.width-1 ? this.state.width-1 - newPos.x : 6;

      for(var j = minY; j <= maxY; j++) {
        for(var i = minX; i <= maxX; i++) {
        if(Math.abs(j) + Math.abs(i) <= 9) {
          newBoard[newPos.y+j][newPos.x+i].revealed = 1;
        }
        }
      }

      if(!isEnd) {
        this.setState({
        player: newPos,
        objectPos: newObjectPos,
        numEnemies: numEnemies,
        currentEnemy: newCurrEnemy,
        board: newBoard
        })
      } else {
        this.setState({
        carveDensity: this.state.carveDensity+.05,
        minDungeonSize: this.state.minDungeonSize-20,
        level: this.state.level+1
        })

        this.startGame(newPos);
    }
  },

  checkCollision: function(objectPos, player, direction) {
    var combatResults;

    if(objectPos.type == 'enemy') {
      combatResults = this.checkCombat(objectPos, player);
      objectPos = combatResults.enemy;
      player.health = combatResults.char.health;
    } else if (objectPos.type == 'health') {
      player.health = player.maxHealth;
      objectPos.health = 0;
      objectPos.attack = 0;
    } else if (objectPos.type == 'weapon') {
      player.attack += 5;
      objectPos.health = 0;
      objectPos.attack = 0;
    }

    return {thing: objectPos, char: player}
  },

  checkCombat: function(enemyPos, player) {
    if(enemyPos.health - player.attack > 0) {
      enemyPos.health -= player.attack;
    } else {
      enemyPos.health = 0;
      enemyPos.attack = 0;
      player.exp += 15;

      if(player.exp >= 100) {
      player.attack += 5;
      player.maxHealth += 25;
      player.health = player.maxHealth;
      player.exp -= 100;
      }

      if(enemyPos.special == 'boss') {
      this.pauseGame('win');
      }
    }

    if(player.health - enemyPos.attack > 0) {
      player.health -= enemyPos.attack
    } else {
      player.health = 0;
    }

    enemyPos.currentEnemy = true;
    return {enemy: enemyPos, char: player};
  },

  toggleFog: function() {
    if(this.state.fog) {
      $('body').css('background-color', 'black');
    } else {
      $('body').css('background-color', 'black');
    }

    this.setState({
      fog: !this.state.fog
    })
  },

  render: function() {
    return(
      <div>
        {<div>
        <Modal show={this.state.showDeathModal} bsSize="sm">
          <Modal.Body>
            <h1>You Lose!</h1>
          </Modal.Body>
          <Modal.Footer>
            <ButtonToolbar>
              <Button bsStyle="danger" onClick={this.restartGame.bind(null, false)}>Restart</Button>
            </ButtonToolbar>
          </Modal.Footer>
        </Modal>

        <Modal show={this.state.showWinModal} bsSize="sm">
          <Modal.Body>
            <h1>You Win!</h1>
          </Modal.Body>
          <Modal.Footer>
            <ButtonToolbar>
            <Button bsStyle="danger" onClick={this.restartGame.bind(null, false)}>Restart</Button>
            </ButtonToolbar>
          </Modal.Footer>
        </Modal>
        </div>}
        <Board board={this.state.board} player={this.state.player} objectPos={this.state.objectPos} onKeyPress={this.movePlayer} isFog={this.state.fog}/>
        {<div>
          <br/>
          <Well>
            <Well id="dungeon-info">
              <div className="info-title">Dungeon {this.state.level}</div>
              <div className="panel panel-default">
                <div className="panel-heading"># Enemies</div>
                <div className="panel-body">{this.state.numEnemies}</div>
              </div>
            </Well>

            <Well id="player-info">
              <div className="info-title">Player Info</div>
              <div className="panel panel-default" id="char-exp-panel">
                <div className="panel-heading">XP</div>
                <div className="panel-body">{this.state.player.exp}</div>
              </div>
              <div className="panel panel-default" id="char-hp-panel">
                <div className="panel-heading">Health</div>
                <div className="panel-body">{this.state.player.health}/{this.state.player.maxHealth}</div>
              </div>
              <div className="panel panel-default" id="char-attack-panel">
                <div className="panel-heading">Attack</div>
                <div className="panel-body">{this.state.player.attack}</div>
              </div>
            </Well>

            <Button bsStyle="danger" onClick={this.toggleFog}>Fog {this.state.fog ? 'Off' : 'On'}</Button>
          </Well>
        </div>}
      </div>)
    }
  })

    var Board = React.createClass({
      printBoard: function() {
        var height = this.props.board.length;
        var width = this.props.board[0].length;
        var isRevealed = "";
        var icon;
        var cellColor;
        var cellID;
        var charHP = this.props.player.health / this.props.player.maxHealth;
        var enemyHP;
        var widthHP = 23;

        var things = this.props.objectPos.slice(0);

        var printRows = this.props.board.map(function(row, j) {
          var printCells = row.map(function(cell, i) {
        icon = "";
        cellColor = "";
        cellID = (j*width) + i;

        if(cell.type == 1) {
          cellColor = "room";
        }

        if(cell.revealed || !this.props.isFog) {
          isRevealed = "";
        } else {
          isRevealed = "fog";
        }

        if(i == this.props.player.x && j == this.props.player.y) {
          icon = getTile('player',  'char')
        }

        if(cell.revealed || !this.props.isFog) {
          for(var k=0; k<things.length; k++) {
          if(i == things[k].x && j == things[k].y) {
            switch(things[k].type) {
            case 'enemy':
              enemyHP = things[k].health / things[k].maxHealth;
              if(things[k].special == 'boss') {
              icon = getTile('boss', 'enemy');
              } else if(things[k].maxHealth <= 100) {
              icon = getTile('ghost', 'enemy');
              } else if(things[k].maxHealth > 100) {
              icon = getTile('android', 'enemy');
              }

              break;
            case 'health':
              icon = getTile('heart');
              break;
            case 'weapon':
              icon = getTile('weapon');
              break;
            case 'end':
              icon = getTile('portal');
              break;
            }

            things.splice(k, 1);
            break;
          }
          }
        }

        return(
          <div className={"cell " + cellColor + " " + isRevealed} key={cellID} dangerouslySetInnerHTML={{__html: icon}}></div>
          )
        }.bind(this))
          return(
            <div className="row" key={j}>{printCells}</div>
          )
        }.bind(this))

        return printRows;
      },

      render: function() {
        return(
          <div id="board">
            {this.printBoard()}
          </div>
        )
      }
    })

    ReactDOM.render(<RogueLikeDungeonCrawlerGameBoard />, document.getElementById("roguelike-dungeon-crawler"));

    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getTile(name, className) {
      switch(name) {
        case 'player':
          return '<div class="' + className + '"><i style="color: green" class="fa fa-user" aria-hidden="true"></i></div>';
        case 'boss':
          return '<div class="' + className + '"><i style="color: red" class="fa fa-odnoklassniki" aria-hidden="true"></i></div>';
        case 'ghost':
          return '<div class="' + className + '"><i style="color: blue" class="fa fa-snapchat-ghost" aria-hidden="true"></i></div>';
        case 'android':
          return '<div class="' + className + '"><i style="color: blue" class="fa fa-android" aria-hidden="true"></i></div>';
        case 'heart':
          return '<div class="' + className + '"><i style="color: red" class="fa fa-heart" aria-hidden="true"></i></div>';
        case 'weapon':
          return '<div class="' + className + '"><i style="color: black" class="fa fa-wrench" aria-hidden="true"></i></div>';
        case 'portal':
          return '<div class="' + className + '"><i style="color: black" class="fa fa-bullseye" aria-hidden="true"></i></div>';
      }
    }
