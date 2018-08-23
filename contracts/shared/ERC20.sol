pragma solidity ^0.4.18;

/**
*   Crowdsale contracts edited from original contract code at https://www.ethereum.org/crowdsale#crowdfund-your-idea
*   Additional crowdsale contracts, functions, libraries from OpenZeppelin
*       at https://github.com/OpenZeppelin/zeppelin-solidity/tree/master/contracts/token
*   Token contract edited from original contract code at https://www.ethereum.org/token
*   ERC20 interface and certain token functions adapted from https://github.com/ConsenSys/Tokens
**/
// NOTE: This contract was changed only for testing purposes!
contract ERC20 {

    event Approval(address indexed _owner, address indexed _spender, uint _value);
    event Transfer(address indexed _from, address indexed _to, uint _value);
    function allowance(address _owner, address _spender) public constant returns (uint remaining);
    function approve(address _spender, uint _value) public returns (bool success);
    function balanceOf(address _owner) public constant returns (uint balance);
    function transfer(address _to, uint _value) public returns (bool success);
    function transferFrom(address _from, address _to, uint _value) public returns (bool success);
}
