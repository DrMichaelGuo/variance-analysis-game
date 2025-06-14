// Game state management
let gameState = {
    currentRoom: 'welcome',
    completedRooms: [],
    answers: {}
};

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
        usageVariance: { amount: 400, type: 'adverse' }
    },
    labour: {
        rateVariance: { amount: 680, type: 'favourable' },
        efficiencyVariance: { amount: 750, type: 'adverse' }
    },
    overhead: {
        variableVariance: { amount: 380, type: 'adverse' },
        fixedVariance: { amount: 1200, type: 'adverse' }
    },
    sales: {
        priceVariance: { amount: 2600, type: 'adverse' },
        volumeVariance: { amount: 900, type: 'favourable' }
    }
};

// Utility functions
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    gameState.currentRoom = screenId;
    
    // Scroll to top of page when changing screens
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
    });
}

function showFeedback(elementId, isCorrect, message) {
    const feedbackElement = document.getElementById(elementId);
    feedbackElement.className = `feedback ${isCorrect ? 'success' : 'error'}`;
    feedbackElement.textContent = message;
    feedbackElement.style.display = 'block';
    
    // Keep success feedback visible, but don't auto-hide error feedback anymore
    // Error feedback will be hidden when user starts typing
}

// Function to hide feedback when user starts typing
function hideFeedbackOnInput(feedbackId) {
    const feedbackElement = document.getElementById(feedbackId);
    if (feedbackElement && feedbackElement.classList.contains('error')) {
        feedbackElement.style.display = 'none';
    }
}

// Function to add input listeners for hiding feedback
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

// Game flow functions
function startGame() {
    showScreen('materials-room');
}

