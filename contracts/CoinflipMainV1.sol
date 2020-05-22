pragma solidity 0.5.2;

import "./CoinflipStorage.sol";
import "./CoinflipBase.sol";
//import "./SafeMath.sol";

contract CoinflipMainV1 is CoinflipBase {

  //using SafeMath for *;

  //----------------Variables

  //----------------Event
  event evtBetResult(address _user, bool _isWon);

  //----------------Constructor


  //----------------Functions : main logic

  //Main function => initialize a bet and proceed
  function flip() public payable isValidBet(msg.value, msg.sender) whenNotPaused {

    //check if user is known
    addAccount();
    //INITIALIZATION of a new flip
    initializeNewBet(msg.value, msg.sender);
    //RUNNING the flip
    uint256 resultOfFlip = runPseudoRandom();
    //INTERPRET the result
    setNewBetState(resultOfFlip, msg.sender);
    //CLOSE the bet
    closeNewBet(msg.sender);
  }

  //return the result : a random number : 0 or 1
  //V1 : pseudorandmess
  function runPseudoRandom() public view returns(uint256) {
      uint256 time = now;
      uint256 result = time % 2;

      assert(result == 0 || result == 1);
      return result;
  }

  //create and initialize a new bet
  function initializeNewBet(uint256 _amount, address  _user) public {
    Bet memory newBet;
    newBet._amountBet = _amount;
    newBet._jackpotFactor = 0; //par defaut 0 et false
    newBet._isWin = false;
    newBet._isClosed = false;
    newBet._isClaimed = false;

    _uintStorage['lastBetId'] = _listOfBets.push(newBet) - 1; // = _listOfBets.length - 1
    //require(_listOfBets.length > 0, "long bet <=0");
    //_uintStorage['_uintStorage['lastBetId']'] = _listOfBets.length - 1;
    _Accounts[_user]._accountBets.push(_uintStorage['lastBetId']);

    assert(
        keccak256(abi.encodePacked(
                _listOfBets[_uintStorage['lastBetId']]._amountBet,
                _listOfBets[_uintStorage['lastBetId']]._jackpotFactor,
                _listOfBets[_uintStorage['lastBetId']]._isWin,
                _listOfBets[_uintStorage['lastBetId']]._isClosed,
                _listOfBets[_uintStorage['lastBetId']]._isClaimed
        ))
        ==
        keccak256(abi.encodePacked(
                newBet._amountBet,
                newBet._jackpotFactor,
                newBet._isWin,
                newBet._isClosed,
                newBet._isClaimed
        ))
    );
  }

  //evaluation and setting to won = 1 / lost = 0
  function setNewBetState(uint256 _result, address  _user) public {
    require(_listOfBets.length > _uintStorage['lastBetId'], "index of bet out of range");

    _listOfBets[_uintStorage['lastBetId']]._jackpotFactor = _uintStorage['jackpotFactor'];

    if(_result == 1) {
      _listOfBets[_uintStorage['lastBetId']]._isWin = true;
      emit evtBetResult(_user, true);

    }
    else {

      emit evtBetResult(_user, false);
    }
  }


  //close the bet and store the values
  function closeNewBet(address _user) public {
    require(_listOfBets.length > _uintStorage['lastBetId'], "index of bet out of range");

    uint256 jackpot = _listOfBets[_uintStorage['lastBetId']]._jackpotFactor * _listOfBets[_uintStorage['lastBetId']]._amountBet;

    _Accounts[_user]._uintAccount['totalLost'] += _listOfBets[_uintStorage['lastBetId']]._amountBet;

    if(_listOfBets[_uintStorage['lastBetId']]._isWin) {
      _uintStorage['totalRewardToClaim'] += jackpot;
      _Accounts[_user]._uintAccount['totalWon'] += jackpot;
      _Accounts[_user]._uintAccount['rewardToClaim'] += jackpot;

      if (_Accounts[_user]._firstBetToClaimId == 0) {
        _Accounts[_user]._firstBetToClaimId = _Accounts[_user]._accountBets.length;  //not -1, 0 is flag
      }
    }
    else {
      _listOfBets[_uintStorage['lastBetId']]._isClaimed = true;
    }

    _listOfBets[_uintStorage['lastBetId']]._isClosed = true;
  }





  //----------------Functions : test process
  //
  // function getLastBet() public view returns(uint256 amount, uint factor, bool win, bool closed, bool claimed) {
  //   return (_listOfBets[_uintStorage['lastBetId']]._amountBet,
  //   _listOfBets[_uintStorage['lastBetId']]._jackpotFactor,
  //   _listOfBets[_uintStorage['lastBetId']]._isWin,
  //   _listOfBets[_uintStorage['lastBetId']]._isClosed,
  //   _listOfBets[_uintStorage['lastBetId']]._isClaimed);
  // }
  //
  //
  // function getLastBetOfUser(address user) public view returns(uint bet, uint factor,bool won,bool closed,bool claimed) {
  //     Account memory userAcnt = _Accounts[user];
  //     uint256[] memory userBetsIndex = userAcnt._accountBets;
  //     Bet memory userBet = _listOfBets[userBetsIndex[userBetsIndex.length -1]];
  //     //Bet memory userBet = _listOfBets[_Accounts[user]._accountBets[_Accounts[user]._accountBets.length -1]];
  //     uint256 amountBet = userBet._amountBet;         //amount of the bet
  //     uint256 jackpotFactor = userBet._jackpotFactor;     //jackpot = amount*factor
  //     bool isWin = userBet._isWin;                //bet won
  //     bool isClosed = userBet._isClosed;             //bet closed
  //     bool isClaimed = userBet._isClaimed;
  //     return (amountBet, jackpotFactor, isWin, isClosed,isClaimed);
  // }
  //
  // function getAccountOfUser(address user) public view returns(bool known, string memory userName, uint firstClaimIndex, uint nBets, uint rewToClaim, uint totLost) {
  //   Account memory userAccount = _Accounts[user];
  // //  mapping (string => uint256) uintAccount = userAccount._uintAccount;
  //   bool isKnown = userAccount._isKnown;
  //   string memory name = userAccount._name;
  //   uint256 firstBetToClaimId = userAccount._firstBetToClaimId;
  //   uint256 nbrOfBets = userAccount._accountBets.length;
  //   uint256 rewardToClaim = _Accounts[user]._uintAccount['rewardToClaim'];
  //   uint256 totalLost = _Accounts[user]._uintAccount['totalLost'];
  //   return (isKnown, name, firstBetToClaimId, nbrOfBets, rewardToClaim, totalLost);
  // }
  //
  // function getContractStates() public view returns(uint256 nBets, uint256 nAccounts, uint256 bal, uint256 totReward) {
  //   uint256 nbrOfBets = _listOfBets.length;
  //   uint256 nbrOfAccounts = _listOfAccounts.length;
  //   uint256 balance = getContractBalance();
  //   uint256 getTotRewardToClaim = getTotalRewardToClaim();
  //   return (nbrOfBets, nbrOfAccounts,balance,getTotRewardToClaim);
  // }
  //
  // function getClaimSateOfBet(uint256 _index) public view returns(bool) {
  //   require(_index < _listOfBets.length, "index out of range");
  //
  //   return _listOfBets[_index]._isClaimed;
  // }
}
