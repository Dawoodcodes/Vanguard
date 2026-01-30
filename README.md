▶️ How to Run the SubHub Project (Local Setup)

Follow these steps to run the SubHub project on your local machine.

✅ Prerequisites

Make sure you have:

A modern web browser (Chrome recommended)

MetaMask browser extension installed

Some test ETH on Sepolia Testnet

Deployed smart contracts (ERC20 $SUB & Subscription contract)

🛠 Step 1: Clone the Repository
git clone https://github.com/Dawoodcodes/Vanguard.git


or download the ZIP file and extract it.

📂 Step 2: Open the Project Folder
cd Vanguard


You will see:

index.html

style.css

app.js

🔧 Step 3: Configure Smart Contract Addresses

Open app.js and update:

const SUB_TOKEN_ADDRESS = "0xYourSubTokenAddress";
const SUBSCRIPTION_CONTRACT_ADDRESS = "0xYourSubscriptionContractAddress";


Also make sure the ABI of both contracts is added correctly.

🌐 Step 4: Run the Project

Since this is a pure frontend project, no server is required.

👉 Option 1 (Recommended):

Right-click index.html

Select Open with Live Server (VS Code extension)

👉 Option 2:

Simply double-click index.html

Open it in your browser

⚠️ Live Server is recommended to avoid wallet and CORS issues.

🔐 Step 5: Connect Wallet

Open the website

Click Connect Wallet

MetaMask will pop up

Switch network to Sepolia Testnet

Approve the connection

🧪 Step 6: Test the Flow

Create a subscription plan (Creator)

Buy $SUB tokens

Subscribe using $SUB

Open My Subscriptions

Access premium content

📦 How to Push README to GitHub

If README is not showing:

File name must be exactly:

README.md


README should be in the root folder

Commit & push:

git add README.md
git commit -m "Add project documentation"
git push origin main


GitHub will automatically render it.

📝 Notes for Evaluators

No backend server required

Blockchain handles authentication & access control

Frontend verifies subscription status via smart contract

Project runs entirely on client-side

❗ Common Issues

MetaMask not connected → Refresh & reconnect

Wrong network → Switch to Sepolia

Contract not working → Check ABI & address

Content not showing → Subscription expired or inactive
