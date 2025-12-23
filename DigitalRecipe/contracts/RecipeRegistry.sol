// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RecipeRegistry {
    struct RecipeRecord {
        uint256 localIndex;
        string title;
        string creator;
        bytes32 dataHash;
        string metadataURI;
        uint256 timestamp;
        address submitter;
    }

    event RecipeAnchored(
        bytes32 indexed dataHash,
        uint256 indexed localIndex,
        string title,
        string creator,
        address indexed submitter
    );

    mapping(bytes32 => RecipeRecord) private records;
    uint256 public totalAnchored;

    function anchorRecipe(
        uint256 localIndex,
        string calldata title,
        string calldata creator,
        bytes32 dataHash,
        string calldata metadataURI
    ) external returns (RecipeRecord memory) {
        require(records[dataHash].timestamp == 0, "Recipe already anchored");

        RecipeRecord memory record = RecipeRecord({
            localIndex: localIndex,
            title: title,
            creator: creator,
            dataHash: dataHash,
            metadataURI: metadataURI,
            timestamp: block.timestamp,
            submitter: msg.sender
        });

        records[dataHash] = record;
        totalAnchored += 1;

        emit RecipeAnchored(dataHash, localIndex, title, creator, msg.sender);
        return record;
    }

    function getRecipe(bytes32 dataHash) external view returns (RecipeRecord memory) {
        RecipeRecord memory record = records[dataHash];
        require(record.timestamp != 0, "Recipe not found");
        return record;
    }
}






