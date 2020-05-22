pragma solidity 0.5.2;

import "./CoinflipOwnable.sol";
import "./CoinflipPausable.sol";
import "./CoinflipStorage.sol";

//Proxy is the persistent connection between users and the Coinflip's logic
//and persistent storage => It shouldn't be modified
contract CoinflipProxy is CoinflipStorage {

  //----------------Variables
  //address of the main contract => remove to storage
  address _currentAddressOfLogic;

  //----------------Constructor
  //set the address of the logic contract when proxy is launched
  // constructor(address _currentAddress) public onlyOwner{
  //   currentAddress = _currentAddress;
  // }
  constructor(address _currentAddress) public {
    _currentAddressOfLogic = _currentAddress;
  }


  //----------------Functions : upgrade the logic
  //upgrade the address of the main contract at deployment :
  //allows to upgrade functionnality and to fix bugs
  function upgrade(address _newAddress) public onlyOwner{
    _currentAddressOfLogic = _newAddress;
  }

  //----------------Functions : fallback function (= default function):
  //triggered when we call a function that is not there
  //context of the function called will be proxy context and its storage parent
  function() payable external{
    //REDIRECTION TO CURRENTADDRESS
    address implementation = _currentAddressOfLogic;
    require(_currentAddressOfLogic != address(0));
    bytes memory data = msg.data;

    //ASSEMBLEUR : this code give a pointer to the contract function
    //if operation failed (result = 0) => revert
    assembly {
      let result := delegatecall(gas, implementation, add(data, 0x20), mload(data),0,0)
      //taille du dernier return data
      let size := returndatasize
      //alloue le tableau de bytes de sortie
      let ptr := mload(0x40)
      returndatacopy(ptr, 0, size)
      switch result
      case 0 {revert(ptr, size)}
      default {return(ptr, size)}
    }
  }
}
