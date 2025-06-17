// Game state management
let gameState = {
    currentRoom: 'welcome',
    completedRooms: [],
    answers: {},
    roomTimes: {},
    gameStartTime: null,
    currentRoomStartTime: null,
    totalGameTime: 0
};

// Timer variables
let timerInterval = null;
let currentTime = 0;

// Timer functions
function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    currentTime = 0;
    gameState.gameStartTime = Date.now();
    gameState.currentRoomStartTime = Date.now();
    
    timerInterval = setInterval(updateTimer, 1000);
    updateTimerDisplay();
}

function updateTimer() {
    currentTime++;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerText = document.getElementById('timer-text');
    const roomIndicator = document.getElementById('room-indicator');
    
    if (timerText) {
        timerText.textContent = `Time: ${timeString}`;
    }
    
    if (roomIndicator) {
        const roomNames = {
            'welcome-screen': 'Welcome',
            'materials-room': 'Materials',
            'labour-room': 'Labour',
            'overhead-room': 'Overhead',
            'sales-room': 'Sales',
            'completion-screen': 'Complete',
            'formula-screen': 'Formulas'
        };
        roomIndicator.textContent = roomNames[gameState.currentRoom] || 'Game';
    }
}

function recordRoomTime(roomId) {
    if (gameState.currentRoomStartTime) {
        const timeSpent = Math.floor((Date.now() - gameState.currentRoomStartTime) / 1000);
        
        // Map screen IDs to room names
        const roomMapping = {
            'materials-room': 'Materials',
            'labour-room': 'Labour',
            'overhead-room': 'Overhead',
            'sales-room': 'Sales'
        };
        
        const roomName = roomMapping[gameState.currentRoom];
        if (roomName) {
            gameState.roomTimes[roomName] = timeSpent;
        }
    }
    
    // Set new room start time
    gameState.currentRoomStartTime = Date.now();
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Record final room time
    recordRoomTime(gameState.currentRoom);
    
    // Calculate total game time
    if (gameState.gameStartTime) {
        gameState.totalGameTime = Math.floor((Date.now() - gameState.gameStartTime) / 1000);
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Variance calculation functions
const calculations = {
    // Materials Room calculations
    materials: {
        priceVariance: (actualPrice, standardPrice, actualQuantity) => {
            return (actualPrice - standardPrice) * actualQuantity;
        },
        usageVariance: (actualQuantity, standardQuantity, standardPrice) => {
            return (actualQuantity - standardQuantity) * standardPrice;
        }
    },
    
    // Labour Room calculations
    labour: {
        rateVariance: (actualRate, standardRate, actualHours) => {
            return (actualRate - standardRate) * actualHours;
        },
        efficiencyVariance: (actualHours, standardHours, standardRate) => {
            return (actualHours - standardHours) * standardRate;
        }
    },
    
    // Overhead Room calculations
    overhead: {
        variableVariance: (actualVariable, standardHours, variableRate) => {
            return actualVariable - (standardHours * variableRate);
        },
        fixedVolumeVariance: (standardHours, budgetedHours, budgetedFixed) => {
            const fixedRate = budgetedFixed / budgetedHours;
            return (standardHours - budgetedHours) * fixedRate;
        }
    },
    
    // Sales Room calculations
    sales: {
        priceVariance: (actualPrice, standardPrice, actualVolume) => {
            return (actualPrice - standardPrice) * actualVolume;
        },
        volumeVariance: (actualVolume, budgetedVolume, standardContribution) => {
            return (actualVolume - budgetedVolume) * standardContribution;
        }
    }
};

// Correct answers for each room
const correctAnswers = {
    materials: {
        priceVariance: { amount: 625, type: 'adverse' },
        usageVariance: { amount: 400, type: 'adverse' },
        totalVariance: { amount: 1025, type: 'adverse' }
    },
    labour: {
        rateVariance: { amount: 680, type: 'favourable' },
        efficiencyVariance: { amount: 750, type: 'adverse' },
        totalVariance: { amount: 70, type: 'adverse' }
    },
    overhead: {
        variableVariance: { amount: 380, type: 'adverse' },
        fixedVariance: { amount: 1200, type: 'adverse' },
        totalVariance: { amount: 1580, type: 'adverse' }
    },
    sales: {
        priceVariance: { amount: 2600, type: 'adverse' },
        volumeVariance: { amount: 900, type: 'favourable' },
        totalVariance: { amount: 1700, type: 'adverse' }
    }
};

// Utility functions
function showScreen(screenId) {
    // Record time for previous room before switching
    if (gameState.currentRoom && gameState.currentRoom !== screenId) {
        recordRoomTime(gameState.currentRoom);
    }
    
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    gameState.currentRoom = screenId;
    
    // Update timer display
    updateTimerDisplay();
    
    // If showing completion screen, stop timer and display results
    if (screenId === 'completion-screen') {
        stopTimer();
        displayTimeResults();
    }
    
    // Scroll to top of page when changing screens
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
    });
}

