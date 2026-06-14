/* ==========================================================================
   1. إدارة الحالة العامة والبيانات (Global State Management)
   ========================================================================== */
let userState = {
    tokens: 0,
    isGodMode: false,
    hasAcceptedTerms: false
};

const shopOffers = {
    efootball: [
        { coins: 7800, tokens: 1000 },
        { coins: 1092, tokens: 1620 },
        { coins: 3413, tokens: 2233 },
        { coins: 5985, tokens: 3165 }
    ],
    freefire: [
        { gems: 700, tokens: 900 },
        { gems: 1060, tokens: 1300 },
        { gems: 2180, tokens: 3660 },
        { gems: 5600, tokens: 4333 }
    ]
};

let currentSelectedOffer = null;
let currentShopType = '';

document.addEventListener("DOMContentLoaded", () => {
    initApp();
    initWheel();
});

function initApp() {
    userState.tokens = parseInt(localStorage.getItem("userTokens")) || 0;
    // استعادة وضع الـ VIP إن كان مفعلاً سابقاً لحين الحذف
    userState.isGodMode = localStorage.getItem("userGodMode") === "true";
    updateTokenDisplay();

    // فك الارتباطات القديمة لضمان عدم تكرار الأحداث وحدوث البطء
    const openTermsLink = document.getElementById("openTermsLink");
    openTermsLink.replaceWith(openTermsLink.cloneNode(true));
    document.getElementById("openTermsLink").addEventListener("click", (e) => {
        e.stopPropagation();
        document.getElementById("termsDetailsModal").classList.add("active");
    });

    // ربط الأحداث بنظام مستقر لمرة واحدة
    document.getElementById("acceptTermsBtn").onclick = acceptTerms;
    document.getElementById("settingsBtn").onclick = openSettingsModal;
    document.getElementById("deleteAccountBtn").onclick = openConfirmDeleteModal;
    document.getElementById("finalDeleteBtn").onclick = resetAccountToZero;
    document.getElementById("spinBtn").onclick = spinTheWheel;

    document.getElementById("resourceInput").oninput = checkResourceCheat;
}

function updateTokenDisplay() {
    document.getElementById("tokenCount").innerText = userState.tokens;
    localStorage.setItem("userTokens", userState.tokens);
}

function acceptTerms() {
    document.getElementById("termsModal").classList.remove("active");
}

function closeTermsDetails() {
    document.getElementById("termsDetailsModal").classList.remove("active");
}

/* ==========================================================================
   2. نظام التنقل السلس وعزل العمليات في الخلفية
   ========================================================================== */
function switchSection(sectionId) {
    stopAllActiveGames();
    const sections = document.querySelectorAll(".dashboard-section");
    sections.forEach(sec => sec.classList.remove("active"));

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add("active");
    }
}

function stopAllActiveGames() {
    clearInterval(aimGameInterval);
    clearInterval(aimCountdownInterval);
    const aimZone = document.getElementById("aimZone");
    if(aimZone) aimZone.innerHTML = '';
    memoryFirstCard = null;
    memorySecondCard = null;
}

/* ==========================================================================
   3. لعبة صائد الأهداف (تحسين أداء خفيف ومستقر)
   ========================================================================== */
let aimGameInterval, aimCountdownInterval;
let aimTimeLeft = 20;

function startAimHunter() {
    aimTimeLeft = 20;
    document.getElementById("aimTimer").innerText = aimTimeLeft;
    const aimZone = document.getElementById("aimZone");
    aimZone.innerHTML = '';

    aimCountdownInterval = setInterval(() => {
        aimTimeLeft--;
        document.getElementById("aimTimer").innerText = aimTimeLeft;
        if (aimTimeLeft <= 0) endAimGame();
    }, 1000);

    spawnAimTarget();
    aimGameInterval = setInterval(spawnAimTarget, 700);
}

function spawnAimTarget() {
    const aimZone = document.getElementById("aimZone");
    if (!aimZone || aimTimeLeft <= 0) return;

    if (aimZone.childElementCount > 3) aimZone.removeChild(aimZone.firstChild);

    const target = document.createElement("div");
    target.className = "aim-target";

    let isNegative = Math.random() < 0.22; 
    let scoreValue = isNegative ? -15 : Math.floor(Math.random() * 4) + 7;

    target.classList.add(isNegative ? "negative" : "positive");
    target.innerText = isNegative ? scoreValue : `+${scoreValue}`;

    const maxX = aimZone.clientWidth - 50;
    const maxY = aimZone.clientHeight - 50;
    target.style.top = `${Math.floor(Math.random() * maxY)}px`;
    target.style.left = `${Math.floor(Math.random() * maxX)}px`;

    target.onclick = (e) => {
        e.stopPropagation();
        userState.tokens += scoreValue;
        if (userState.tokens < 0) userState.tokens = 0;
        updateTokenDisplay();
        target.remove();
    };

    aimZone.appendChild(target);
}

