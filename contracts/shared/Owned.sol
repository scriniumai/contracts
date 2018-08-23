pragma solidity ^0.4.23;

contract Owned {

    address public owner;
    address public potentialOwner;

    event OwnershipTransfer(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyOwnerOrThis() {
        require(
            msg.sender == owner ||
            msg.sender == address(this)
        );
        _;
    }

    modifier onlyPotentialOwner() {
        require(msg.sender == potentialOwner);
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        emit OwnershipTransfer(owner, newOwner);
        potentialOwner = newOwner;
    }

    function confirmOwnership() public onlyPotentialOwner {
        emit OwnershipTransferred(owner, potentialOwner);
        owner = potentialOwner;
        potentialOwner = address(0);
    }
}
