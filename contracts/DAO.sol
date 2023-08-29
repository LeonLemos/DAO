//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "./Token.sol";

contract DAO {
    address owner;
    Token public token;
    uint256 public quorum;
    uint256 public proposalCount;

    mapping(uint256 => Proposal)public proposals;

    event Propose(uint id, uint256 amount, address recipient, address creator);

    event Vote(uint256 id, address investor);

    event Finalize(uint256 id);
    
    constructor(Token _token, uint256 _quorum){
        owner = msg.sender;
        token = _token;
        quorum = _quorum;
    }

    receive() external payable{} //Allow contract to receive ether

    struct Proposal{
        uint256 id;
        string name;
        uint256 amount;
        address payable recipient;
        uint256 votes;
        bool finalized;
    }

    modifier onlyInvestor() {
        require (token.balanceOf(msg.sender)>0 ,'Must be token holder');
        _;   
    }
    //Proposal to Fund Development
    function createProposal( string memory _name, uint256 _amount, address payable _recipient ) external onlyInvestor {

        require (address(this).balance >= _amount);

        proposalCount++;

        //Create Proposal
        proposals[proposalCount]= Proposal(proposalCount, _name, _amount, _recipient, 0, false);

        //Emit Event
        emit Propose( proposalCount, _amount, _recipient, msg.sender);

    }

    mapping(address => mapping(uint256 => bool))votes; //Nested Mapping to track user votes

    function vote(uint256 _id) external onlyInvestor{
        //Fetch Proposal from mapping by ID
        Proposal storage proposal = proposals[_id];

        //Dont let investor vote twice
        require(!votes[msg.sender][_id], "Already voted");

        //Update Votes
        proposal.votes += token.balanceOf(msg.sender);

        //Track that User has voted
        votes[msg.sender][_id] = true;

        //Emit An event 
        emit Vote(_id, msg.sender);
    }

    function finalizeProposal(uint256 _id)external onlyInvestor{
        // Fetch proposal from mapping by id
        Proposal storage proposal = proposals[_id];

        // Ensure proposal is not already finalized
        require(proposal.finalized == false, "proposal already finalized");

        // Mark proposal as finalized
        proposal.finalized = true;

        // Check that proposal has enough votes
        require(proposal.votes >= quorum, "must reach quorum to finalize proposal");

        // Check that the contract has enough ether
        require(address(this).balance >= proposal.amount);

        //Tranfer funds to recipient
        //* proposal.recipient.transfer(proposal.amount); *//Option1 less secure

        (bool sent, ) = proposal.recipient.call{value: proposal.amount}(""); //Option2 more secure
        require(sent);

        // Emit event
        emit Finalize(_id);
    }
}