function displayTimeResults() {
    const timeBreakdown = document.getElementById('time-breakdown');
    const totalTimeDisplay = document.getElementById('total-time-display');
    
    if (!timeBreakdown || !totalTimeDisplay) return;
    
    // Clear existing content
    timeBreakdown.innerHTML = '';
    
    // Display individual room times
    const roomOrder = ['Materials', 'Labour', 'Overhead', 'Sales'];
    const roomIcons = {
        'Materials': '🏭',
        'Labour': '👷',
        'Overhead': '⚙️',
        'Sales': '📊'
    };
    
    roomOrder.forEach(roomName => {
        const timeSpent = gameState.roomTimes[roomName] || 0;
        const timeItem = document.createElement('div');
        timeItem.className = 'time-item';
        timeItem.innerHTML = `
            <div class="room-name">${roomIcons[roomName]} ${roomName} Room</div>
            <div class="time-value">${formatTime(timeSpent)}</div>
        `;
        timeBreakdown.appendChild(timeItem);
    });
    
    // Display total time
    totalTimeDisplay.textContent = formatTime(gameState.totalGameTime);
}

// Game flow functions
function startGame() {
    startTimer();
    showScreen('materials-room');
}

function restartGame() {
    // Stop any running timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    gameState = {
        currentRoom: 'welcome',
        completedRooms: [],
        answers: {},
        roomTimes: {},
        gameStartTime: null,
        currentRoomStartTime: null,
        totalGameTime: 0
    };
    
    currentTime = 0;
    
    // Clear all inputs
    document.querySelectorAll('input, select').forEach(element => {
        element.value = '';
    });
    
    // Hide all feedback
    document.querySelectorAll('.feedback').forEach(feedback => {
        feedback.style.display = 'none';
    });
    
    showScreen('welcome-screen');
}

function showFormulas() {
    showScreen('formula-screen');
}

function hideFormulas() {
    showScreen('completion-screen');
}

function showFeedback(elementId, isCorrect, message) {
    const feedbackElement = document.getElementById(elementId);
    feedbackElement.className = `feedback ${isCorrect ? 'success' : 'error'}`;
    feedbackElement.textContent = message;
    feedbackElement.style.display = 'block';
}

function hideFeedbackOnInput(feedbackId) {
    const feedbackElement = document.getElementById(feedbackId);
    if (feedbackElement && feedbackElement.classList.contains('error')) {
        feedbackElement.style.display = 'none';
    }
}

function addFeedbackListeners(roomInputs, feedbackId) {
    roomInputs.forEach(inputId => {
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
            inputElement.addEventListener('input', () => hideFeedbackOnInput(feedbackId));
            inputElement.addEventListener('change', () => hideFeedbackOnInput(feedbackId));
        }
    });
}

function validateInputs(inputs) {
    for (let input of inputs) {
        if (!input.value || input.value === '' || input.type === '') {
            return false;
        }
    }
    return true;
}

