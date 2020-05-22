pragma solidity 0.5.2;

import "./CoinflipBase.sol";

//only to test upgradeability
contract CoinflipMainV0 is CoinflipBase {

  function sayHelloAndGiveBets() public view returns(string memory word, uint nbet){
      uint256 nBets = _listOfBets.length;
      return ("hello", nBets);
  }
}
