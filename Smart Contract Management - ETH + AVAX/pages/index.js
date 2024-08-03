import { useState, useEffect } from "react";
import { ethers } from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [newCandidate, setNewCandidate] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [votes, setVotes] = useState({});
  const [selectedCandidate, setSelectedCandidate] = useState("");

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const atmABI = atm_abi.abi;

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const account = await ethWallet.request({ method: "eth_accounts" });
      handleAccount(account);
    }
  };

  const handleAccount = (account) => {
    if (account) {
      console.log("Account connected: ", account);
      setAccount(account);
      getATMContract();
    } else {
      console.log("No account found");
    }
  };

  const connectAccount = async () => {
    if (!ethWallet) {
      alert('MetaMask wallet is required to connect');
      return;
    }

    const accounts = await ethWallet.request({ method: 'eth_requestAccounts' });
    handleAccount(accounts);
  };

  const getATMContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const atmContract = new ethers.Contract(contractAddress, atmABI, signer);
    setATM(atmContract);
  };

  const getBalance = async () => {
    if (atm) {
      try {
        const balance = await atm.getBalance();
        setBalance(ethers.utils.formatEther(balance));
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    }
  };

  const fetchCandidates = async () => {
    if (atm) {
      try {
        const candidates = await atm.getAllCandidates();
        setCandidates(candidates.map((candidate) => ethers.utils.parseBytes32String(candidate)));
        const votes = await Promise.all(candidates.map((candidate) => atm.getVotes(candidate)));
        const votesObject = {};
        candidates.forEach((candidate, index) => {
          votesObject[ethers.utils.parseBytes32String(candidate)] = votes[index].toNumber();
        });
        setVotes(votesObject);
      } catch (error) {
        console.error("Error fetching candidates:", error);
      }
    }
  };

  const addCandidate = async () => {
    if (atm && newCandidate) {
      try {
        const tx = await atm.addCandidate(ethers.utils.formatBytes32String(newCandidate));
        await tx.wait();
        setCandidates([...candidates, newCandidate]);
        setVotes({ ...votes, [newCandidate]: 0 });
        setNewCandidate("");
      } catch (error) {
        console.error("Error adding candidate:", error);
      }
    }
  };

  const vote = async () => {
    if (atm && selectedCandidate) {
      try {
        const tx = await atm.vote(ethers.utils.formatBytes32String(selectedCandidate));
        await tx.wait();
        setVotes({ ...votes, [selectedCandidate]: votes[selectedCandidate] + 1 });
      } catch (error) {
        console.error("Error voting:", error);
      }
    }
  };

  const deposit = async () => {
    if (atm) {
      try {
        const tx = await atm.deposit({ value: ethers.utils.parseEther("1.0") });
        await tx.wait();
        getBalance();
      } catch (error) {
        console.error("Error depositing:", error);
      }
    }
  };

  const withdraw = async () => {
    if (atm) {
      try {
        const tx = await atm.withdraw(ethers.utils.parseEther("1.0"));
        await tx.wait();
        getBalance();
      } catch (error) {
        console.error("Error withdrawing:", error);
      }
    }
  };

  const initUser = () => {
    if (!ethWallet) {
      return <p>Please install MetaMask in order to use this ATM.</p>;
    }

    if (!account) {
      return <button onClick={connectAccount}>Please connect your MetaMask wallet</button>;
    }

    if (balance === undefined) {
      getBalance();
    }

    return (
      <div>
        <p>Your Account: {account}</p>
        <p>Your Balance: {balance} ETH</p>
        <button onClick={deposit}>Deposit 1 ETH</button>
        <button onClick={withdraw}>Withdraw 1 ETH</button>
        <div>
          <h2>Add Candidate</h2>
          <input value={newCandidate} onChange={(e) => setNewCandidate(e.target.value)} />
          <button onClick={addCandidate}>Add Candidate</button>
        </div>
        <div>
          <h2>Vote</h2>
          <select value={selectedCandidate} onChange={(e) => setSelectedCandidate(e.target.value)}>
            <option value="">Select a candidate</option>
            {candidates.map((candidate, index) => (
              <option key={index} value={candidate}>
                {candidate}
              </option>
            ))}
          </select>
          <button onClick={vote}>Vote</button>
        </div>
        <div>
          <h2>Results</h2>
          {candidates.map((candidate, index) => (
            <p key={index}>{candidate}: {votes[candidate] || 0} votes</p>
          ))}
        </div>
      </div>
    );
  };

  useEffect(() => {
    getWallet();
  }, []);

  useEffect(() => {
    if (account) {
      fetchCandidates();
    }
  }, [account]);

  return (
    <main className="container">
      <header>
        <h1>Welcome to the Metacrafters ATM!</h1>
      </header>
      {initUser()}
      <style jsx>{`
        .container {
          text-align: center;
        }
      `}</style>
    </main>
  );
}
