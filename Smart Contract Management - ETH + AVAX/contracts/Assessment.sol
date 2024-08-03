// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Assessment {
    address payable public owner;
    uint256 public balance;
    string[] public candidates;
    mapping(string => uint256) private votes;
    mapping(address => bool) private hasVoted;

    event Deposit(uint256 amount);
    event Withdraw(uint256 amount);
    event CandidateAdded(string candidate);
    event VoteCasted(address voter, string candidate);

    constructor(uint initBalance) payable {
        owner = payable(msg.sender);
        balance = initBalance;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function deposit() public payable {
        require(msg.sender == owner, "You are not the owner of this account");
        balance += msg.value;
        emit Deposit(msg.value);
    }

    function withdraw(uint256 _withdrawAmount) public {
        require(msg.sender == owner, "You are not the owner of this account");
        require(address(this).balance >= _withdrawAmount, "Insufficient balance");

        balance -= _withdrawAmount;
        payable(msg.sender).transfer(_withdrawAmount);

        emit Withdraw(_withdrawAmount);
    }

    function addCandidate(string memory _candidate) public {
        candidates.push(_candidate);
        emit CandidateAdded(_candidate);
    }

    function vote(string memory _candidate) public {
        require(!hasVoted[msg.sender], "You have already voted");
        require(isValidCandidate(_candidate), "Invalid candidate");
        votes[_candidate] += 1;
        hasVoted[msg.sender] = true;
        emit VoteCasted(msg.sender, _candidate);
    }

    function getVotes(string memory _candidate) public view returns (uint256) {
        require(isValidCandidate(_candidate), "Invalid candidate");
        return votes[_candidate];
    }

    function isValidCandidate(string memory _candidate) internal view returns (bool) {
        for (uint i = 0; i < candidates.length; i++) {
            if (keccak256(abi.encodePacked(candidates[i])) == keccak256(abi.encodePacked(_candidate))) {
                return true;
            }
        }
        return false;
    }
}
