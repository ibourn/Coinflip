pragma solidity 0.5.2;

//Modifier
//check if a function is active when the contract is paused
contract Pausable {

    //storage of the state "paused"
    bool internal _paused;

    modifier whenNotPaused() {
        require(!_paused);
        _; //Continue execution
    }

    modifier whenPaused() {
        require(_paused);
        _; //Continue execution
    }
}