function clearInputs(inputIds) {
    inputIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
        }
    });
}

// Room checking functions
function checkMaterialsRoom() {
    const priceVariance = parseFloat(document.getElementById('material-price-variance').value);
    const priceVarianceType = document.getElementById('material-price-variance-type').value;
    const usageVariance = parseFloat(document.getElementById('material-usage-variance').value);
    const usageVarianceType = document.getElementById('material-usage-variance-type').value;
    const totalVariance = parseFloat(document.getElementById('total-material-variance').value);
    const totalVarianceType = document.getElementById('total-material-variance-type').value;
    
    const inputs = [
        { value: priceVariance, type: priceVarianceType },
        { value: usageVariance, type: usageVarianceType },
        { value: totalVariance, type: totalVarianceType }
    ];
    
    if (!validateInputs(inputs)) {
        showFeedback('materials-feedback', false, 'Please fill in all fields before submitting.');
        return;
    }
    
    const priceCorrect = Math.abs(priceVariance - correctAnswers.materials.priceVariance.amount) < 0.01 
                        && priceVarianceType === correctAnswers.materials.priceVariance.type;
    const usageCorrect = Math.abs(usageVariance - correctAnswers.materials.usageVariance.amount) < 0.01 
                        && usageVarianceType === correctAnswers.materials.usageVariance.type;
    const totalCorrect = Math.abs(totalVariance - correctAnswers.materials.totalVariance.amount) < 0.01 
                        && totalVarianceType === correctAnswers.materials.totalVariance.type;
    
    if (priceCorrect && usageCorrect && totalCorrect) {
        gameState.completedRooms.push('materials');
        gameState.answers.materials = { priceVariance, priceVarianceType, usageVariance, usageVarianceType, totalVariance, totalVarianceType };
        showFeedback('materials-feedback', true, '🎉 Correct! The Materials Room is unlocked. Moving to Labour Room...');
        
        setTimeout(() => {
            showScreen('labour-room');
        }, 2000);
    } else {
        let errorMessage = 'Incorrect answers. ';
        if (!priceCorrect) errorMessage += 'Check your Material Price Variance calculation. ';
        if (!usageCorrect) errorMessage += 'Check your Material Usage Variance calculation. ';
        if (!totalCorrect) errorMessage += 'Check your Total Material Variance calculation. ';
        errorMessage += 'Remember: Total Variance = Price Variance + Usage Variance (considering adverse/favourable signs)';
        
        showFeedback('materials-feedback', false, errorMessage);
    }
}

function checkLabourRoom() {
    const rateVariance = parseFloat(document.getElementById('labour-rate-variance').value);
    const rateVarianceType = document.getElementById('labour-rate-variance-type').value;
    const efficiencyVariance = parseFloat(document.getElementById('labour-efficiency-variance').value);
    const efficiencyVarianceType = document.getElementById('labour-efficiency-variance-type').value;
    const totalVariance = parseFloat(document.getElementById('total-labour-variance').value);
    const totalVarianceType = document.getElementById('total-labour-variance-type').value;
    
    const inputs = [
        { value: rateVariance, type: rateVarianceType },
        { value: efficiencyVariance, type: efficiencyVarianceType },
        { value: totalVariance, type: totalVarianceType }
    ];
    
    if (!validateInputs(inputs)) {
        showFeedback('labour-feedback', false, 'Please fill in all fields before submitting.');
        return;
    }
    
    const rateCorrect = Math.abs(rateVariance - correctAnswers.labour.rateVariance.amount) < 0.01 
                       && rateVarianceType === correctAnswers.labour.rateVariance.type;
    const efficiencyCorrect = Math.abs(efficiencyVariance - correctAnswers.labour.efficiencyVariance.amount) < 0.01 
                             && efficiencyVarianceType === correctAnswers.labour.efficiencyVariance.type;
    const totalCorrect = Math.abs(totalVariance - correctAnswers.labour.totalVariance.amount) < 0.01 
                        && totalVarianceType === correctAnswers.labour.totalVariance.type;
    
    if (rateCorrect && efficiencyCorrect && totalCorrect) {
        gameState.completedRooms.push('labour');
        gameState.answers.labour = { rateVariance, rateVarianceType, efficiencyVariance, efficiencyVarianceType, totalVariance, totalVarianceType };
        showFeedback('labour-feedback', true, '🎉 Correct! The Labour Room is unlocked. Moving to Overhead Room...');
        
        setTimeout(() => {
            showScreen('overhead-room');
        }, 2000);
    } else {
        let errorMessage = 'Incorrect answers. ';
        if (!rateCorrect) errorMessage += 'Check your Labour Rate Variance calculation. ';
        if (!efficiencyCorrect) errorMessage += 'Check your Labour Efficiency Variance calculation. ';
        if (!totalCorrect) errorMessage += 'Check your Total Labour Variance calculation. ';
        errorMessage += 'Remember: Total Variance = Rate Variance - Efficiency Variance (considering adverse/favourable signs)';
        
        showFeedback('labour-feedback', false, errorMessage);
    }
}

