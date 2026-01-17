//SPDX-License-Identifier:MIT
pragma solidity ^0.8.17;
contract Multisend{
    function sendEther(address[] memory recipients) public payable{
        uint256 TotalRecipients=recipients.length;
        require(TotalRecipients>0,"No recipients provided");
        require(msg.value>0,"No Ether sent");
        uint256 amountPerRecipient=msg.value/TotalRecipients;
        require(amountPerRecipient>0,"Ether amount is too small");
        for(uint256 i=0;i<TotalRecipients;i++){
            (bool success,)=recipients[i].call{value:amountPerRecipient}("");
            require(success,"Transfer Failed");

        }
        uint256 remaining=msg.value-(amountPerRecipient*TotalRecipients);
        if(remaining>0){
            (bool refunded,)=msg.sender.call{value:remaining}("");
            require(refunded,"Refund failed");
        }

        

    }
}