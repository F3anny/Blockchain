//SPDX-License-Identifier:MIT
pragma solidity 0.8.17;
contract MyToken {

mapping(address => uint256) private balances;
uint256 public totalSupply;
address private owner;
    constructor (uint256 initialSupply){
         owner=msg.sender;
         mint(msg.sender, initialSupply);
       
       
    }
    function mint(address recipient,uint256 amount)public{
        require(msg.sender == owner, "Only the owner can perform this action");
            balances[recipient] += amount;
                totalSupply += amount;

    }
      function balanceOf(address account) public view returns (uint256) {
            return balances[account];
      }
      function transfer(address recipient,uint256 amount)public returns(bool){
            require(amount <= balances[msg.sender], "Not enough balance.");
            balances[msg.sender] -= amount;
            balances[recipient] += amount;
            return true;


      }
    
    
}