function checkOverheadRoom() {
    const variableVariance = parseFloat(document.getElementById('variable-overhead-variance').value);
    const variableVarianceType = document.getElementById('variable-overhead-variance-type').value;
    const fixedVariance = parseFloat(document.getElementById('fixed-overhead-variance').value);
    const fixedVarianceType = document.getElementById('fixed-overhead-variance-type').value;
    const totalVariance = parseFloat(document.getElementById('total-overhead-variance').value);
    const totalVarianceType = document.getElementById('total-overhead-variance-type').value;
    
    const inputs = [
        { value: variableVariance, type: variableVarianceType },
        { value: fixedVariance, type: fixedVarianceType },
        { value: totalVariance, type: totalVarianceType }
    ];
    
    if (!validateInputs(inputs)) {
        showFeedback('overhead-feedback', false, 'Please fill in all fields before submitting.');
        return;
    }
    
    const variableCorrect = Math.abs(variableVariance - correctAnswers.overhead.variableVariance.amount) < 0.01 
                           && variableVarianceType === correctAnswers.overhead.variableVariance.type;
    const fixedCorrect = Math.abs(fixedVariance - correctAnswers.overhead.fixedVariance.amount) < 0.01 
                        && fixedVarianceType === correctAnswers.overhead.fixedVariance.type;
    const totalCorrect = Math.abs(totalVariance - correctAnswers.overhead.totalVariance.amount) < 0.01 
                        && totalVarianceType === correctAnswers.overhead.totalVariance.type;
    
    if (variableCorrect && fixedCorrect && totalCorrect) {
        gameState.completedRooms.push('overhead');
        gameState.answers.overhead = { variableVariance, variableVarianceType, fixedVariance, fixedVarianceType, totalVariance, totalVarianceType };
        showFeedback('overhead-feedback', true, '🎉 Correct! The Overhead Room is unlocked. Moving to Sales Room...');
        
        setTimeout(() => {
            showScreen('sales-room');
        }, 2000);
    } else {
        let errorMessage = 'Incorrect answers. ';
        if (!variableCorrect) errorMessage += 'Check your Variable Overhead Variance calculation. ';
        if (!fixedCorrect) errorMessage += 'Check your Fixed Overhead Volume Variance calculation. ';
        if (!totalCorrect) errorMessage += 'Check your Total Overhead Variance calculation. ';
        errorMessage += 'Remember: Total Variance = Variable Variance + Fixed Variance (considering adverse/favourable signs)';
        
        showFeedback('overhead-feedback', false, errorMessage);
    }
}

