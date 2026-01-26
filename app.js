import { ethers } from 'ethers';

// --- SMART CONTRACT CONFIGURATION ---
// ⚠️ IMPORTANT: Update these with your Sepolia testnet deployed addresses
const SUBHUB_ADDRESS = "0x7f8fc61362c29798D203DcD8E54686F0658608B4"; // Example: 0xabcd...1234
const SUBTOKEN_ADDRESS = "0x32d8DD5DB3AAF1EC94632772eE797474B57Bbc43"; // Example: 0x1234...abcd

// Check if contracts are deployed
const CONTRACTS_DEPLOYED = SUBHUB_ADDRESS.startsWith("0x") && 
                           SUBTOKEN_ADDRESS.startsWith("0x") &&
                           SUBHUB_ADDRESS !== "YOUR_SUBHUB_CONTRACT_ADDRESS_HERE" &&
                           SUBTOKEN_ADDRESS !== "YOUR_SUBTOKEN_CONTRACT_ADDRESS_HERE";

console.log("Contract Configuration:");
console.log("SubHub Address:", SUBHUB_ADDRESS);
console.log("SubToken Address:", SUBTOKEN_ADDRESS);
console.log("Contracts Deployed:", CONTRACTS_DEPLOYED);

// Contract ABIs (Application Binary Interfaces)
const SUBTOKEN_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

const SUBHUB_ABI = [
    "function createPlan(uint256 price, uint256 duration)",
    "function subscribe(address creator)",
    "function renewSubscription(address creator)",
    "function isSubscribed(address user, address creator) view returns (bool)",
    "function getPlan(address creator) view returns (uint256 price, uint256 duration, bool active, uint256 subscriberCount)",
    "function getSubscription(address user, address creator) view returns (uint256 startTime, uint256 expiryTime, bool everSubscribed, bool isCurrentlyActive)",
    "function getTimeRemaining(address user, address creator) view returns (uint256)",
    "event PlanCreated(address indexed creator, uint256 price, uint256 duration, uint256 timestamp)",
    "event Subscribed(address indexed user, address indexed creator, uint256 price, uint256 expiryTime, uint256 timestamp)",
    "event SubscriptionRenewed(address indexed user, address indexed creator, uint256 newExpiryTime, uint256 timestamp)"
];

// Global blockchain state
let provider;
let signer;
let subTokenContract;
let subHubContract;

// Application State
let state = {
    account: null,
    balance: "0.00",
    plans: [],
    subscriptions: [],
    videos: []
};

// --- UI REFERENCES ---
const ui = {
    pages: document.querySelectorAll('.page-section'),
    navLinks: document.querySelectorAll('.nav-link'),
    sidebarLinks: document.querySelectorAll('.sidebar-link'),
    connectBtn: document.getElementById('connect-btn'),
    accountDisplay: document.getElementById('account-display'),
    userAddress: document.getElementById('user-address'),
    userBalance: document.getElementById('user-balance'),
    creatorsGrid: document.getElementById('creators-grid'),
    studioLocked: document.getElementById('studio-locked'),
    studioUnlocked: document.getElementById('studio-unlocked'),
    dashboardLocked: document.getElementById('dashboard-locked'),
    dashboardUnlocked: document.getElementById('dashboard-unlocked'),
    myPlansList: document.getElementById('my-plans-list'),
    mySubsGrid: document.getElementById('my-subs-grid'),
    contentGrid: document.getElementById('content-grid'),
    videoPlayer: document.getElementById('video-player-container'),
    videoIframe: document.getElementById('video-iframe'),
    loadingOverlay: document.getElementById('loading-overlay'),
    toast: document.getElementById('toast'),
    vidTierSelect: document.getElementById('vid-tier')
};

// --- UTILITY FUNCTIONS ---
function notify(msg, type = 'success') {
    ui.toast.innerText = msg;
    ui.toast.className = `fixed bottom-10 right-10 z-[200] px-10 py-6 rounded-[2rem] shadow-2xl text-white font-black animate-in slide-in-from-right-10 ${type === 'error' ? 'bg-rose-500' : 'bg-slate-900'}`;
    ui.toast.classList.remove('hidden');
    setTimeout(() => ui.toast.classList.add('hidden'), 4000);
}

