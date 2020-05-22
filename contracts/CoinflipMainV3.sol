/*
MEMO : not deployable see CoinflipDapp => version with oracle /l126-129 are in cause



pragma solidity 0.5.2;

//import "./CoinflipStorage.sol";
import "./CoinflipBase.sol";
import "./provableAPI.sol";

//import "./SafeMath.sol";

contract CoinflipMainV3 is CoinflipBase, usingProvable {

  //using SafeMath for *;

  //----------------Variables

  //----------------Event
  event evtBetOpened(address _user, string _msg, uint256 _id, uint256 _amount);
  event evtBetQuery(address _user, string _msg);
  event evtBetResume(address _user, string  _msg, uint256 _randomResult);
  event evtBetResult(address _user, bool _isWon);
  event evtBetClosed(address _user, string _status, uint256 _id);//, uint256 _amount, uint256 _jackpot, bool _isWon);
  //for tests
  //event evtTrackingBetStep(string _step, string _msg, address _user, uint256 _amount, uint256 _id);
  //event evtTesting(string message, uint256 value);
  //----------------Constructor
  constructor() public {
    provable_setProof(proofType_Ledger);
    //(byte constant proofType_NONE = 0x00;
    //byte constant proofType_Ledger = 0x30;)
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

    //emit evtTesting("bet initialisé, index : ", lastBetId);
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
  //V3 : service of oracle to get the randomn number
  function runPseudoRandom() public {
    //params used for oracle functions
    uint256 NUM_RANDOM_BYTES_REQUESTED = 1; //Value of 1-32
    uint256 QUERY_EXECUTION_DELAY = 0;      //config: execution delay (0 for no delay)
    uint256 GAS_FOR_CALLBACK = 200000;      //config: gas fee for calling __callback function (200000 is standard)

     //call to oracle and return our ticket
     bytes32 queryId = provable_newRandomDSQuery(QUERY_EXECUTION_DELAY, NUM_RANDOM_BYTES_REQUESTED, GAS_FOR_CALLBACK);     //function to query a random number, it will call the __callback function

      _Queries[queryId] = msg.sender;      //associate user adr and query id

     //emit evtTesting(result, temp);
     emit evtBetQuery(msg.sender, "Provable query was sent, standing by for answer...");
  }

  //oracle callback function
  function __callback(bytes32 _queryId, string memory _result, bytes memory _proof) public {
      require(msg.sender == provable_cbAddress());

      address user =  _Queries[_queryId];

      if (provable_randomDS_proofVerify__returnCode(_queryId, _result, _proof) != 0) {
           //error when processing the oracle
           flipAbort(user);
      }
      else {
          //success => data conversion to uint256 (data on BC are bytes)
          uint256 randomNumber = uint256(keccak256(abi.encodePacked(_result)));
          //test parity (rule of the game)
          uint256 result = randomNumber % 2;

          //emit evtTesting("bet callback, number : ",randomNumber);
          emit evtBetResume(user, "Result received, evaluation of the bet...", randomNumber);
          resumeFlip(result, user);
      }
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
    //emit evtTesting("bet setstates, resilt : ",_result);
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

    emit evtBetClosed(_user, "Bet completed and closed", betId);//, _listOfBets[betId]._amountBet, jackpot, _listOfBets[betId]._isWin);
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
    emit evtBetClosed(_user, "Aborted, refund in progress...", betId);//, amountToRefund, 0, false);
  }


}
*/
