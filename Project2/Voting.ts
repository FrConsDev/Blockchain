import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, network } from "hardhat";
import { expect } from "chai";

describe("Voting", function () {
  async function deployFixture() {
    const contract = await ethers.deployContract("Voting");
    return { contract };
  }

  async function connectRandomSigner() {
    const randomSigner = ethers.Wallet.createRandom().connect(ethers.provider);

    await network.provider.send("hardhat_setBalance", [
      randomSigner.address,
      "0x56BC75E2D63100000"
    ]);

    return { randomSigner };
  }

  describe("Getters tests", function () {
    it("Should return a voter", async function () {
      const { contract } = await loadFixture(deployFixture);
      const { randomSigner } = await loadFixture(connectRandomSigner);
      
      await expect(contract.addVoter(randomSigner.address)).to.not.be.reverted;
      const voter = await contract.connect(randomSigner).getVoter(randomSigner.address);
      expect(voter[0]).to.equal(true);
      expect(voter[1]).to.equal(false);
      expect(voter[2]).to.equal(0n);
    });

    it("Should revert when return a voter", async function () {
      const { contract } = await loadFixture(deployFixture);
      const { randomSigner } = await loadFixture(connectRandomSigner);
      
      await expect(contract.addVoter(randomSigner.address)).to.not.be.reverted;
      await expect(contract.getVoter(randomSigner.address)).to.be.revertedWith("You're not a voter");
    });

    it("Should return a proposal", async function () {
      const { contract } = await loadFixture(deployFixture);
      const { randomSigner } = await loadFixture(connectRandomSigner);
      
      await expect(contract.addVoter(randomSigner.address)).to.not.be.reverted;
      await expect(contract.startProposalsRegistering()).to.not.be.reverted;
      const proposal = await contract.connect(randomSigner).getOneProposal(0);
      expect(proposal[0]).to.equal('GENESIS');
      expect(proposal[1]).to.equal(0n);
    });

    it("Should revert when return a proposal", async function () {
      const { contract } = await loadFixture(deployFixture);
      const { randomSigner } = await loadFixture(connectRandomSigner);
      
      await expect(contract.addVoter(randomSigner.address)).to.not.be.reverted;
      await expect(contract.startProposalsRegistering()).to.not.be.reverted;
      await expect(contract.getOneProposal(0)).to.be.revertedWith("You're not a voter");
    });
  });

  describe("Registration feature tests", function () {
    it("Should add a user and emit", async function () {
      const { contract } = await loadFixture(deployFixture);
      const { randomSigner } = await loadFixture(connectRandomSigner);

      await expect(contract.addVoter(randomSigner.address)).to.emit(contract, 'VoterRegistered')
        .withArgs(randomSigner);

    });

    it("Should revert on same address", async function () {
      const { contract } = await loadFixture(deployFixture);
      const { randomSigner: { address} } = await loadFixture(connectRandomSigner);

      await expect(contract.addVoter(address)).to.not.be.reverted;
      await expect(contract.addVoter(address)).to.be.revertedWith("Already registered");
    });

    it("Should revert when registration is closed", async function () {
      const { contract } = await loadFixture(deployFixture);
      const { randomSigner: { address} } = await loadFixture(connectRandomSigner);
      
      await expect(contract.startProposalsRegistering()).to.not.be.reverted;
      await expect(contract.addVoter(address)).to.be.revertedWith("Voters registration is not open yet");
    });
  });

  describe("Proposal feature tests", function () {
    it("Should add a proposal and emit", async function () {
      const { contract } = await loadFixture(deployFixture);
      const { randomSigner } = await loadFixture(connectRandomSigner);

      await expect(contract.addVoter(randomSigner.address)).to.not.be.reverted;
      await expect(contract.startProposalsRegistering()).to.not.be.reverted;
      await expect(contract.connect(randomSigner).addProposal('testProp')).to.emit(contract, 'ProposalRegistered')
      .withArgs(1n);
    });

    it("Should revert when add a proposal", async function () {
      const { contract } = await loadFixture(deployFixture);
      const { randomSigner } = await loadFixture(connectRandomSigner);

      await expect(contract.addVoter(randomSigner.address)).to.not.be.reverted;
      await expect(contract.startProposalsRegistering()).to.not.be.reverted;
      await expect(contract.addProposal('testProp')).to.be.revertedWith("You're not a voter");
    });

    it("Should revert on empty proposal", async function () {
      const { contract } = await loadFixture(deployFixture);
      const { randomSigner } = await loadFixture(connectRandomSigner);

      await expect(contract.addVoter(randomSigner.address)).to.not.be.reverted;
      await expect(contract.startProposalsRegistering()).to.not.be.reverted;
      await expect(contract.connect(randomSigner).addProposal('')).to.be.revertedWith("Vous ne pouvez pas ne rien proposer");
    });

    it("Should revert when proposal registration is closed", async function () {
      const { contract } = await loadFixture(deployFixture);
      const { randomSigner } = await loadFixture(connectRandomSigner);

      await expect(contract.addVoter(randomSigner.address)).to.not.be.reverted;
      await expect(contract.connect(randomSigner).addProposal('testProp')).to.be.revertedWith("Proposals are not allowed yet");
    });
  });

  describe("Vote feature tests", function () {
    it("Should vote and emit", async function () {
      const { contract } = await loadFixture(deployFixture);
      const { randomSigner } = await loadFixture(connectRandomSigner);

      await expect(contract.addVoter(randomSigner.address)).to.not.be.reverted;
      await expect(contract.startProposalsRegistering()).to.not.be.reverted;
      await expect(contract.endProposalsRegistering()).to.not.be.reverted;
      await expect(contract.startVotingSession()).to.not.be.reverted;
      await expect(contract.connect(randomSigner).setVote(0)).to.emit(contract, 'Voted')
      .withArgs(randomSigner.address, 0n);
    });

    it("Should revert when vote", async function () {
      const { contract } = await loadFixture(deployFixture);
      const { randomSigner } = await loadFixture(connectRandomSigner);

      await expect(contract.addVoter(randomSigner.address)).to.not.be.reverted;
      await expect(contract.startProposalsRegistering()).to.not.be.reverted;
      await expect(contract.endProposalsRegistering()).to.not.be.reverted;
      await expect(contract.startVotingSession()).to.not.be.reverted;
      await expect(contract.setVote(0)).to.be.revertedWith("You're not a voter");
    });


    it("Should revert if proposal not found", async function () {
      const { contract } = await loadFixture(deployFixture);
      const { randomSigner } = await loadFixture(connectRandomSigner);

      await expect(contract.addVoter(randomSigner.address)).to.not.be.reverted;
      await expect(contract.startProposalsRegistering()).to.not.be.reverted;
      await expect(contract.endProposalsRegistering()).to.not.be.reverted;
      await expect(contract.startVotingSession()).to.not.be.reverted;
      await expect(contract.connect(randomSigner).setVote(3)).to.be.revertedWith("Proposal not found");
    });

    it("Should revert when vote registration is closed", async function () {
      const { contract } = await loadFixture(deployFixture);
      const { randomSigner } = await loadFixture(connectRandomSigner);

      await expect(contract.addVoter(randomSigner.address)).to.not.be.reverted;
      await expect(contract.connect(randomSigner).setVote(0)).to.be.revertedWith("Voting session havent started yet");
    });

    it("Should revert when already voted", async function () {
      const { contract } = await loadFixture(deployFixture);
      const { randomSigner } = await loadFixture(connectRandomSigner);

      await expect(contract.addVoter(randomSigner.address)).to.not.be.reverted;
      await expect(contract.startProposalsRegistering()).to.not.be.reverted;
      await expect(contract.endProposalsRegistering()).to.not.be.reverted;
      await expect(contract.startVotingSession()).to.not.be.reverted;
      await expect(contract.connect(randomSigner).setVote(0)).to.emit(contract, 'Voted')
      .withArgs(randomSigner.address, 0n);
      await expect(contract.connect(randomSigner).setVote(0)).to.be.revertedWith("You have already voted");
    });
  });

  describe("State feature tests", function () {
    it("Should set correct workflow status and emit", async function () {
      const { contract } = await loadFixture(deployFixture);

      await expect(contract.startProposalsRegistering()).to.emit(contract, 'WorkflowStatusChange')
      .withArgs(0n, 1n);
      await expect(contract.endProposalsRegistering()).to.emit(contract, 'WorkflowStatusChange')
      .withArgs(1n, 2n);
      await expect(contract.startVotingSession()).to.emit(contract, 'WorkflowStatusChange')
      .withArgs(2n, 3n);
      await expect(contract.endVotingSession()).to.emit(contract, 'WorkflowStatusChange')
      .withArgs(3n, 4n);
    });

    it("Should revert on workflow status change", async function () {
      const { contract } = await loadFixture(deployFixture);
      const { randomSigner } = await loadFixture(connectRandomSigner);

      await expect(contract.connect(randomSigner).startProposalsRegistering()).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount")
      .withArgs(randomSigner.address);
      await expect(contract.connect(randomSigner).endProposalsRegistering()).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount")
      .withArgs(randomSigner.address);
      await expect(contract.connect(randomSigner).startVotingSession()).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount")
      .withArgs(randomSigner.address);
      await expect(contract.connect(randomSigner).endVotingSession()).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount")
      .withArgs(randomSigner.address);
    });

    it("Should revert if not correct workflow status", async function () {
      const { contract } = await loadFixture(deployFixture);

      await expect(contract.endVotingSession()).to.be.revertedWith("Voting session havent started yet");
      await expect(contract.startVotingSession()).to.be.revertedWith("Registering proposals phase is not finished");
      await expect(contract.endProposalsRegistering()).to.be.revertedWith("Registering proposals havent started yet");
      await expect(contract.startProposalsRegistering()).to.emit(contract, 'WorkflowStatusChange')
      .withArgs(0n, 1n);
      await expect(contract.startProposalsRegistering()).to.be.revertedWith("Registering proposals cant be started now");
    
    });
  });

  describe("Tally feature tests", function () {
    it("Should tally and emit", async function () {
      const { contract } = await loadFixture(deployFixture);
      
      await expect(contract.startProposalsRegistering()).to.emit(contract, 'WorkflowStatusChange')
      .withArgs(0n, 1n);
      await expect(contract.endProposalsRegistering()).to.emit(contract, 'WorkflowStatusChange')
      .withArgs(1n, 2n);
      await expect(contract.startVotingSession()).to.emit(contract, 'WorkflowStatusChange')
      .withArgs(2n, 3n);
      await expect(contract.endVotingSession()).to.emit(contract, 'WorkflowStatusChange')
      .withArgs(3n, 4n);
      await expect(contract.tallyVotes()).to.be.emit(contract, "WorkflowStatusChange")
      .withArgs(4n, 5n);
    });

    it("Should vote, tally and emit", async function () {
      const { contract } = await loadFixture(deployFixture);
      const { randomSigner } = await loadFixture(connectRandomSigner);

      await expect(contract.addVoter(randomSigner.address)).to.not.be.reverted;
      await expect(contract.startProposalsRegistering()).to.emit(contract, 'WorkflowStatusChange')
      .withArgs(0n, 1n);
      await expect(contract.connect(randomSigner).addProposal('testProp')).to.emit(contract, 'ProposalRegistered')
      .withArgs(1n);
      await expect(contract.endProposalsRegistering()).to.emit(contract, 'WorkflowStatusChange')
      .withArgs(1n, 2n);
      await expect(contract.startVotingSession()).to.emit(contract, 'WorkflowStatusChange')
      .withArgs(2n, 3n);
      await expect(contract.connect(randomSigner).setVote(1)).to.emit(contract, 'Voted')
      .withArgs(randomSigner.address, 1n);
      await expect(contract.endVotingSession()).to.emit(contract, 'WorkflowStatusChange')
      .withArgs(3n, 4n);
      await expect(contract.tallyVotes()).to.be.emit(contract, "WorkflowStatusChange")
      .withArgs(4n, 5n);
    });

    it("Should revert if voting session is not ended", async function () {
      const { contract } = await loadFixture(deployFixture);
      
      await expect(contract.tallyVotes()).to.be.revertedWith("Current status is not voting session ended");
    });

    it("Should revert if tally", async function () {
      const { contract } = await loadFixture(deployFixture);
      const { randomSigner } = await loadFixture(connectRandomSigner);

      await expect(contract.addVoter(randomSigner.address)).to.not.be.reverted;
      await expect(contract.startProposalsRegistering()).to.emit(contract, 'WorkflowStatusChange')
      .withArgs(0n, 1n);
      await expect(contract.endProposalsRegistering()).to.emit(contract, 'WorkflowStatusChange')
      .withArgs(1n, 2n);
      await expect(contract.startVotingSession()).to.emit(contract, 'WorkflowStatusChange')
      .withArgs(2n, 3n);
      await expect(contract.endVotingSession()).to.emit(contract, 'WorkflowStatusChange')
      .withArgs(3n, 4n);
      await expect(contract.connect(randomSigner).tallyVotes()).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount")
      .withArgs(randomSigner.address);
    });
  });
});
