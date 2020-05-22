pragma solidity 0.5.2;

import "./CoinflipStorage.sol";
import "./CoinflipBase.sol";
//import"./provableAPI.sol";
//import "./SafeMath.sol";

contract CoinflipMainV2 is CoinflipBase {

  //using SafeMath for *;

  //----------------Variables


  //----------------Event
  event evtBetOpened(address _user, string _msg, uint256 _id, uint256 _amount);
  event evtBetQuery(address _user, string _msg);
  event evtBetResume(address _user, string  _msg, uint256 _randomResult);
  event evtBetResult(address _user, bool _isWon);
  event evtBetClosed(address _user, string _status, uint256 _id, uint256 _amount, uint256 _jackpot, bool _isWon);
  //for tests
  //event evtTrackingBetStep(string _step, string _msg, address _user, uint256 _amount, uint256 _id);
  event evtTesting(string message, uint256 value);
  //----------------Constructor
  constructor() public {
    //VERIFIER gestion de recherche de preuve on chain de provenance
    //provable_setProof(proofType_Ledger);
  }

  //----------------Getters :
  function getUserPendingBetState(address _user) public view returns(bool){
      return _Accounts[_user]._hasBetOpen;
  }

  //----------------Functions : main logic

  //Main function => initialize a bet / no result => waiting for oracle
  function flip() public payable isValidBet(msg.value, msg.sender) whenNotPaused {

    //check if user is known
    addAccount();
    //INITIALIZATION of a new flip
    initializeNewBet(msg.value, msg.sender);

    // flip V1
    //RUNNING the flip
    // uint256 resultOfFlip = runPseudoRandom();
    // //INTERPRET the result
    // setNewBetState(resultOfFlip, msg.sender);
    // //CLOSE the bet
    // closeNewBet(msg.sender);

    //flip V2
    //RUNNING the flip
    runPseudoRandom();
  }

  //MEMO change flipResume to resumeFlip cause in abi : it give the signature of resume to flip() (2 inputs params)
  //__callback function called by oracle / resume the process
  function resumeFlip(uint256 _result, address _user) private {
    // //INTERPRET the result
    setNewBetState(_result, _user);
    // //CLOSE the bet
    closeNewBet(_user);
  }

  //----------------Functions : logic helpers

  //create and initialize a new bet
  function initializeNewBet(uint256 _amount, address  _user) private {
    Bet memory newBet;
    newBet._amountBet = _amount;
    newBet._jackpotFactor = 0; //(par defaut 0 et false)
    newBet._isWin = false;
    newBet._isClosed = false;
    newBet._isClaimed = false;

    uint256 lastBetId = _listOfBets.push(newBet) - 1; // = _listOfBets.length - 1
    _uintStorage['lastBetId'] = lastBetId; //for tests
    //require(_listOfBets.length > 0, "long bet <=0");
    //lastBetId = _listOfBets.length - 1;
    _Accounts[_user]._accountBets.push(lastBetId);
    //mark the user as waiting for a result
    _Accounts[_user]._hasBetOpen = true;

    emit evtTesting("bet initialisé, index : ", lastBetId);
    assert(
        keccak256(abi.encodePacked(
                _listOfBets[lastBetId]._amountBet,
                _listOfBets[lastBetId]._jackpotFactor,
                _listOfBets[lastBetId]._isWin,
                _listOfBets[lastBetId]._isClosed,
                _listOfBets[lastBetId]._isClaimed
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
    emit evtBetOpened(_user, "New bet taken : initialization...", lastBetId, _amount);
  }

   //return the result : a random number : 0 or 1
   //V2 : emulation of oracle process and call to __callback function
   //usage for development with local node to speed up the operation without
   //the need to wait for the answer from the oracle on the network
   function runPseudoRandom() private {
       //fake ticket id as queryId, result and proof
      uint256 ident = (_Accounts[msg.sender]._accountBets.length * 10000) + (now % 10000);
      bytes32 queryId = bytes32(keccak256(abi.encodePacked(ident)));

      uint256 temp = ident % 2;
      string memory result = (temp == 0) ? "0" : "1";

      //bytes memory proof = "testproof"; //bytes(keccak256(abi.encodePacked(ident)));

      _Queries[queryId] = msg.sender;      //associate user adr and query id

      emit evtTesting(result, temp);

      emit evtBetQuery(msg.sender, "Provable query was sent, standing by for answer...");

      __callback(queryId, result/*, proof*/);
   }

  //oracle callback function
  function __callback(bytes32 _queryId, string memory _result/*, bytes memory _proof*/) private {
      //require(msg.sender == provable_cbAddress());

      address user =  _Queries[_queryId];

      // if (provable_randomDS_proofVerify__returnCode(_queryId, _result, _proof) != 0) {
      //     //error when processing the oracle
      //     flipAbort(user);
      // }
      // else {
          //success => data conversion to uint256
          uint256 randomNumber = uint256(keccak256(abi.encodePacked(_result)));
          //test parity (rule of the game)
          uint256 result = randomNumber % 2;

          emit evtTesting("bet callback, number : ",randomNumber);

          emit evtBetResume(user, "Result received, evaluation of the bet...", randomNumber);
          resumeFlip(result, user);
      // }
  }

  //helper : get the last bet of user (if a bet is open it should be only this one)
  function getIndexOfLastUserBet(address _user) private view returns(uint256) {
    require(_Accounts[_user]._accountBets.length > 0, "no bet or size of _accountBets not consistent");
    require(_listOfBets.length > 0, "no bet or size of _listOfBets not consistent");

    uint256 lastUserBet = _Accounts[_user]._accountBets.length - 1;
    uint256 betId = _Accounts[_user]._accountBets[lastUserBet];

    assert(_listOfBets.length > betId);
    return betId;
  }

  //evaluation and setting to won = 1 / lost = 0
  function setNewBetState(uint256 _result, address  _user) private {
    uint256 betId = getIndexOfLastUserBet(_user);
    _listOfBets[betId]._jackpotFactor = _uintStorage['jackpotFactor'];

    if(_result == 1) {
      _listOfBets[betId]._isWin = true;
      emit evtBetResult(_user, true);
    }
    else {
      emit evtBetResult(_user, false);
    }
    emit evtTesting("bet setstates, resilt : ",_result);
  }


  //close the bet and store the values
  function closeNewBet(address _user) private {
    uint256 betId = getIndexOfLastUserBet(_user);

    uint256 jackpot = _listOfBets[betId]._jackpotFactor * _listOfBets[betId]._amountBet;

    _Accounts[_user]._uintAccount['totalLost'] += _listOfBets[betId]._amountBet;

    if(_listOfBets[betId]._isWin) {
      _uintStorage['totalRewardToClaim'] += jackpot;
      _Accounts[_user]._uintAccount['totalWon'] += jackpot;
      _Accounts[_user]._uintAccount['rewardToClaim'] += jackpot;

      if (_Accounts[_user]._firstBetToClaimId == 0) {
        _Accounts[_user]._firstBetToClaimId = _Accounts[_user]._accountBets.length;   //not -1, 0 is flag
      }
    }
    else {
      _listOfBets[betId]._isClaimed = true;
    }

    _Accounts[_user]._hasBetOpen = false;
    _listOfBets[betId]._isClosed = true;

    emit evtBetClosed(_user, "Bet completed and closed", betId, _listOfBets[betId]._amountBet, jackpot, _listOfBets[betId]._isWin);
  }


  function flipAbort(address _user) private {
    uint256 betId = getIndexOfLastUserBet(_user);
    //for stat and later check as not initialized
    //_listOfBets[betId]._jackpotFactor => 0
    //_listOfBets[betId]._isWin =>false
    uint256 amountToRefund = _listOfBets[betId]._amountBet;


    _listOfBets[betId]._isClaimed = true;
    _Accounts[_user]._hasBetOpen = false;
    _listOfBets[betId]._isClosed = true;

    withdraw(amountToRefund, _user);
    emit evtBetClosed(_user, "Aborted, refund in progress...", betId, amountToRefund, 0, false);
  //  return amount;
  }







  //----------------Functions : test process

//   function getLastBet() public view returns(uint256 amount, uint factor, bool win, bool closed, bool claimed) {
//     return (_listOfBets[_uintStorage['lastBetId']]._amountBet,
//     _listOfBets[_uintStorage['lastBetId']]._jackpotFactor,
//     _listOfBets[_uintStorage['lastBetId']]._isWin,
//     _listOfBets[_uintStorage['lastBetId']]._isClosed,
//     _listOfBets[_uintStorage['lastBetId']]._isClaimed);
//   }
//
//
//   function getLastBetOfUser(address user) public view returns(uint bet, uint factor,bool won,bool closed,bool claimed) {
//       Account memory userAcnt = _Accounts[user];
//       uint256[] memory userBetsIndex = userAcnt._accountBets;
//       Bet memory userBet = _listOfBets[userBetsIndex[userBetsIndex.length -1]];
//       //Bet memory userBet = _listOfBets[_Accounts[user]._accountBets[_Accounts[user]._accountBets.length -1]];
//       uint256 amountBet = userBet._amountBet;         //amount of the bet
//       uint256 jackpotFactor = userBet._jackpotFactor;     //jackpot = amount*factor
//       bool isWin = userBet._isWin;                //bet won
//       bool isClosed = userBet._isClosed;             //bet closed
//       bool isClaimed = userBet._isClaimed;
//       return (amountBet, jackpotFactor, isWin, isClosed,isClaimed);
//   }
//
//   function getAccountOfUser(address user) public view returns(bool known, string memory userName, uint firstClaimIndex, uint nBets, uint rewToClaim, uint totLost) {
//     Account memory userAccount = _Accounts[user];
//   //  mapping (string => uint256) uintAccount = userAccount._uintAccount;
//     bool isKnown = userAccount._isKnown;
//     string memory name = userAccount._name;
//     uint256 firstBetToClaimId = userAccount._firstBetToClaimId;
//     uint256 nbrOfBets = userAccount._accountBets.length;
//     uint256 rewardToClaim = _Accounts[user]._uintAccount['rewardToClaim'];
//     uint256 totalLost = _Accounts[user]._uintAccount['totalLost'];
//     return (isKnown, name, firstBetToClaimId, nbrOfBets, rewardToClaim, totalLost);
//   }
//
//   function getContractStates() public view returns(uint256 nBets, uint256 nAccounts, uint256 bal, uint256 totReward) {
//     uint256 nbrOfBets = _listOfBets.length;
//     uint256 nbrOfAccounts = _listOfAccounts.length;
//     uint256 balance = getContractBalance();
//     uint256 getTotRewardToClaim = getTotalRewardToClaim();
//     return (nbrOfBets, nbrOfAccounts,balance,getTotRewardToClaim);
//   }
//
//   function getClaimSateOfBet(uint256 _index) public view returns(bool) {
//     require(_index < _listOfBets.length, "index out of range");
//
//     return _listOfBets[_index]._isClaimed;
//   }
}