function toggleLoading(show) {
    ui.loadingOverlay.classList.toggle('hidden', !show);
}

function formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatBalance(balance) {
    return parseFloat(ethers.formatEther(balance)).toFixed(2);
}

// --- WALLET CONNECTION ---
async function connectWallet() {
    try {
        // Check if contracts are deployed
        if (!CONTRACTS_DEPLOYED) {
            notify("⚠️ Smart contracts not deployed yet! Please deploy SubHub and SubToken first.", "error");
            console.error("Contract addresses not set. Update SUBHUB_ADDRESS and SUBTOKEN_ADDRESS in app.js");
            return;
        }

        toggleLoading(true);
        
        // Check if MetaMask is installed
        if (!window.ethereum) {
            notify("Please install MetaMask browser extension", "error");
            toggleLoading(false);
            window.open('https://metamask.io/download/', '_blank');
            return;
        }

        console.log("Requesting wallet connection...");

        // Request account access
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        if (!accounts || accounts.length === 0) {
            notify("No accounts found. Please unlock MetaMask.", "error");
            toggleLoading(false);
            return;
        }

        state.account = accounts[0];
        console.log("Connected account:", state.account);

        // Initialize ethers provider and signer
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();

        console.log("Provider initialized");

        // Get network info
        const network = await provider.getNetwork();
        console.log("Connected to network:", network.name, "Chain ID:", network.chainId.toString());

        // Initialize contracts
        try {
            subTokenContract = new ethers.Contract(SUBTOKEN_ADDRESS, SUBTOKEN_ABI, signer);
            subHubContract = new ethers.Contract(SUBHUB_ADDRESS, SUBHUB_ABI, signer);
            console.log("Contracts initialized");
        } catch (contractError) {
            console.error("Contract initialization error:", contractError);
            notify("Error initializing contracts. Check console for details.", "error");
            toggleLoading(false);
            return;
        }

        // Get user's SUB token balance
        try {
            const balance = await subTokenContract.balanceOf(state.account);
            state.balance = formatBalance(balance);
            console.log("SUB Balance:", state.balance);
        } catch (balanceError) {
            console.error("Error fetching balance:", balanceError);
            notify("Warning: Could not fetch SUB token balance", "error");
            state.balance = "0.00";
        }

        // Update UI
        ui.connectBtn.classList.add('hidden');
        ui.accountDisplay.classList.remove('hidden');
        ui.userAddress.innerText = formatAddress(state.account);
        ui.userBalance.innerText = `${state.balance} SUB`;

        // Load blockchain data
        try {
            await loadAllPlans();
            await loadUserSubscriptions();
            await loadVideos();
        } catch (loadError) {
            console.error("Error loading blockchain data:", loadError);
            notify("Warning: Could not load all data", "error");
        }
        
        refreshUI();
        toggleLoading(false);
        notify("Wallet Connected Successfully");

        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', () => window.location.reload());

    } catch (error) {
        console.error("Wallet connection error:", error);
        
        // Handle specific errors
        if (error.code === 4001) {
            notify("Connection rejected by user", "error");
        } else if (error.code === -32002) {
            notify("Connection request pending. Please check MetaMask.", "error");
        } else {
            notify(error.message || "Failed to connect wallet", "error");
        }
        
        toggleLoading(false);
    }
}

async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // User disconnected wallet
        window.location.reload();
    } else if (accounts[0] !== state.account) {
        // User switched accounts
        window.location.reload();
    }
}

// --- BLOCKCHAIN DATA LOADING ---