function checkSalesRoom() {
    const priceVariance = parseFloat(document.getElementById('sales-price-variance').value);
    const priceVarianceType = document.getElementById('sales-price-variance-type').value;
    const volumeVariance = parseFloat(document.getElementById('sales-volume-variance').value);
    const volumeVarianceType = document.getElementById('sales-volume-variance-type').value;
    const totalVariance = parseFloat(document.getElementById('total-sales-variance').value);
    const totalVarianceType = document.getElementById('total-sales-variance-type').value;
    
    const inputs = [
        { value: priceVariance, type: priceVarianceType },
        { value: volumeVariance, type: volumeVarianceType },
        { value: totalVariance, type: totalVarianceType }
    ];
    
    if (!validateInputs(inputs)) {
        showFeedback('sales-feedback', false, 'Please fill in all fields before submitting.');
        return;
    }
    
    const priceCorrect = Math.abs(priceVariance - correctAnswers.sales.priceVariance.amount) < 0.01 
                        && priceVarianceType === correctAnswers.sales.priceVariance.type;
    const volumeCorrect = Math.abs(volumeVariance - correctAnswers.sales.volumeVariance.amount) < 0.01 
                         && volumeVarianceType === correctAnswers.sales.volumeVariance.type;
    const totalCorrect = Math.abs(totalVariance - correctAnswers.sales.totalVariance.amount) < 0.01 
                        && totalVarianceType === correctAnswers.sales.totalVariance.type;
    
    if (priceCorrect && volumeCorrect && totalCorrect) {
        gameState.completedRooms.push('sales');
        gameState.answers.sales = { priceVariance, priceVarianceType, volumeVariance, volumeVarianceType, totalVariance, totalVarianceType };
        showFeedback('sales-feedback', true, '🎉 Congratulations! You have escaped the Variance Vault! Redirecting to completion screen...');
        
        setTimeout(() => {
            showScreen('completion-screen');
        }, 2000);
    } else {
        let errorMessage = 'Incorrect answers. ';
        if (!priceCorrect) errorMessage += 'Check your Sales Price Variance calculation. ';
        if (!volumeCorrect) errorMessage += 'Check your Sales Volume Contribution Variance calculation. ';
        if (!totalCorrect) errorMessage += 'Check your Total Sales Variance calculation. ';
        errorMessage += 'Remember: Total Variance = Price Variance + Volume Variance (considering adverse/favourable signs)';
        
        showFeedback('sales-feedback', false, errorMessage);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', function() {
    showScreen('welcome-screen');
    
    addFeedbackListeners([
        'material-price-variance', 'material-price-variance-type', 
        'material-usage-variance', 'material-usage-variance-type',
        'total-material-variance', 'total-material-variance-type'
    ], 'materials-feedback');
    
    addFeedbackListeners([
        'labour-rate-variance', 'labour-rate-variance-type', 
        'labour-efficiency-variance', 'labour-efficiency-variance-type',
        'total-labour-variance', 'total-labour-variance-type'
    ], 'labour-feedback');
    
    addFeedbackListeners([
        'variable-overhead-variance', 'variable-overhead-variance-type', 
        'fixed-overhead-variance', 'fixed-overhead-variance-type',
        'total-overhead-variance', 'total-overhead-variance-type'
    ], 'overhead-feedback');
    
    addFeedbackListeners([
        'sales-price-variance', 'sales-price-variance-type', 
        'sales-volume-variance', 'sales-volume-variance-type',
        'total-sales-variance', 'total-sales-variance-type'
    ], 'sales-feedback');
    
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const currentScreen = document.querySelector('.screen.active');
            const submitButton = currentScreen.querySelector('.primary-btn');
            if (submitButton && submitButton.onclick) {
                submitButton.click();
            }
        }
    });
    
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', function() {
            if (this.value < 0) {
                this.style.borderColor = '#FF3B30';
            } else {
                this.style.borderColor = '#D1D1D6';
            }
        });
    });
    
    console.log('🔐 Escape the Variance Vault - Game initialized with timer!');
    console.log('Debug mode - Correct answers:', correctAnswers);
});