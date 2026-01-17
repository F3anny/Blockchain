// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
contract SiStorage{
 int256 public variable;
    function increment() public {
        variable+=1;
    }
    function decrement()public{
        variable-=1;
    }
}