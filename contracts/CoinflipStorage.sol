pragma solidity 0.5.2;

import "./CoinflipOwnable.sol";
import "./CoinflipPausable.sol";

//Storage allows persistent storage => It shouldn't be modified
//
//inheritance justification : parent of base contract to allow access, computation... of the data
//and parent of proxy cause the scope of the fallback function will be the proxy context
//=> thus the real persistent storage is inside the storage contract parent of proxy
contract CoinflipStorage is Ownable, Pausable{
  //MEMO
  // assert(1 wei == 1);
  // assert(1 szabo == 1e12);
  // assert(1 finney == 1e15);
  // assert(1 ether == 1e18); //or 10**18
  //MEMO : ganache n'affiche pas les maps dans storage car ce sont des hash et non des index
  //donc impossible à retrouver ou itérer pour lecture
  //MEMO mapping string=>x en PUBLIC pas possible car string est dynamic array donc taille non fixe

  //Bet structure
  struct Bet {
      uint256 _amountBet;                      //amount of the bet
      uint256 _jackpotFactor;                  //jackpot = amount*factor
      bool _isWin;                             //bet won
      bool _isClosed;                          //bet closed
      bool _isClaimed;                         //reward claimed
  }

  //Account structure
  struct Account {
      bool _hasBetOpen;                         //a bet is in progress =>waiting for a result
      bool _isKnown;                            //account already logged
      string _name;                             //name (optional)
      //usage of _firstBetToClaimId : index in _accountBets
      //0 : no bet to claim
      //index = _firstBetToClaimId-1
      uint256 _firstBetToClaimId;               //index in _accountBets
      uint256[] _accountBets;                   //bet index listed in _listOfBets
      //usage of _uintAccount:
      // _uintAccount['rewardToClaim']
      // _uintAccount['totalLost']
      mapping (string => uint256) _uintAccount; //storage of uint variable
      //for future usage
      mapping (string => int256) _intAccount;   //storage of int variable
  }
  //----------------Variables
  //address of the main contract => remove to storage to allow upgrade from dapp
  //address internal _currentAddressOfLogic;

  //arrays and mappings
  Bet[] internal _listOfBets;                    //list of all bets
  address[] internal _listOfAccounts;                   //list of all user addresses
  mapping (address => Account) internal _Accounts;      //mapping address/account
  mapping (bytes32 => address) internal _Queries;       // QueriId / address of user

  //Generic mappings to allow upgradeable state variables
  //usage of _uintStorage
  //  _uintStorage['totalRewardToClaim']
  //  _uintStorage['maximumBet']
  //  _uintStorage['minimumBet']
  //  _uintStorage['jackpotFactor']
  //  _uintStorage['lastBetId']               //last bet taken (the only one open in V1)
  mapping (string => uint256) _uintStorage;
  //usage of _boolStrorage
  //  _boolStrorage['initialized']
  mapping (string => bool) _boolStorage;
  //not yet used
  mapping (string => address) internal _addressStorage;


}
