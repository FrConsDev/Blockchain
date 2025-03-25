// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.28;
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract Voting is Ownable {
    constructor() Ownable(msg.sender) {}

    struct Voter {
        address voterAddress;
        bool isRegistered;
        bool hasVoted;
        string votedProposal;
    }

    struct Proposal {
        uint256 proposalId;
        string description;
        uint256 voteCount;
        address proposer;
    }

    event VoterRegistered(address voterAddress);

    event WorkflowStatusChange(
        WorkflowStatus previousStatus,
        WorkflowStatus newStatus
    );
    event ProposalRegistered(uint256 proposalId);
    event Voted(address voter, uint256 proposalId);

    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    Voter[] public voters;
    mapping(address => uint256) private voterIndex;

    modifier voterAlreadyExists(address voterAddress) {
        require(voterIndex[voterAddress] == 0, "Voter already exists");
        _;
    }

    function addVoter(address newAdress)
        external
        onlyOwner
        voterAlreadyExists(newAdress)
    {
        voters.push(Voter(newAdress, true, false, ""));
        voterIndex[newAdress] = voters.length;
        emit VoterRegistered(msg.sender);
    }

    uint256 lastProposalSession;
    bool isProposalSessionOpen;

    function startProposalSession() external onlyOwner {
        lastProposalSession++;
        isProposalSessionOpen = true;
        emit WorkflowStatusChange(
            WorkflowStatus.RegisteringVoters,
            WorkflowStatus.ProposalsRegistrationStarted
        );
    }

    Proposal[] proposals;
    mapping(string => uint256) private proposalIndex;
    mapping(address => Proposal) private voterProposals;

    modifier proposalAlreadyExists(string calldata proposal) {
        require(proposalIndex[proposal] == 0, "Proposal already exists");
        _;
    }

    modifier isVoter(address voterAddress) {
        require(voterIndex[voterAddress] != 0, "You are not authorized");
        _;
    }

    modifier checkIsProposalSessionOpen() {
        require(isProposalSessionOpen, "Proposal session is close");
        _;
    }

    function addProposal(string calldata newProposal)
        external
        proposalAlreadyExists(newProposal)
        checkIsProposalSessionOpen
        isVoter(msg.sender)
    {
        uint256 id = proposals.length + 1;
        proposals.push(Proposal(id, newProposal, 0, msg.sender));
        proposalIndex[newProposal] = proposals.length;
        voterProposals[msg.sender] = Proposal(id, newProposal, 0, msg.sender);
        emit ProposalRegistered(id);
    }

    function closeProposalSession() external onlyOwner {
        isProposalSessionOpen = false;
        emit WorkflowStatusChange(
            WorkflowStatus.ProposalsRegistrationStarted,
            WorkflowStatus.ProposalsRegistrationEnded
        );
    }

    bool isVoteSessionOpen;

    function startVote() external onlyOwner {
        isVoteSessionOpen = true;
        emit WorkflowStatusChange(
            WorkflowStatus.ProposalsRegistrationEnded,
            WorkflowStatus.VotingSessionStarted
        );
    }

    uint256 maxCount;
    uint256 maxCountProposalIndex;

    modifier checkIsVoteSessionOpen() {
        require(isVoteSessionOpen, "Vote session is close");
        _;
    }

    modifier proposalNotExists(string calldata proposal) {
        require(proposalIndex[proposal] != 0, "Proposal not exists");
        _;
    }

    modifier alreadyVoted(address voter) {
        require(!voters[voterIndex[msg.sender] - 1].hasVoted, "Already voted");
        _;
    }

    function vote(string calldata proposalVote)
        external
        checkIsVoteSessionOpen
        isVoter(msg.sender)
        proposalNotExists(proposalVote)
        alreadyVoted(msg.sender)
    {
        uint256 currentProposalIndex = proposalIndex[proposalVote];
        Proposal storage currentProposal = proposals[currentProposalIndex - 1];

        currentProposal.voteCount++;

        if (currentProposal.voteCount > maxCount) {
            maxCount = currentProposal.voteCount;
            maxCountProposalIndex = currentProposalIndex;
        }

        Voter storage currentVoter = voters[voterIndex[msg.sender] - 1];
        currentVoter.votedProposal = currentProposal.description;
        currentVoter.hasVoted = true;
        emit Voted(msg.sender, currentProposal.proposalId);
    }

    function closeVote() external onlyOwner {
        isVoteSessionOpen = false;
        emit WorkflowStatusChange(
            WorkflowStatus.VotingSessionStarted,
            WorkflowStatus.VotingSessionEnded
        );
    }

    bool areVotesTallied;

    function tallyVote() external onlyOwner checkIsVoteSessionClose {
        areVotesTallied = true;
        emit WorkflowStatusChange(
            WorkflowStatus.VotingSessionEnded,
            WorkflowStatus.VotesTallied
        );
    }

    modifier checkareVotesTallied() {
        require(areVotesTallied, "Votes still not tallied");
        _;
    }

    modifier checkIsVoteSessionClose() {
        require(!isVoteSessionOpen, "Vote session is still opened");
        _;
    }

    function getWinner()
        public
        view
        checkIsVoteSessionClose
        checkareVotesTallied
        returns (address winAddress)
    {
        return proposals[maxCountProposalIndex - 1].proposer;
    }

    function winnerProposal()
        public
        view
        checkIsVoteSessionClose
        checkareVotesTallied
        returns (string memory proposalDescription)
    {
        return
            voterProposals[proposals[maxCountProposalIndex - 1].proposer]
                .description;
    }

    function voterChoice()
        public
        view
        isVoter(msg.sender)
        returns (Voter[] memory)
    {
        return voters;
    }
}