// Load all creator plans from the blockchain
async function loadAllPlans() {
    try {
        state.plans = [];
        
        console.log("Loading plans from blockchain...");
        
        // Listen for PlanCreated events to find all creators
        const filter = subHubContract.filters.PlanCreated();
        const events = await subHubContract.queryFilter(filter, 0, 'latest');
        
        console.log(`Found ${events.length} PlanCreated events`);
        
        // Get unique creator addresses
        const creatorSet = new Set();
        events.forEach(event => {
            creatorSet.add(event.args.creator);
        });

        console.log(`Found ${creatorSet.size} unique creators`);

        // Fetch plan details for each creator
        for (const creatorAddress of creatorSet) {
            try {
                const [price, duration, active, subscriberCount] = await subHubContract.getPlan(creatorAddress);
                
                if (active) {
                    state.plans.push({
                        creator: creatorAddress,
                        name: `Plan by ${formatAddress(creatorAddress)}`,
                        description: "Blockchain-powered subscription for exclusive content access.",
                        price: formatBalance(price),
                        duration: Number(duration) / 86400, // Convert seconds to days
                        isActive: active,
                        subscriberCount: Number(subscriberCount)
                    });
                }
            } catch (planError) {
                console.error(`Error loading plan for ${creatorAddress}:`, planError);
            }
        }

        console.log(`Loaded ${state.plans.length} active plans`);

    } catch (error) {
        console.error("Error loading plans:", error);
        // Don't throw error, just log it
    }
}

// Load user's active subscriptions
async function loadUserSubscriptions() {
    try {
        if (!state.account) return;
        
        state.subscriptions = [];

        // Check subscriptions for each plan
        for (const plan of state.plans) {
            const isSubscribed = await subHubContract.isSubscribed(state.account, plan.creator);
            
            if (isSubscribed) {
                const [startTime, expiryTime, everSubscribed, isCurrentlyActive] = 
                    await subHubContract.getSubscription(state.account, plan.creator);
                
                const timeRemaining = await subHubContract.getTimeRemaining(state.account, plan.creator);
                const daysRemaining = Math.ceil(Number(timeRemaining) / 86400);

                state.subscriptions.push({
                    creator: plan.creator,
                    name: plan.name,
                    price: plan.price,
                    expiryTime: Number(expiryTime),
                    daysRemaining: daysRemaining,
                    isActive: isCurrentlyActive
                });
            }
        }

    } catch (error) {
        console.error("Error loading subscriptions:", error);
    }
}

// Load videos (stored locally, mapped to on-chain plans)
async function loadVideos() {
    // Videos are stored in browser's local storage
    const stored = localStorage.getItem('subhub_videos');
    if (stored) {
        state.videos = JSON.parse(stored);
    }
}

function saveVideos() {
    localStorage.setItem('subhub_videos', JSON.stringify(state.videos));
}

// --- CREATOR FUNCTIONS ---

// Create a new subscription plan
async function createSubscriptionPlan(name, priceInSUB, durationInDays) {
    try {
        toggleLoading(true);
        notify("Creating subscription plan...");

        // Convert price to wei (18 decimals)
        const priceWei = ethers.parseEther(priceInSUB.toString());
        
        // Convert days to seconds
        const durationSeconds = durationInDays * 86400;

        // Call smart contract
        const tx = await subHubContract.createPlan(priceWei, durationSeconds);
        
        notify("Transaction submitted. Waiting for confirmation...");
        await tx.wait();

        notify("Subscription plan created successfully!");
        
        // Reload data
        await loadAllPlans();
        refreshUI();
        toggleLoading(false);

    } catch (error) {
        console.error("Error creating plan:", error);
        notify(error.reason || error.message || "Failed to create plan", "error");
        toggleLoading(false);
        throw error;
    }
}

// Publish content (store locally with creator address)
async function publishContent(title, youtubeUrl, creatorAddress) {
    try {
        // Extract YouTube ID
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = youtubeUrl.match(regExp);
        const youtubeId = (match && match[2].length === 11) ? match[2] : youtubeUrl;

        const video = {
            id: Date.now().toString(),
            title,
            youtubeId,
            creator: creatorAddress,
            timestamp: Date.now()
        };

        state.videos.unshift(video);
        saveVideos();
        
        notify("Content published successfully!");
        refreshUI();

    } catch (error) {
        console.error("Error publishing content:", error);
        notify("Failed to publish content", "error");
        throw error;
    }
}

// --- USER SUBSCRIPTION FUNCTIONS ---

