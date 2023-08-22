const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('DAO', () => {
    let dao, token
    let deployer,
    funder,investor1,
    investor2,investor3,
    investor4,investor5,
    recipient,user

    beforeEach(async () => {

    //Setup Accounts
    let accounts = await ethers.getSigners()
    deployer = accounts[0]
    funder  = accounts[1]
    investor1 = accounts[2]
    investor2 = accounts[3]
    investor3 = accounts[4]
    investor4 = accounts[5]
    investor5 = accounts[6]
    recipient = accounts[7]
    user = accounts[8]

    //Deploy Token
    const Token = await ethers.getContractFactory('Token')
    token = await Token.deploy('Dapp University', 'DAPP', '1000000')

    //Sends tokens to investora - each gets 20%
    transaction = await token.connect(deployer).transfer(investor1.address, tokens(200000))
    await transaction.wait()

    transaction = await token.connect(deployer).transfer(investor2.address, tokens(200000))
    await transaction.wait()

    transaction = await token.connect(deployer).transfer(investor3.address, tokens(200000))
    await transaction.wait()

    transaction = await token.connect(deployer).transfer(investor4.address, tokens(200000))
    await transaction.wait()

    transaction = await token.connect(deployer).transfer(investor5.address, tokens(200000))
    await transaction.wait()

    //Deploy DAO and set QUORUM to > 50% of token supply, 500K + 1 wei, i.e., "500000000000000000000001"
    const DAO = await ethers.getContractFactory('DAO')
    dao = await DAO.deploy(token.address,'500000000000000000000001')

    //Funder sends 100 to DAO treasury
    await funder.sendTransaction({ to: dao.address, value: ether(100) })
    
  })

  describe('Deployment', () => {

    it('sends ether to DAO treasury ', async () => {
        expect(await ethers.provider.getBalance(dao.address)).to.equal(ether(100))
    })

    it('returns token address', async () => {
        expect(await dao.token()).to.equal(token.address)
    })

    it('returns quorum', async () => {
        expect(await dao.quorum()).to.equal('500000000000000000000001')
    })
    
  })

  describe('Proposal Creation', () => {
    let transaction, result

    describe('Success ', async () => {
        beforeEach(async()=>{
            transaction = await dao.connect(investor1).createProposal('Proposal 1', ether(100), recipient.address)
            result = await transaction.wait()
        })

        it('Updates proposal Count', async()=>{
            expect ( await dao.proposalCount()).to.equal(1)
        })

        it('Updates proposal Mapping', async()=>{
          const proposal = await dao.proposals(1)

          expect(proposal.id).to.equal(1)
          expect(proposal.amount).to.equal(ether(100))
          expect(proposal.recipient).to.equal(recipient.address)
        })

        it('Emits a propose Event', async()=>{
          await expect(transaction).to.emit(dao,'Propose').withArgs(1, ether(100), recipient.address, investor1.address)
        })
    })

    describe('Failure', async () => {

      it('Rejects invalid amount', async()=>{
          await expect( dao.connect(investor1).createProposal(1,ether(1000),recipient.address)).to.be.reverted
      })

      it('Rejects non investors', async()=>{
        await expect( dao.connect(user).createProposal(1,ether(100),recipient.address)).to.be.reverted
      })
         
    })
  })

    

  describe('Voting', () => {
      let transaction, result

      beforeEach(async()=>{
        transaction = await dao.connect(investor1).createProposal('Proposal 1', ether(100), recipient.address)
        result = await transaction.wait()
    })
  
      describe('Success ', async () => {
          beforeEach(async()=>{
            transaction = await dao.connect(investor1).vote(1)
            result = await transaction.wait()
          })
  
          it('Updates Vote Count', async()=>{
            const proposal = await dao.proposals(1)
            expect(proposal.votes).to.equal(tokens(200000))
          })

          it('Emits a vote Event', async()=>{
            await expect(transaction).to.emit(dao,'Vote').withArgs(1,investor1.address)
          })
      })

      describe('Failure', async () => {
  
        it('Rejects non investors', async()=>{
          await expect(dao.connect(user).vote(1)).to.be.reverted
        })

        it('Rejects double voting', async()=>{
          transaction = await dao.connect(investor1).vote(1)
          await transaction.wait()

          await expect(dao.connect(investor1).vote(1)).to.be.reverted
        })
           
      })
  })
  
        

    
    
})


