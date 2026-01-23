import { ethers } from 'ethers';

// --- PROTOCOL CONFIGURATION (MOCKED) ---
const PROTOCOL_ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"; 
const NATIVE_TOKEN = "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7";

// Decentralized State Management
let state = {
    account: null,
    balance: "0.00",
    plans: [
        { id: 1, creator: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", name: "Alpha Protocol", description: "Comprehensive access to developer deep dives and protocol architectural reviews.", price: "12.50", duration: 30, isActive: true, subscriberCount: 421 },
        { id: 2, creator: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", name: "Security Mastery", description: "Advanced smart contract audit sessions and vulnerability research workshops.", price: "45.00", duration: 30, isActive: true, subscriberCount: 89 }
    ],
    subscriptions: [], 
    videos: [
        { id: '1', title: 'Decentralized Architecture 101', youtubeId: 'SqcY0GlETPk', planId: 1, creator: '0x71C7...8976F' },
        { id: '2', title: 'Exploiting Reentrancy Vulnerabilities', youtubeId: 'pS-W_6m_F-k', planId: 2, creator: '0x71C7...8976F' },
        { id: '3', title: 'React Performance at Scale', youtubeId: 'Tn6-PIqc4UM', planId: 1, creator: '0x71C7...8976F' }
    ]
};

// --- ORCHESTRATION LAYER ---
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

// --- SPA ROUTING ---
window.navigateTo = (pageId) => {
    ui.pages.forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(`${pageId}-page`);
    if (target) {
        target.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update global active states
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

// --- NOTIFICATION ENGINE ---
function notify(msg, type = 'success') {
    ui.toast.innerText = msg;
    ui.toast.className = `fixed bottom-10 right-10 z-[200] px-10 py-6 rounded-[2rem] shadow-2xl text-white font-black animate-in slide-in-from-right-10 ${type === 'error' ? 'bg-rose-500' : 'bg-slate-900'}`;
    ui.toast.classList.remove('hidden');
    setTimeout(() => ui.toast.classList.add('hidden'), 4000);
}

function toggleLoading(show) {
    ui.loadingOverlay.classList.toggle('hidden', !show);
}

// --- MOCKED PROTOCOL LOGIC ---
async function connectWallet() {
    toggleLoading(true);
    // Simulate node handshake
    setTimeout(() => {
        state.account = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
        state.balance = "250.00";
        
        ui.connectBtn.classList.add('hidden');
        ui.accountDisplay.classList.remove('hidden');
        ui.userAddress.innerText = `0x71C7...8976F`;
        ui.userBalance.innerText = `${state.balance} SUB`;

        refreshUI();
        toggleLoading(false);
        notify("Secure Connection Established");
    }, 1200);
}

function refreshUI() {
    const isUserConnected = !!state.account;
    
    // Auth Views
    ui.studioLocked.classList.toggle('hidden', isUserConnected);
    ui.studioUnlocked.classList.toggle('hidden', !isUserConnected);
    ui.dashboardLocked.classList.toggle('hidden', isUserConnected);
    ui.dashboardUnlocked.classList.toggle('hidden', !isUserConnected);

    // Global Protocol Feed (Explore)
    ui.creatorsGrid.innerHTML = state.plans.map(p => {
        const isSubscribed = state.subscriptions.some(s => s.planId === p.id);
        return `
            <div class="bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all flex flex-col group hover:-translate-y-2">
                <div class="h-32 bg-gradient-to-br from-indigo-600 to-purple-700 relative p-8">
                    <div class="absolute -bottom-8 left-8 w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center font-black text-indigo-600 text-2xl border-4 border-white">${p.name[0]}</div>
                </div>
                <div class="p-8 pt-12 flex-grow flex flex-col">
                    <h3 class="text-2xl font-black mb-2 tracking-tight text-slate-900">${p.name}</h3>
                    <p class="text-slate-500 text-sm mb-8 leading-relaxed font-medium line-clamp-2">${p.description}</p>
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
                            <button onclick="initiateSubscription(${p.id}, '${p.price}')" class="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 uppercase tracking-widest">Unlock Access</button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Studio Config
    ui.vidTierSelect.innerHTML = '<option value="0">Select designation...</option>' + 
        state.plans.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

    ui.myPlansList.innerHTML = state.plans.map(p => `
        <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
            <div>
                <h4 class="font-black text-xl text-slate-900 tracking-tight">${p.name}</h4>
                <div class="flex items-center gap-3 mt-2">
                    <span class="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest">${p.duration} Day Cycle</span>
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${p.subscriberCount} Holders</span>
                </div>
            </div>
            <div class="text-right">
                <div class="text-2xl font-black text-indigo-600">${p.price} <span class="text-[10px] uppercase">SUB</span></div>
            </div>
        </div>
    `).join('') || '<p class="text-slate-400 text-center py-10 font-bold">No protocol tiers deployed.</p>';

    // Dashboard Subscriptions
    ui.mySubsGrid.innerHTML = state.subscriptions.map(s => `
        <div class="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-xl transition-all">
            <div>
                <h3 class="text-2xl font-black text-slate-900 tracking-tight">${s.name}</h3>
                <div class="flex items-center mt-2">
                   <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                   <p class="text-[10px] font-black text-green-600 uppercase tracking-widest">Protocol Active</p>
                </div>
            </div>
            <div class="text-right">
                 <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cycle ends in</div>
                 <div class="text-lg font-black text-slate-900">29 Days</div>
            </div>
        </div>
    `).join('') || `
        <div class="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
            <p class="text-slate-400 mb-6 font-bold">No active protocol permissions detected.</p>
            <button onclick="navigateTo('creators')" class="text-indigo-600 font-black hover:underline uppercase text-xs tracking-widest">Initialize Explore</button>
        </div>
    `;

    // Unlocked Library (Dashboard)
    ui.contentGrid.innerHTML = state.videos.map(v => {
        const isLocked = !state.subscriptions.some(s => s.planId === v.planId);
        return `
            <div class="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm relative group ${isLocked ? 'opacity-90' : 'cursor-pointer hover:shadow-2xl transition-all'}" 
                 onclick="${isLocked ? '' : `renderPlayer('${v.youtubeId}')`}">
                <div class="aspect-video bg-slate-200 relative overflow-hidden">
                    <img src="https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                    ${isLocked ? `
                        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-[3px] flex flex-col items-center justify-center text-white p-8 text-center">
                            <svg class="w-10 h-10 mb-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            <div class="font-black text-sm uppercase tracking-[0.2em] mb-2">Locked Asset</div>
                            <div class="text-[10px] font-bold opacity-60">Requires ${state.plans.find(p => p.id === v.planId)?.name} Access</div>
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
                    <p class="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">${v.creator}</p>
                </div>
            </div>
        `;
    }).join('');
}

// --- HANDLERS ---
window.initiateSubscription = async (planId, price) => {
    if (!state.account) return connectWallet();
    
    toggleLoading(true);
    notify("Signing SubHub Protocol Request...");

    setTimeout(() => {
        const plan = state.plans.find(p => p.id === planId);
        state.subscriptions.push({
            planId: plan.id,
            name: plan.name,
            endTime: Date.now() + (30 * 86400 * 1000)
        });

        notify(`Success: ${plan.name} Access Key Generated`);
        refreshUI();
        toggleLoading(false);
    }, 2500);
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

// --- FORMS ---
document.getElementById('plan-form').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('tier-name').value;
    const price = document.getElementById('tier-price').value;
    const duration = document.getElementById('tier-duration').value;

    toggleLoading(true);
    setTimeout(() => {
        state.plans.unshift({
            id: state.plans.length + 1,
            creator: state.account,
            name,
            description: "On-chain subscription deployed via protocol interface.",
            price: parseFloat(price).toFixed(2),
            duration: Number(duration),
            isActive: true,
            subscriberCount: 0
        });

        notify("Tier Designation Deployed Successfully");
        closeModal('plan-modal');
        refreshUI();
        toggleLoading(false);
        e.target.reset();
    }, 1800);
};

document.getElementById('video-form').onsubmit = (e) => {
    e.preventDefault();
    const title = document.getElementById('vid-title').value;
    const url = document.getElementById('vid-url').value;
    const tier = document.getElementById('vid-tier').value;

    if (tier == "0") return notify("Select a tier association", "error");

    toggleLoading(true);
    setTimeout(() => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        const youtubeId = (match && match[2].length === 11) ? match[2] : url;

        state.videos.unshift({
            id: Date.now().toString(),
            title,
            youtubeId,
            planId: Number(tier),
            creator: '0x71C7...8976F'
        });

        notify("Content Published to Protocol Feed");
        closeModal('video-modal');
        refreshUI();
        toggleLoading(false);
        e.target.reset();
    }, 1200);
};

// --- BOOTSTRAP ---
ui.connectBtn.onclick = connectWallet;
navigateTo('home');
refreshUI();