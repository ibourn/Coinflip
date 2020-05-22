pragma solidity 0.5.2;

//Modifier
//check if the sender is the owner
contract Ownable {

    //owner address storage
    address internal _owner;

    modifier onlyOwner() {
        require(msg.sender == _owner);
        _; //Continue execution
    }

}
