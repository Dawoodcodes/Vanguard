async function connectWallet() {
  if (typeof window.ethereum !== 'undefined') {
    try {
      // Request wallet connection
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      });

      const walletAddress = accounts[0];
      document.getElementById("status").innerText =
        "Connected Wallet: " + walletAddress;

    } catch (error) {
      document.getElementById("status").innerText =
        "User rejected the request.";
    }
  } else {
    document.getElementById("status").innerText =
      "MetaMask not detected. Please install MetaMask.";
  }
}