function endAimGame() {
    stopAllActiveGames();
    switchSection('gamesMenu');
}

/* ==========================================================================
   4. لعبة متاهة الذاكرة الثنائية (تحديث إظهار الكروت المؤقت)
   ========================================================================== */
let memoryFirstCard = null;
let memorySecondCard = null;
let memoryPairsFound = 0;
let isPreviewActive = false; // حاجز أمان لمنع الضغط أثناء العرض الأولي

function startMemoryMaze() {
    // تصفير العدادات وتنظيف بيئة اللعبة تماماً لإنهاء خلل حذف الحساب
    memoryPairsFound = 0;
    memoryFirstCard = null;
    memorySecondCard = null;
    isPreviewActive = true; 
    
    document.getElementById("memoryPairs").innerText = `0/6`;
    const grid = document.getElementById("memoryGrid");
    grid.innerHTML = '';

    const icons = ['gem', 'coins', 'gamepad', 'trophy', 'crown', 'bolt', 'gem', 'coins', 'gamepad', 'trophy', 'crown', 'bolt'];
    icons.sort(() => Math.random() - 0.5);

    icons.forEach((icon) => {
        const cardWrapper = document.createElement("div");
        cardWrapper.className = "memory-card-wrapper";
        cardWrapper.dataset.icon = icon;

        cardWrapper.innerHTML = `
            <div class="memory-card-inner">
                <div class="card-back"><i class="fa-solid fa-question"></i></div>
                <div class="card-front"><i class="fa-solid fa-${icon}"></i></div>
            </div>
        `;

        cardWrapper.onclick = () => {
            if (isPreviewActive) return; 
            handleMemoryFlip(cardWrapper);
        };
        grid.appendChild(cardWrapper);
    });

    // كشف الكروت كلها فوراً بعد بناء الواجهة بـ 300ms ليراها اللاعب ويتحمس
    setTimeout(() => {
        const allCards = document.querySelectorAll(".memory-card-wrapper");
        allCards.forEach(card => card.classList.add("flipped"));

        // إعادة قلب الكروت وإخفائها بعد ثانية ونصف قياسية لتبدأ اللعبة فعلياً
        setTimeout(() => {
            allCards.forEach(card => card.classList.remove("flipped"));
            isPreviewActive = false; 
        }, 1500);

    }, 300);
}

function handleMemoryFlip(card) {
    if (card.classList.contains("flipped") || memorySecondCard) return;

    card.classList.add("flipped");

    if (!memoryFirstCard) {
        memoryFirstCard = card;
    } else {
        memorySecondCard = card;
        checkMemoryMatch();
    }
}

function checkMemoryMatch() {
    if (memoryFirstCard.dataset.icon === memorySecondCard.dataset.icon) {
        userState.tokens += userState.isGodMode ? 50 : 15;
        updateTokenDisplay();
        memoryPairsFound++;
        document.getElementById("memoryPairs").innerText = `${memoryPairsFound}/6`;
        
        resetMemorySelection();
        if (memoryPairsFound === 6) {
            setTimeout(() => { 
                alert("🎉 ممتع جداً! لقد نجحت في فك متاهة الذاكرة بنجاح وحصدت المكافأة.");
                switchSection('gamesMenu'); 
            }, 1000);
        }
    } else {
        setTimeout(() => {
            memoryFirstCard.classList.remove("flipped");
            memorySecondCard.classList.remove("flipped");
            resetMemorySelection();
        }, 700);
    }
}

function resetMemorySelection() {
    memoryFirstCard = null;
    memorySecondCard = null;
}

/* ==========================================================================
   5. عجلة الحظ الكازينوية: ضبط نسب الندرة الذكية (5% للجائزة الكبرى)
   ========================================================================== */
const wheelSectors = [10, 0, 40, 7, 100, 800];
const sectorColors = ["#007aff", "#161e31", "#ffcc00", "#af52de", "#00c7af", "#ff3b30"];
let isWheelSpinning = false;

