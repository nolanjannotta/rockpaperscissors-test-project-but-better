pragma solidity 0.8.0;

import"@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import"@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./NFTPrize.sol";

contract RockPaperScissor is NFTPrize {
    
    mapping(IERC20Metadata => mapping(address => uint)) public winningBalances;

    string public rpsName;
    uint public nftId;

    struct Player {
    address playerAddr_;
    uint move_;
    bool moved_;
    }

    struct Game {
    Player player1_;
    Player player2_;
    IERC20Metadata token_;
    uint betAmount_;
    bool finished_;
    string tokenSymbol_;
    uint gameId_;
    uint jackpot_;
    uint time_;
    }
    
    event GameCreated(uint _gameId, address _player1, string _tokenSymbol,uint _betAmount);
    event Player2Joined(uint _gameId, address _player1, address _player2, string _tokenSymbol, uint _jackpot);
    event Winner(address _winner, uint _gameId, string _tokenSymbol, uint _jackpot);
    event MoveMade(address _mover, uint _gameId, bool _player1Moved, bool _player2Moved);
    
    uint public gameCounter;
    
  
    
    mapping(uint => Game) private games;

    constructor() NFTPrize() {
        rpsName = "rock papER sCissor";
    }
    
    function createGame(address _token, uint _bet) public {
        _createGame(_token, _bet);
        _betTransfer(_bet, gameCounter);
    }

    function _betTransfer(uint _bet, uint _gameId) internal {
        // places bet using users wallet balances
        games[_gameId].token_.transferFrom(msg.sender, address(this), (_bet * 1 ether));
    }

    // function _betBalance(address _token, uint _bet) internal {
    //     // places bet using users in game balances
    //     // require(winningBalances[IERC20Metadata(_token)][msg.sender] > 0, "you don't have these tokens to bet");
        
    // }

    function _createGame(address _token, uint _bet) internal {

        gameCounter ++;
        Game storage _game = games[gameCounter];
        _game.player1_.playerAddr_ = msg.sender;
        _game.betAmount_ = _bet;
        _game.token_ = IERC20Metadata(_token);
        _game.gameId_ = gameCounter;
        _game.tokenSymbol_ = games[gameCounter].token_.symbol();
        _game.jackpot_ = _bet;
        _game.time_ = block.timestamp;
        emit GameCreated(gameCounter, msg.sender, games[gameCounter].tokenSymbol_, _bet);

    }


    function doubleOrNothing(address _token) public {
        // creates game by betting all of creaters' in game balance
        require(winningBalances[IERC20Metadata(_token)][msg.sender] > 0, "you don't have these tokens to bet");
        uint balance = winningBalances[IERC20Metadata(_token)][msg.sender];
        _createGame(_token, balance);
        winningBalances[IERC20Metadata(_token)][msg.sender] = 0;
        // emit GameCreated(gameCounter, msg.sender, games[gameCounter].tokenSymbol_, balance);
    }

    function allIn(uint _gameId) public {
        Game storage _game = games[_gameId];
        uint balance = winningBalances[IERC20Metadata(_game.token_)][msg.sender];
        require(_game.finished_ == false);
        require(msg.sender != _game.player1_.playerAddr_, "you can't join your own game");
        require(_game.player1_.playerAddr_ != address(0), "this game doesnt exist");
        require(_game.player2_.playerAddr_ == address(0));
        _game.player2_.playerAddr_ = msg.sender;
        _game.jackpot_ = _game.jackpot_ + balance;
        winningBalances[IERC20Metadata(_game.token_)][msg.sender] = 0;

    }

    function joinGame(uint _gameId) public {
        Game storage _game = games[_gameId];
        require(_game.finished_ == false);
        require(msg.sender != _game.player1_.playerAddr_, "you can't join your own game");
        require(_game.player1_.playerAddr_ != address(0), "this game doesnt exist");
        require(_game.player2_.playerAddr_ == address(0));
        
        games[_gameId].player2_.playerAddr_ = msg.sender;
        // games[_gameId].token_.transferFrom(msg.sender, address(this), (games[_gameId].betAmount_ * 1 ether));
        _betTransfer(_game.betAmount_, _gameId);
        _game.jackpot_ = _game.jackpot_ + _game.betAmount_;
        assert(_game.jackpot_ == _game.betAmount_ * 2);
        emit Player2Joined(_gameId, _game.player1_.playerAddr_, msg.sender, _game.tokenSymbol_, _game.jackpot_);
        
    }
    
    function cancelGame(uint _gameId) public {

        Game storage _game = games[_gameId];
        uint elapsedTime = block.timestamp - _game.time_;
        require(_game.player2_.move_  == 0, "player 2 moved already");
        require(_game.player1_.playerAddr_ == msg.sender, "you cant cancel this game");
        require(elapsedTime / 60 >= 1, "not enough time has passed");
        
        _game.token_.transfer(msg.sender, (games[_gameId].betAmount_ * 1 ether));
        _game.token_.transfer(_game.player2_.playerAddr_, (_game.betAmount_ * 1 ether));
        delete games[_gameId];
        // call this if player2 hasnt made move in x amount of time
        
        
    }
    
    function makeMove(uint _move, uint _gameId) public {
        Game storage _game = games[_gameId];
        // 1 = ROCK      2 = PAPER      3 = SCISSORS
        require(_game.player1_.playerAddr_ != address(0), " both player hasnt joined yet");
        require(_game.player2_.playerAddr_ != address(0), "both players havent joined yet");
        require(_move > 0 && _move <= 3, "only choose between 1, 2, or 3.");
        if(msg.sender == _game.player1_.playerAddr_){
            _game.player1_.move_ = _move;
            _game.player1_.moved_ = true;
            emit MoveMade(msg.sender, _gameId, 
                _game.player1_.moved_, 
                _game.player2_.moved_ 
                );
        }
        else {
            _game.player2_.move_ = _move;
            _game.player2_.moved_ = true;
            emit MoveMade(msg.sender, _gameId, 
                _game.player2_.moved_, 
                _game.player1_.moved_
                );
        }


        
        
    }
    function reveal(uint _gameId) public {
        // 1 = ROCK      2 = PAPER      3 = SCISSORS
        Game storage _game = games[_gameId];
        require(_game.finished_ == false);
        uint player1move = _game.player1_.move_;
        uint player2move = _game.player2_.move_;
        address player1Addr = _game.player1_.playerAddr_;
        address player2Addr = _game.player2_.playerAddr_;
        IERC20Metadata _token = _game.token_;
        uint _jackpot = _game.jackpot_;
        
        
        require(player1move > 0 || player2move > 0, "both players havent moved yet");
        if(player1move == 1 && player2move == 2) {
            emit Winner(_game.player2_.playerAddr_, _gameId, _game.tokenSymbol_, _game.jackpot_);
            winningBalances[_token][player2Addr] = winningBalances[_token][player2Addr] + _jackpot;
        }
        else if(player1move == 2 && player2move == 3) {
            emit Winner(_game.player2_.playerAddr_, _gameId, _game.tokenSymbol_, _game.jackpot_);
             winningBalances[_token][player2Addr] = winningBalances[_token][player2Addr] + _jackpot;
        }
        else if(player1move == 3 && player2move == 1) {
            emit Winner(_game.player2_.playerAddr_, _gameId, _game.tokenSymbol_, _game.jackpot_);
             winningBalances[_token][player2Addr] = winningBalances[_token][player2Addr] + _jackpot;
        }
        else if(player1move == 1 && player2move == 3) {
            emit Winner(_game.player1_.playerAddr_, _gameId, _game.tokenSymbol_, _game.jackpot_);
             winningBalances[_token][player1Addr] = winningBalances[_token][player1Addr] + _jackpot;
        }
        else if(player1move == 3 && player2move == 2) {
            emit Winner(_game.player1_.playerAddr_, _gameId, _game.tokenSymbol_, _game.jackpot_);
            winningBalances[_token][player1Addr] = winningBalances[_token][player1Addr] + _jackpot;
        }
        else if(player1move == 2 && player2move == 1) {
            emit Winner(_game.player1_.playerAddr_, _gameId, _game.tokenSymbol_, _game.jackpot_);
            winningBalances[_token][player1Addr] = winningBalances[_token][player1Addr] + _jackpot;
        }
        else {
            revert("its a tie, go again");
        }
        
        _game.finished_ = true;
        
    }
    function TransferOut(address _token) public {
        uint _amount = winningBalances[IERC20Metadata(_token)][msg.sender];
        winningBalances[IERC20Metadata(_token)][msg.sender] = 0;
        IERC20Metadata(_token).transfer(msg.sender, _amount * 1 ether);
        
        
    }

    function mintAndredeem(address _token) public {
        IERC20Metadata acceptedToken = IERC20Metadata(_token);
        require(winningBalances[acceptedToken][msg.sender] >= 1000);

        winningBalances[acceptedToken][msg.sender] -= 1000;
                                                        // try undoing the other IERC20Metadata from the balances mapping
        mintNFT();
        acceptedToken.transfer(_token, 1000 * 1 ether);

    }


}