// Subscribe to a creator's plan
async function subscribeToPlan(creatorAddress, priceInSUB) {
    try {
        toggleLoading(true);
        notify("Preparing subscription...");

        const priceWei = ethers.parseEther(priceInSUB.toString());

        // Step 1: Check if user has enough balance
        const balance = await subTokenContract.balanceOf(state.account);
        if (balance < priceWei) {
            notify("Insufficient SUB token balance", "error");
            toggleLoading(false);
            return;
        }

        // Step 2: Check current allowance
        const currentAllowance = await subTokenContract.allowance(state.account, SUBHUB_ADDRESS);
        
        // Step 3: Approve if needed
        if (currentAllowance < priceWei) {
            notify("Approving SUB tokens...");
            const approveTx = await subTokenContract.approve(SUBHUB_ADDRESS, priceWei);
            await approveTx.wait();
            notify("Approval confirmed. Subscribing...");
        }

        // Step 4: Subscribe
        const subscribeTx = await subHubContract.subscribe(creatorAddress);
        notify("Transaction submitted. Waiting for confirmation...");
        await subscribeTx.wait();

        notify("Subscription activated successfully!");

        // Update balance
        const newBalance = await subTokenContract.balanceOf(state.account);
        state.balance = formatBalance(newBalance);
        ui.userBalance.innerText = `${state.balance} SUB`;

        // Reload subscriptions
        await loadUserSubscriptions();
        refreshUI();
        toggleLoading(false);

    } catch (error) {
        console.error("Subscription error:", error);
        notify(error.reason || error.message || "Subscription failed", "error");
        toggleLoading(false);
    }
}

// Renew subscription
async function renewSubscription(creatorAddress, priceInSUB) {
    try {
        toggleLoading(true);
        notify("Renewing subscription...");

        const priceWei = ethers.parseEther(priceInSUB.toString());

        // Check balance
        const balance = await subTokenContract.balanceOf(state.account);
        if (balance < priceWei) {
            notify("Insufficient SUB token balance", "error");
            toggleLoading(false);
            return;
        }

        // Approve tokens
        const currentAllowance = await subTokenContract.allowance(state.account, SUBHUB_ADDRESS);
        if (currentAllowance < priceWei) {
            notify("Approving SUB tokens...");
            const approveTx = await subTokenContract.approve(SUBHUB_ADDRESS, priceWei);
            await approveTx.wait();
        }

        // Renew
        const renewTx = await subHubContract.renewSubscription(creatorAddress);
        notify("Transaction submitted. Waiting for confirmation...");
        await renewTx.wait();

        notify("Subscription renewed successfully!");

        // Update data
        const newBalance = await subTokenContract.balanceOf(state.account);
        state.balance = formatBalance(newBalance);
        ui.userBalance.innerText = `${state.balance} SUB`;

        await loadUserSubscriptions();
        refreshUI();
        toggleLoading(false);

    } catch (error) {
        console.error("Renewal error:", error);
        notify(error.reason || error.message || "Renewal failed", "error");
        toggleLoading(false);
    }
}

// --- UI REFRESH FUNCTIONS ---