function restartGame() {
    gameState = {
        currentRoom: 'welcome',
        completedRooms: [],
        answers: {}
    };
    
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

// Room checking functions
function checkMaterialsRoom() {
    const priceVariance = parseFloat(document.getElementById('material-price-variance').value);
    const priceVarianceType = document.getElementById('material-price-variance-type').value;
    const usageVariance = parseFloat(document.getElementById('material-usage-variance').value);
    const usageVarianceType = document.getElementById('material-usage-variance-type').value;
    
    // Validate inputs
    const inputs = [
        { value: priceVariance, type: priceVarianceType },
        { value: usageVariance, type: usageVarianceType }
    ];
    
    if (!validateInputs(inputs)) {
        showFeedback('materials-feedback', false, 'Please fill in all fields before submitting.');
        return;
    }
    
    // Check answers
    const priceCorrect = Math.abs(priceVariance - correctAnswers.materials.priceVariance.amount) < 0.01 
                        && priceVarianceType === correctAnswers.materials.priceVariance.type;
    const usageCorrect = Math.abs(usageVariance - correctAnswers.materials.usageVariance.amount) < 0.01 
                        && usageVarianceType === correctAnswers.materials.usageVariance.type;
    
    if (priceCorrect && usageCorrect) {
        gameState.completedRooms.push('materials');
        gameState.answers.materials = { priceVariance, priceVarianceType, usageVariance, usageVarianceType };
        showFeedback('materials-feedback', true, '🎉 Correct! The Materials Room is unlocked. Moving to Labour Room...');
        
        setTimeout(() => {
            showScreen('labour-room');
        }, 2000);
    } else {
        let errorMessage = 'Incorrect answers. ';
        if (!priceCorrect) errorMessage += 'Check your Material Price Variance calculation. ';
        if (!usageCorrect) errorMessage += 'Check your Material Usage Variance calculation. ';
        errorMessage += 'Remember: Price Variance = (Actual Price - Standard Price) × Actual Quantity, Usage Variance = (Actual Quantity - Standard Quantity) × Standard Price';
        
        showFeedback('materials-feedback', false, errorMessage);
    }
}

function checkLabourRoom() {
    const rateVariance = parseFloat(document.getElementById('labour-rate-variance').value);
    const rateVarianceType = document.getElementById('labour-rate-variance-type').value;
    const efficiencyVariance = parseFloat(document.getElementById('labour-efficiency-variance').value);
    const efficiencyVarianceType = document.getElementById('labour-efficiency-variance-type').value;
    
    // Validate inputs
    const inputs = [
        { value: rateVariance, type: rateVarianceType },
        { value: efficiencyVariance, type: efficiencyVarianceType }
    ];
    
    if (!validateInputs(inputs)) {
        showFeedback('labour-feedback', false, 'Please fill in all fields before submitting.');
        return;
    }
    
    // Check answers
    const rateCorrect = Math.abs(rateVariance - correctAnswers.labour.rateVariance.amount) < 0.01 
                       && rateVarianceType === correctAnswers.labour.rateVariance.type;
    const efficiencyCorrect = Math.abs(efficiencyVariance - correctAnswers.labour.efficiencyVariance.amount) < 0.01 
                             && efficiencyVarianceType === correctAnswers.labour.efficiencyVariance.type;
    
    if (rateCorrect && efficiencyCorrect) {
        gameState.completedRooms.push('labour');
        gameState.answers.labour = { rateVariance, rateVarianceType, efficiencyVariance, efficiencyVarianceType };
        showFeedback('labour-feedback', true, '🎉 Correct! The Labour Room is unlocked. Moving to Overhead Room...');
        
        setTimeout(() => {
            showScreen('overhead-room');
        }, 2000);
    } else {
        let errorMessage = 'Incorrect answers. ';
        if (!rateCorrect) errorMessage += 'Check your Labour Rate Variance calculation. ';
        if (!efficiencyCorrect) errorMessage += 'Check your Labour Efficiency Variance calculation. ';
        errorMessage += 'Remember: Rate Variance = (Actual Rate - Standard Rate) × Actual Hours, Efficiency Variance = (Actual Hours - Standard Hours) × Standard Rate';
        
        showFeedback('labour-feedback', false, errorMessage);
    }
}

function checkOverheadRoom() {
    const variableVariance = parseFloat(document.getElementById('variable-overhead-variance').value);
    const variableVarianceType = document.getElementById('variable-overhead-variance-type').value;
    const fixedVariance = parseFloat(document.getElementById('fixed-overhead-variance').value);
    const fixedVarianceType = document.getElementById('fixed-overhead-variance-type').value;
    
    // Validate inputs
    const inputs = [
        { value: variableVariance, type: variableVarianceType },
        { value: fixedVariance, type: fixedVarianceType }
    ];
    
    if (!validateInputs(inputs)) {
        showFeedback('overhead-feedback', false, 'Please fill in all fields before submitting.');
        return;
    }
    
    // Check answers
    const variableCorrect = Math.abs(variableVariance - correctAnswers.overhead.variableVariance.amount) < 0.01 
                           && variableVarianceType === correctAnswers.overhead.variableVariance.type;
    const fixedCorrect = Math.abs(fixedVariance - correctAnswers.overhead.fixedVariance.amount) < 0.01 
                        && fixedVarianceType === correctAnswers.overhead.fixedVariance.type;
    
    if (variableCorrect && fixedCorrect) {
        gameState.completedRooms.push('overhead');
        gameState.answers.overhead = { variableVariance, variableVarianceType, fixedVariance, fixedVarianceType };
        showFeedback('overhead-feedback', true, '🎉 Correct! The Overhead Room is unlocked. Moving to Sales Room...');
        
        setTimeout(() => {
            showScreen('sales-room');
        }, 2000);
    } else {
        let errorMessage = 'Incorrect answers. ';
        if (!variableCorrect) errorMessage += 'Check your Variable Overhead Variance calculation. ';
        if (!fixedCorrect) errorMessage += 'Check your Fixed Overhead Volume Variance calculation. ';
        errorMessage += 'Hint: Calculate the fixed overhead absorption rate first (£24,000 ÷ 2,000 hours = £12 per hour)';
        
        showFeedback('overhead-feedback', false, errorMessage);
    }
}

function checkSalesRoom() {
    const priceVariance = parseFloat(document.getElementById('sales-price-variance').value);
    const priceVarianceType = document.getElementById('sales-price-variance-type').value;
    const volumeVariance = parseFloat(document.getElementById('sales-volume-variance').value);
    const volumeVarianceType = document.getElementById('sales-volume-variance-type').value;
    
    // Validate inputs
    const inputs = [
        { value: priceVariance, type: priceVarianceType },
        { value: volumeVariance, type: volumeVarianceType }
    ];
    
    if (!validateInputs(inputs)) {
        showFeedback('sales-feedback', false, 'Please fill in all fields before submitting.');
        return;
    }
    
    // Check answers
    const priceCorrect = Math.abs(priceVariance - correctAnswers.sales.priceVariance.amount) < 0.01 
                        && priceVarianceType === correctAnswers.sales.priceVariance.type;
    const volumeCorrect = Math.abs(volumeVariance - correctAnswers.sales.volumeVariance.amount) < 0.01 
                         && volumeVarianceType === correctAnswers.sales.volumeVariance.type;
    
    if (priceCorrect && volumeCorrect) {
        gameState.completedRooms.push('sales');
        gameState.answers.sales = { priceVariance, priceVarianceType, volumeVariance, volumeVarianceType };
        showFeedback('sales-feedback', true, '🎉 Congratulations! You have escaped the Variance Vault! Redirecting to completion screen...');
        
        setTimeout(() => {
            showScreen('completion-screen');
        }, 2000);
    } else {
        let errorMessage = 'Incorrect answers. ';
        if (!priceCorrect) errorMessage += 'Check your Sales Price Variance calculation. ';
        if (!volumeCorrect) errorMessage += 'Check your Sales Volume Contribution Variance calculation. ';
        errorMessage += 'Remember: Sales Price Variance = (Actual Price - Standard Price) × Actual Volume, Sales Volume Variance = (Actual Volume - Budgeted Volume) × Standard Contribution';
        
        showFeedback('sales-feedback', false, errorMessage);
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Set initial screen
    showScreen('welcome-screen');
    
    // Set up feedback listeners for each room
    addFeedbackListeners([
        'material-price-variance', 
        'material-price-variance-type', 
        'material-usage-variance', 
        'material-usage-variance-type'
    ], 'materials-feedback');
    
    addFeedbackListeners([
        'labour-rate-variance', 
        'labour-rate-variance-type', 
        'labour-efficiency-variance', 
        'labour-efficiency-variance-type'
    ], 'labour-feedback');
    
    addFeedbackListeners([
        'variable-overhead-variance', 
        'variable-overhead-variance-type', 
        'fixed-overhead-variance', 
        'fixed-overhead-variance-type'
    ], 'overhead-feedback');
    
    addFeedbackListeners([
        'sales-price-variance', 
        'sales-price-variance-type', 
        'sales-volume-variance', 
        'sales-volume-variance-type'
    ], 'sales-feedback');
    
    // Add keyboard support for Enter key
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const currentScreen = document.querySelector('.screen.active');
            const submitButton = currentScreen.querySelector('.primary-btn');
            if (submitButton && submitButton.onclick) {
                submitButton.click();
            }
        }
    });
    
    // Add input validation feedback
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', function() {
            if (this.value < 0) {
                this.style.borderColor = '#FF3B30';
            } else {
                this.style.borderColor = '#D1D1D6';
            }
        });
    });
    
    console.log('🔐 Escape the Variance Vault - Game initialized!');
    console.log('Debug mode - Correct answers:', correctAnswers);
});