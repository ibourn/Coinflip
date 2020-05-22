pragma solidity 0.5.2;

import "./CoinflipStorage.sol";

//MEMO
//events permettent aussi de debuger les instructions dans fonctions en development

//basic functions of the contract, child of storage to know the variable and allow access
contract CoinflipBase is CoinflipStorage {

  //----------------Modifiers
  //check if minimumBet <= bet <= maximumBet & available balance (balance - rewards to claim)
  //check if no bet is already open for user
  modifier isValidBet(uint256 _amount, address _user) {
      uint256 maxJackpot = (getContractBalance() - _uintStorage['totalRewardToClaim']) / 2;//address(this).balance / 2;
      require(_amount <= _uintStorage['maximumBet'], "bet > maximum");
      require(_amount >= _uintStorage['minimumBet'], "bet < minimum");
      require(_amount <= maxJackpot, "balance needs more funds, too much rewards to claim");
      require(_Accounts[_user]._hasBetOpen == false, "user has already a bet open... waiting for a result from oracle");
      _;
  }

  //----------------Event
//  event funded(address user, uint amount);
  event evtNameSet(address _user, string _name);
  //eventname(_n);//, msg.sender);
  event evtNewAccount(address _user, uint256 _nbrOfAccounts);
  //value of param : minimumBet, maximumBet, jackpotFator
  event evtSettingsUpdated(string _param, uint256 _value);
  event evtPauseSet(string _param, bool _value);
  //value of type : deposit, emergencyWithdrawAll, emergencyClaimAllRewards,
  //claimRewards, withdrawReward, withdraw
  //To do : add a param fo the new value (=>to manage it in the dapp)
  event evtFundingOperation(string _type, address _origin, uint256 _value);



  //----------------Constructor
  constructor() public{
    initialize(msg.sender);
    //using proxy, the initialization is done at deployment
  }

  //----------------Init
  //initiliaze all the variables at first call and check if already initialized
  //MEMO : laisser public car scope de storage est proxy => solutions pour initialiser :
  //appeler dans constructeur de proxy OU initialiser au déploiement dans migration
  function initialize(address _firstOne) public{
    //require(!_boolStorage['initialized'], "from V2 : contract already initialized");
    if(!_boolStorage['initialized']) {
      _owner = _firstOne;
      _boolStorage["initialized"] = true;
      _paused = false;
      _uintStorage['minimumBet'] = 10**16;//10 finney;//0.01ether
      _uintStorage['maximumBet'] = 10**18;//1000 finney;//1ether
      _uintStorage['jackpotFactor'] = 3;
    }
  }



  //----------------Getters
  function getContractBalance() public view returns (uint) {
      return address(this).balance;
  }

  //return reward of all the users
  function getTotalRewardToClaim() public view returns (uint) {
      return _uintStorage['totalRewardToClaim'];
  }

  //return reward of the user
  function getTotalReward() public view returns(uint256) {
    return _Accounts[msg.sender]._uintAccount['rewardToClaim'];
  }

  function getMinimumBet() public view returns(uint256) {
    return _uintStorage['minimumBet'];
  }

  function getMaximumBet() public view returns(uint256) {
    return _uintStorage['maximumBet'];
  }

  function getJackpotFactor() public view returns(uint256) {
    return _uintStorage['jackpotFactor'];
  }

  function getName(address _user) public view returns(string memory) {
    return _Accounts[_user]._name;
  }

  function getPauseState() public view returns(bool) {
    return _paused;
  }

  //----------------Setters & Updaters
  //pause/unpause the functions
  function pause() public onlyOwner whenNotPaused{
    _paused = true;
    emit evtPauseSet("pause", _paused);
  }
  function unPause() public onlyOwner whenPaused{
    _paused = false;
    emit evtPauseSet("pause", _paused);
  }

  function setName(string memory _n) public {
    addAccount();
    _Accounts[msg.sender]._name = _n;

    emit evtNameSet(msg.sender, _n);
  }

  //add an account if user is not known
  function addAccount() internal {
    if (!_Accounts[msg.sender]._isKnown) {
      _listOfAccounts.push(msg.sender);
      _Accounts[msg.sender]._isKnown = true;
      emit evtNewAccount(msg.sender, _listOfAccounts.length);
      }
  }

  function updateMinimumBet(uint256 _newMinimum) public onlyOwner {
    require(_newMinimum < _uintStorage['maximumBet'], "minimum should be less than maximum");
    _uintStorage['minimumBet'] = _newMinimum;
    emit evtSettingsUpdated("minimumBet", _newMinimum);
  }

  function updateMaximumBet(uint256 _newMaximum) public onlyOwner {
    require(_newMaximum > _uintStorage['minimumBet'], "maximum should be more than minimum");
    _uintStorage['maximumBet'] = _newMaximum;
    emit evtSettingsUpdated("maximumBet", _newMaximum);
  }

  function updateJackpotFactor(uint256 _newFactor) public onlyOwner {
    _uintStorage['jackpotFactor'] = _newFactor;
    emit evtSettingsUpdated("jackpotFactor", _newFactor);

  }

  //----------------Functions : funding
  //Fund the Contract
  function deposit() public payable onlyOwner returns(uint){
      require(msg.value != 0);
      //ContractBalance += msg.value;
      emit evtFundingOperation("deposit",msg.sender, msg.value);
      //assert(ContractBalance == address(this).balance);
      return msg.value;
  }

  //Withdraw all to the owner
  function emergencyWithdrawAll() public onlyOwner whenPaused returns(uint){
      uint256 amount = address(this).balance;
      msg.sender.transfer(address(this).balance);
      assert(address(this).balance == 0);

      emit evtFundingOperation("emergencyWithdrawAll",msg.sender, amount);
      return address(this).balance;
  }

  //Withdraw the rewards not claimed to all the users
  //loop all the users and claim
  function emergencyClaimAllRewards() public onlyOwner whenPaused returns(uint) {
    //call to .length overflow if array is empty => in this case revert)
    require(_listOfAccounts.length > 0, "size of _listOfAccounts not consistent");
    uint256 totalOfAccounts = _listOfAccounts.length;
    uint256 rewardsClaimed;

    for(uint256 i = 0; i < totalOfAccounts; i++) {
      rewardsClaimed += claimRewards(_listOfAccounts[i]);
    }

    emit evtFundingOperation("emergencyClaimAllRewards",msg.sender, rewardsClaimed);
    return rewardsClaimed;
  }

  //MEMO
  //claim =>  pull pattern (opposite of push)
  //force the user to ask for the transaction => better security and
  //decrease the number of transactions (compare to 1 withdraw/bet)

  //claim rewards of one user =>call from front end
  function claimRewards() public whenNotPaused returns(uint) {
      address user = msg.sender;
      return claimRewards(user);
  }

  //claim rewards of one user =>call from emergencyClaimAllRewards or claimRewards
  function claimRewards(address _user) private returns(uint) {
      //gather the reward in bets from user to compare the amount in the account
      uint256 rewardsToClaim = checkRewards(_user);
      require(_Accounts[_user]._uintAccount['rewardToClaim'] == rewardsToClaim, "rewards not checked");

      emit evtFundingOperation("claimRewards", _user, rewardsToClaim);
      return withdrawReward(rewardsToClaim, _user);
  }

  //MEMO
  //respecter le pattern check/effects/interaction

  //withdraw to one user
  function withdrawReward(uint256 _amount, address _user) private returns(uint) {
      _Accounts[_user]._uintAccount['rewardToClaim'] -= _amount;
      _uintStorage['totalRewardToClaim'] -= _amount;

      emit evtFundingOperation("withdrawReward", _user, _amount);
      return withdraw(_amount, _user);
  }

  //withdraw generic
  function withdraw(uint256 _amount, address _user) internal returns(uint) {
      require(_amount <= getContractBalance(), "amount to withdraw > balance");//address(this).balance, "rewards > balance");
      //cast adr to payable in solidity 0.5 : address(uint160(addr1))
      address payable addrOfUser = address(uint160(_user));
      uint256 balanceAftreTransfer = getContractBalance() - _amount;

      addrOfUser.transfer(_amount);
      assert(getContractBalance() == balanceAftreTransfer);

      emit evtFundingOperation("withdraw", _user, _amount);
      return _amount;
  }

  //check the total of rewards unclaimed from user using the list of bets
  function checkRewards(address _user) private returns(uint256) {
    //require(_Accounts[_user]._accountBets.length > 0, "size of _accountBets not consistent");
    require(_listOfBets.length > 0, "size of _listOfBets not consistent");

    uint256 nbrOfBetsStored = _listOfBets.length - 1;
    uint256 rewardsToClaim = 0;
    uint256 totalBetsOfUser = _Accounts[_user]._accountBets.length;
    uint256 firstBetToClaimId = 0;

    if (_Accounts[_user]._firstBetToClaimId > 0) {
      firstBetToClaimId = _Accounts[_user]._firstBetToClaimId - 1;

      for(uint256 i = firstBetToClaimId; i < totalBetsOfUser; i++) {
        uint256 betToCheckId = _Accounts[_user]._accountBets[i];

        require(betToCheckId <= nbrOfBetsStored, "index of user bet out of the range of _listOfBets");
        Bet memory betToCheck = _listOfBets[betToCheckId];

        if (!betToCheck._isClaimed){
            _listOfBets[betToCheckId]._isClaimed = true;
            rewardsToClaim += betToCheck._amountBet * betToCheck._jackpotFactor;
        }
      }
      _Accounts[_user]._firstBetToClaimId = 0;

    }
    return rewardsToClaim;
  }


}