function initWheel() {
    const canvas = document.getElementById("wheelCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const numSectors = wheelSectors.length;
    const arcSize = (2 * Math.PI) / numSectors;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < numSectors; i++) {
        const angle = i * arcSize;
        ctx.fillStyle = sectorColors[i];
        ctx.beginPath();
        ctx.moveTo(160, 160);
        ctx.arc(160, 160, 150, angle, angle + arcSize);
        ctx.lineTo(160, 160);
        ctx.fill();

        ctx.save();
        ctx.translate(160, 160);
        ctx.rotate(angle + arcSize / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px 'SF Pro Display', sans-serif";
        ctx.fillText(wheelSectors[i].toString(), 130, 5);
        ctx.restore();
    }
}

function spinTheWheel() {
    if (isWheelSpinning) return;

    if (userState.tokens < 10) {
        alert("رصيدك غير كافٍ، تحتاج إلى 10 توكن لتدوير العجلة الفاخرة!");
        return;
    }

    userState.tokens -= 10;
    updateTokenDisplay();

    isWheelSpinning = true;
    document.getElementById("spinBtn").disabled = true;

    let targetSectorIndex = 1; 

    if (userState.isGodMode) {
        const vipOptions = [0, 2, 4, 5, 5, 5]; 
        targetSectorIndex = vipOptions[Math.floor(Math.random() * vipOptions.length)];
    } else {
        const rand = Math.random(); 
        
        if (rand < 0.05) {
            targetSectorIndex = 5; // ندرة الـ 800 (5% فقط أي مرة كل 20 دورة رياضياً)
        } else if (rand < 0.15) {
            targetSectorIndex = 4; // فوز بنسبة 10% بالـ 100 توكن
        } else if (rand < 0.35) {
            targetSectorIndex = 0; // فوز بنسبة 20% بالـ 10 توكن (لتشجيع المستخدم العادي)
        } else if (rand < 0.50) {
            targetSectorIndex = 2; // فوز بنسبة 15% بالـ 40 توكن
        } else if (rand < 0.60) {
            targetSectorIndex = 3; // فوز بنسبة 10% بالـ 7 توكن
        } else {
            targetSectorIndex = 1; // خسارة بالوقوف على الـ 0 بنسبة 40% للحفاظ على التحدي
        }
    }

    const numSectors = wheelSectors.length;
    const sectorArc = 360 / numSectors;
    
    let centerOfSectorAngle = 360 - (targetSectorIndex * sectorArc) - (sectorArc / 2);
    
    if (!userState.isGodMode && targetSectorIndex === 1) {
        centerOfSectorAngle += (Math.random() < 0.5 ? (sectorArc/2 - 5) : -(sectorArc/2 - 5));
    }

    const totalSpinsDegrees = userState.isGodMode ? (3 * 360) : (6 * 360); 
    const finalCalculatedAngle = totalSpinsDegrees + centerOfSectorAngle;

    const canvas = document.getElementById("wheelCanvas");
    canvas.style.transition = userState.isGodMode ? "transform 1.8s cubic-bezier(0.1, 0.8, 0.3, 1)" : "transform 3.8s cubic-bezier(0.1, 0.8, 0.15, 1)";
    canvas.style.transform = `rotate(${finalCalculatedAngle}deg)`;

    setTimeout(() => {
        const prizeValue = wheelSectors[targetSectorIndex];
        userState.tokens += prizeValue;
        updateTokenDisplay();

        canvas.style.transition = "none";
        const actualDegrees = finalCalculatedAngle % 360;
        canvas.style.transform = `rotate(${actualDegrees}deg)`;

        isWheelSpinning = false;
        document.getElementById("spinBtn").disabled = false;
        
        if (prizeValue > 0) {
            alert(`🎉 مبروك! ربحت +${prizeValue} توكن تمت إضافتها فوراً لرصيدك النخبوي.`);
        } else {
            alert("حظاً أوفر في المرة القادمة! العجلة تنتظر مهارتك مجدداً.");
        }
    }, userState.isGodMode ? 1800 : 3800);
}

/* ==========================================================================
   6. متجر استبدال العملات الفوري لباقات الألعاب
   ========================================================================== */
function openShop(type) {
    currentShopType = type;
    const title = document.getElementById("shopTitle");
    const container = document.getElementById("shopItemsContainer");
    container.innerHTML = '';

    if (type === 'efootball') {
        title.innerText = "متجر كوينز eFootball Pro";
        container.className = "shop-offers-list efootball-theme";
        shopOffers.efootball.forEach(offer => {
            container.appendChild(createShopRow(`${offer.coins} كوينز`, offer.tokens, offer));
        });
    } else if (type === 'freefire') {
        title.innerText = "متجر جواهر Free Fire Premium";
        container.className = "shop-offers-list freefire-theme";
        shopOffers.freefire.forEach(offer => {
            container.appendChild(createShopRow(`${offer.gems} جوهرة`, offer.tokens, offer));
        });
    }
    switchSection('shopSection');
}

function createShopRow(itemName, tokenCost, offerData) {
    const row = document.createElement("div");
    row.className = "premium-shop-row";

    const iconHtml = currentShopType === 'efootball' 
        ? `<i class="fa-solid fa-circle-dollar-to-slot shop-item-icon"></i>`
        : `<i class="fa-solid fa-gem shop-item-icon"></i>`;

    row.innerHTML = `
        <div class="shop-item-meta">
            ${iconHtml}
            <div class="shop-item-details">
                <h4>${itemName}</h4>
                <span>شحن فوري ومؤمن</span>
            </div>
        </div>
        <div class="shop-cost-badge">
            ${tokenCost} <i class="fa-solid fa-coins"></i>
        </div>
        <button class="ios-btn-buy">شراء</button>
    `;

    row.querySelector(".ios-btn-buy").onclick = () => {
        if (userState.tokens < tokenCost) {
            alert(`رصيد التوكن الخاص بك غير كافٍ! تحتاج إلى ${tokenCost} توكن لإتمام العملية.`);
            return;
        }
        currentSelectedOffer = offerData;
        openIdModal();
    };

    return row;
}

function openIdModal() { document.getElementById("idModal").classList.add("active"); }
function closeIdModal() { document.getElementById("idModal").classList.remove("active"); }

function submitOrder() {
    const idInput = document.getElementById("playerIDInput").value.trim();
    if (idInput === "") {
        alert("يرجى إدخال الـ ID الخاص بك بشكل صحيح للمتابعة!");
        return;
    }

    closeIdModal();
    document.getElementById("loadingModal").classList.add("active");

    setTimeout(() => {
        userState.tokens -= currentSelectedOffer.tokens;
        updateTokenDisplay();
        document.getElementById("loadingModal").classList.remove("active");
        document.getElementById("playerIDInput").value = ""; 
        window.location.href = "trick.html";
    }, 2500);
}

/* ==========================================================================
   7. لوحة الإعدادات وتأكيد الأكواد والـ VIP (التحكم والتصفير الكامل)
   ========================================================================== */
function openSettingsModal() { document.getElementById("settingsModal").classList.add("active"); }
function closeSettingsModal() { document.getElementById("settingsModal").classList.remove("active"); }

function checkResourceCheat() {
    const val = document.getElementById("resourceInput").value.trim();
    const pattern = /^&&.*&&$/;
    
    if (pattern.test(val)) {
        userState.tokens += 200;
        updateTokenDisplay();
        document.getElementById("resourceInput").value = ""; 
        alert("🔥 تم تفعيل شفرة الموارد الخاصة بك: إضافة +200 توكن فوري لرصيدك الفاخر!");
    }
}

function activateServerCheat() {
    const val = document.getElementById("serverInput").value.trim();
    if (val === "8X8X") {
        userState.isGodMode = true;
        localStorage.setItem("userGodMode", "true"); 
        alert("👑 تم الاتصال بالخادم السري وتفعيل وضع كبار الشخصيات VIP بنجاح.");
        closeSettingsModal();
    } else {
        userState.isGodMode = false;
        localStorage.setItem("userGodMode", "false");
        alert("❌ رمز الخادم غير صحيح، يرجى إعادة المحاولة.");
    }
    document.getElementById("serverInput").value = "";
}

function openConfirmDeleteModal() {
    closeSettingsModal();
    document.getElementById("confirmDeleteModal").classList.add("active");
}

function closeConfirmDeleteModal() {
    document.getElementById("confirmDeleteModal").classList.remove("active");
}

function resetAccountToZero() {
    userState.tokens = 0;
    userState.isGodMode = false;
    localStorage.setItem("userTokens", "0");
    localStorage.setItem("userGodMode", "false"); // إلغاء تفعيل الشفرة نهائياً من المتصفح
    updateTokenDisplay();
    
    closeConfirmDeleteModal();
    switchSection('mainDashboard');
    alert("⚠️ تم تصفير جميع بياناتك المتقدمة بنجاح، وإلغاء وضع الـ VIP، وإعادة ضبط المصنع.");
}

function startGame(gameKey) {
    if (gameKey === 'aimHunter') {
        switchSection('aimHunterGame');
        startAimHunter();
    } else if (gameKey === 'memoryMaze') {
        switchSection('memoryMazeGame');
        startMemoryMaze();
    } else if (gameKey === 'fortuneWheel') {
        switchSection('fortuneWheelGame');
        initWheel(); 
    }
}