function refreshUI() {
    const isUserConnected = !!state.account;
    
    // Auth Views
    ui.studioLocked.classList.toggle('hidden', isUserConnected);
    ui.studioUnlocked.classList.toggle('hidden', !isUserConnected);
    ui.dashboardLocked.classList.toggle('hidden', isUserConnected);
    ui.dashboardUnlocked.classList.toggle('hidden', !isUserConnected);

    // Creators Grid (Explore Page)
    ui.creatorsGrid.innerHTML = state.plans.map(p => {
        const isSubscribed = state.subscriptions.some(s => s.creator === p.creator);
        return `
            <div class="bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all flex flex-col group hover:-translate-y-2">
                <div class="h-32 bg-gradient-to-br from-indigo-600 to-purple-700 relative p-8">
                    <div class="absolute -bottom-8 left-8 w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center font-black text-indigo-600 text-2xl border-4 border-white">${p.name[0]}</div>
                </div>
                <div class="p-8 pt-12 flex-grow flex flex-col">
                    <h3 class="text-2xl font-black mb-2 tracking-tight text-slate-900">${p.name}</h3>
                    <p class="text-slate-500 text-sm mb-4 leading-relaxed font-medium line-clamp-2">${p.description}</p>
                    <div class="text-xs text-slate-400 mb-8">
                        <div class="font-bold">Creator: ${formatAddress(p.creator)}</div>
                        <div class="mt-1">${Math.floor(p.duration)} Day Access • ${p.subscriberCount} Subscribers</div>
                    </div>
                    <div class="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                        <div>
                            <span class="text-2xl font-black text-slate-900">${p.price}</span>
                            <span class="text-[10px] font-black text-slate-400 ml-1">SUB</span>
                        </div>
                        ${isSubscribed ? `
                            <div class="flex items-center text-green-500 font-black text-xs uppercase tracking-widest">
                                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                                Active
                            </div>
                        ` : `
                            <button onclick="initiateSubscription('${p.creator}', '${p.price}')" class="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 uppercase tracking-widest">Unlock Access</button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('') || '<div class="col-span-full text-center py-20 text-slate-400 font-bold">No active plans found. Create one in Creator Studio!</div>';

    // Studio - My Plans List
    const myPlans = state.plans.filter(p => p.creator.toLowerCase() === state.account?.toLowerCase());
    
    ui.myPlansList.innerHTML = myPlans.map(p => `
        <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
            <div>
                <h4 class="font-black text-xl text-slate-900 tracking-tight">${p.name}</h4>
                <div class="flex items-center gap-3 mt-2">
                    <span class="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest">${Math.floor(p.duration)} Day Cycle</span>
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${p.subscriberCount} Holders</span>
                </div>
            </div>
            <div class="text-right">
                <div class="text-2xl font-black text-indigo-600">${p.price} <span class="text-[10px] uppercase">SUB</span></div>
            </div>
        </div>
    `).join('') || '<p class="text-slate-400 text-center py-10 font-bold">No plans created yet. Deploy your first tier!</p>';

    // Studio - Video Tier Select
    ui.vidTierSelect.innerHTML = '<option value="">Select your plan...</option>' + 
        myPlans.map(p => `<option value="${p.creator}">${p.name}</option>`).join('');

    // Dashboard - My Subscriptions
    ui.mySubsGrid.innerHTML = state.subscriptions.map(s => `
        <div class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-xl transition-all">
            <div>
                <h3 class="text-2xl font-black text-slate-900 tracking-tight">${s.name}</h3>
                <div class="text-xs text-slate-400 mt-1 mb-2">Creator: ${formatAddress(s.creator)}</div>
                <div class="flex items-center mt-2">
                   <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                   <p class="text-[10px] font-black text-green-600 uppercase tracking-widest">Active</p>
                </div>
            </div>
            <div class="text-right">
                 <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expires in</div>
                 <div class="text-lg font-black text-slate-900">${s.daysRemaining} Days</div>
                 <button onclick="renewUserSubscription('${s.creator}', '${s.price}')" class="mt-3 text-xs font-black text-indigo-600 hover:underline uppercase tracking-widest">Renew</button>
            </div>
        </div>
    `).join('') || `
        <div class="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
            <p class="text-slate-400 mb-6 font-bold">No active subscriptions found.</p>
            <button onclick="navigateTo('creators')" class="text-indigo-600 font-black hover:underline uppercase text-xs tracking-widest">Explore Creators</button>
        </div>
    `;

    // Dashboard - Content Library
    ui.contentGrid.innerHTML = state.videos.map(v => {
        const isUnlocked = state.subscriptions.some(s => s.creator === v.creator);
        return `
            <div class="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm relative group ${isUnlocked ? 'cursor-pointer hover:shadow-2xl transition-all' : 'opacity-90'}" 
                 onclick="${isUnlocked ? `renderPlayer('${v.youtubeId}')` : ''}">
                <div class="aspect-video bg-slate-200 relative overflow-hidden">
                    <img src="https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                    ${!isUnlocked ? `
                        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-[3px] flex flex-col items-center justify-center text-white p-8 text-center">
                            <svg class="w-10 h-10 mb-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            <div class="font-black text-sm uppercase tracking-[0.2em] mb-2">Locked Content</div>
                            <div class="text-[10px] font-bold opacity-60">Subscribe to ${formatAddress(v.creator)}</div>
                        </div>
                    ` : `
                        <div class="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                             <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-2xl">
                               <svg class="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg>
                             </div>
                        </div>
                    `}
                </div>
                <div class="p-6">
                    <h4 class="font-black text-slate-800 tracking-tight text-lg line-clamp-1">${v.title}</h4>
                    <p class="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">${formatAddress(v.creator)}</p>
                </div>
            </div>
        `;
    }).join('') || '<div class="col-span-full text-center py-20 text-slate-400 font-bold">No content published yet.</div>';
}

// --- GLOBAL HANDLERS ---

window.initiateSubscription = async (creatorAddress, price) => {
    if (!state.account) return connectWallet();
    await subscribeToPlan(creatorAddress, price);
};

window.renewUserSubscription = async (creatorAddress, price) => {
    if (!state.account) return connectWallet();
    await renewSubscription(creatorAddress, price);
};

window.renderPlayer = (id) => {
    ui.videoIframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1&rel=0`;
    ui.videoPlayer.classList.remove('hidden');
    ui.videoPlayer.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.closeVideo = () => {
    ui.videoIframe.src = '';
    ui.videoPlayer.classList.add('hidden');
};

// --- SPA ROUTING ---
window.navigateTo = (pageId) => {
    ui.pages.forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(`${pageId}-page`);
    if (target) {
        target.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    [...ui.navLinks, ...ui.sidebarLinks].forEach(l => {
        l.classList.remove('active', 'text-indigo-600', 'bg-indigo-600', 'text-white');
        const triggerAttr = l.getAttribute('onclick') || "";
        if (triggerAttr.includes(pageId)) {
            if (l.classList.contains('sidebar-link')) {
                l.classList.add('active');
            } else {
                l.classList.add('active');
            }
        }
    });
};

// --- MODAL ENGINE ---
window.openModal = (id) => {
    const el = document.getElementById(id);
    el.classList.remove('hidden');
    el.classList.add('active');
};

window.closeModal = (id) => {
    const el = document.getElementById(id);
    el.classList.add('hidden');
    el.classList.remove('active');
};

// --- FORM HANDLERS ---

// Create Plan Form
document.getElementById('plan-form').onsubmit = async (e) => {
    e.preventDefault();
    
    if (!state.account) {
        notify("Please connect wallet first", "error");
        return;
    }

    const name = document.getElementById('tier-name').value;
    const price = document.getElementById('tier-price').value;
    const duration = document.getElementById('tier-duration').value;

    try {
        await createSubscriptionPlan(name, price, Number(duration));
        closeModal('plan-modal');
        e.target.reset();
    } catch (error) {
        // Error already handled in createSubscriptionPlan
    }
};

// Publish Content Form
document.getElementById('video-form').onsubmit = async (e) => {
    e.preventDefault();
    
    if (!state.account) {
        notify("Please connect wallet first", "error");
        return;
    }

    const title = document.getElementById('vid-title').value;
    const url = document.getElementById('vid-url').value;
    const creatorAddress = document.getElementById('vid-tier').value;

    if (!creatorAddress) {
        notify("Please select a plan", "error");
        return;
    }

    try {
        toggleLoading(true);
        await publishContent(title, url, creatorAddress);
        closeModal('video-modal');
        toggleLoading(false);
        e.target.reset();
    } catch (error) {
        toggleLoading(false);
    }
};

// --- BOOTSTRAP APPLICATION ---
ui.connectBtn.onclick = connectWallet;
navigateTo('home');

// Load videos from local storage on startup
loadVideos();
refreshUI();

// Auto-connect if previously connected
if (window.ethereum && window.ethereum.selectedAddress) {
    // User was previously connected, auto-connect
    setTimeout(() => {
        // Optional: auto-connect on page load
        // connectWallet();
    }, 500);
}