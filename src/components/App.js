import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

// Components
import Navigation from './Navigation';
import Loading from './Loading';
import Proposals from './Proposals';
import Create from './Create';


// ABIs: Import your contract ABIs here
import DAO_ABI from '../abis/DAO.json'

// Config: Import your network config here
import config from '../config.json';

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}
  
const ether = tokens

function App() {
  const [account, setAccount] = useState(null)
  const [dao, setDao] = useState(null)
  const [treasuryBalance, setTreasuryBalance] = useState(0)

  const [provider,setProvider] = useState(null)

  const [proposals, setProposals] = useState(null)
  const [quorum, setQuorum] = useState(null)

  const [isLoading, setIsLoading] = useState(true)

  const loadBlockchainData = async () => {
    // Initiate provider
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)

    //Initiate Contracts
    const dao = new ethers.Contract(config[31337].dao.address, DAO_ABI, provider)
    setDao(dao)

    //Fetch Treasury Balance
    let treasuryBalance = await provider.getBalance(dao.address)
    treasuryBalance = ethers.utils.formatUnits(treasuryBalance,18)
    setTreasuryBalance(treasuryBalance)

    // Fetch accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const account = ethers.utils.getAddress(accounts[0])
    setAccount(account)

    //Fetch proposal count
    const count = await dao.proposalCount()
    const items = []

    for (var i = 0; i < count; i++) {
      const proposal = await dao.proposals(i+1)
      items.push(proposal)
    }

    setProposals(items)

    //Fetch quorum
    setQuorum(await dao.quorum()) 

    let quorum = await dao.quorum()
    quorum = ethers.utils.formatUnits(quorum,1)
    setQuorum(quorum)
  
    setIsLoading(false)
  }

  useEffect(() => {
    if (isLoading) {
      loadBlockchainData()
    }
  }, [isLoading]);

  return(
    <Container>
      <Navigation account={account} />

      <h1 className='my-4 text-center'>Welcome to Our DAO!</h1>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <Create
            provider={provider}
            dao={dao}
            setIsLoading={setIsLoading}
          />
          
          <hr/>
          <p className='text-center'><strong>Treasury Balance:</strong> {treasuryBalance} ETH </p>
          <p className='text-center'><strong>Quorum:</strong> {quorum} ETH </p>
          <hr/>  

          <Proposals 
            provider={provider} 
            dao={dao} 
            proposals={proposals} 
            quorum={quorum} 
            setIsLoading={setIsLoading} 
          />
        </>
      )}
    </Container>
  )
}

export default App;
