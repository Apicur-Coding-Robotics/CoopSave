// ==================== Data Storage ====================
// Using localStorage to persist data
const STORAGE_KEYS = {
    MEMBERS: 'coopsave_members',
    LOANS: 'coopsave_loans',
    SAVINGS: 'coopsave_savings'
};

// ==================== Member Management ====================

/**
 * Register a new member
 */
function registerMember(event) {
    event.preventDefault();
    
    const form = document.getElementById('memberForm');
    const formData = new FormData(form);
    
    const member = {
        id: generateId('MEM'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        idNumber: formData.get('idNumber'),
        joinDate: formData.get('joinDate'),
        savings: parseFloat(formData.get('initialDeposit')) || 0,
        status: 'active',
        registrationDate: new Date().toISOString()
    };
    
    // Add to localStorage
    let members = getMembers();
    members.push(member);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    
    // If initial deposit was provided, record it in savings
    if (member.savings > 0) {
        recordSavingTransaction(member.id, member.savings, 'initial', 'Initial deposit');
    }
    
    // Show success message and reset form
    alert(`Member ${member.firstName} ${member.lastName} registered successfully!`);
    form.reset();
    displayMembers();
    updateDashboardStats();
}

/**
 * Get all members from storage
 */
function getMembers() {
    const data = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    return data ? JSON.parse(data) : [];
}

/**
 * Display all members
 */
function displayMembers() {
    const membersList = document.getElementById('membersList');
    if (!membersList) return;
    
    const members = getMembers();
    
    if (members.length === 0) {
        membersList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No members registered yet.</p>';
        return;
    }
    
    membersList.innerHTML = members.map(member => `
        <div class="member-card">
            <h3>${member.firstName} ${member.lastName}</h3>
            <p><strong>ID:</strong> ${member.id}</p>
            <p><strong>Email:</strong> ${member.email}</p>
            <p><strong>Phone:</strong> ${member.phone}</p>
            <p><strong>Member ID:</strong> ${member.idNumber}</p>
            <p><strong>Joined:</strong> ${formatDate(member.joinDate)}</p>
            <p><strong>Current Savings:</strong> $${member.savings.toFixed(2)}</p>
            <span class="member-status ${member.status}">${member.status.toUpperCase()}</span>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button class="btn btn-secondary" onclick="editMember('${member.id}')" style="font-size: 0.85rem; padding: 0.5rem;">Edit</button>
                <button class="btn btn-danger" onclick="deleteMember('${member.id}')" style="font-size: 0.85rem; padding: 0.5rem;">Delete</button>
            </div>
        </div>
    `).join('');
}

/**
 * Filter members by search term
 */
function filterMembers(searchTerm) {
    const membersList = document.getElementById('membersList');
    if (!membersList) return;
    
    const members = getMembers();
    const filtered = members.filter(member =>
        member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.idNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filtered.length === 0) {
        membersList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No members found.</p>';
        return;
    }
    
    membersList.innerHTML = filtered.map(member => `
        <div class="member-card">
            <h3>${member.firstName} ${member.lastName}</h3>
            <p><strong>ID:</strong> ${member.id}</p>
            <p><strong>Email:</strong> ${member.email}</p>
            <p><strong>Phone:</strong> ${member.phone}</p>
            <p><strong>Member ID:</strong> ${member.idNumber}</p>
            <p><strong>Joined:</strong> ${formatDate(member.joinDate)}</p>
            <p><strong>Current Savings:</strong> $${member.savings.toFixed(2)}</p>
            <span class="member-status ${member.status}">${member.status.toUpperCase()}</span>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button class="btn btn-secondary" onclick="editMember('${member.id}')" style="font-size: 0.85rem; padding: 0.5rem;">Edit</button>
                <button class="btn btn-danger" onclick="deleteMember('${member.id}')" style="font-size: 0.85rem; padding: 0.5rem;">Delete</button>
            </div>
        </div>
    `).join('');
}

/**
 * Delete a member
 */
function deleteMember(memberId) {
    if (confirm('Are you sure you want to delete this member?')) {
        let members = getMembers();
        members = members.filter(m => m.id !== memberId);
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
        displayMembers();
        updateDashboardStats();
    }
}

/**
 * Edit member (placeholder)
 */
function editMember(memberId) {
    alert('Edit functionality coming soon!');
}

/**
 * Populate member select in loan form
 */
function populateMemberSelect() {
    const select = document.getElementById('borrowerId');
    if (!select) return;
    
    const members = getMembers();
    const options = members.map(member =>
        `<option value="${member.id}">${member.firstName} ${member.lastName} (${member.id})</option>`
    ).join('');
    
    select.innerHTML = '<option value="">-- Select Member --</option>' + options;
}

/**
 * Populate member select in savings form
 */
function populateMemberSelectForSavings() {
    const select = document.getElementById('savingsMemberId');
    if (!select) return;
    
    const members = getMembers();
    const options = members.map(member =>
        `<option value="${member.id}">${member.firstName} ${member.lastName} (${member.id})</option>`
    ).join('');
    
    select.innerHTML = '<option value="">-- Select Member --</option>' + options;
}

// ==================== Loan Management ====================

/**
 * Calculate loan interest using simple interest formula
 * Interest = (Principal × Rate × Time) / 100
 * @param {number} principal - Loan amount
 * @param {number} rate - Annual interest rate (%)
 * @param {number} months - Loan term in months
 * @returns {number} Interest amount
 */
function calculateLoanInterest() {
    const amount = parseFloat(document.getElementById('loanAmount')?.value) || 0;
    const rate = parseFloat(document.getElementById('interestRate')?.value) || 0;
    const months = parseFloat(document.getElementById('loanTerm')?.value) || 1;
    
    if (amount <= 0 || rate < 0 || months <= 0) {
        updateLoanCalculator(0, 0, 0, 0);
        return;
    }
    
    // Convert annual rate to monthly rate
    const monthlyRate = rate / 12 / 100;
    
    // Calculate interest using simple interest formula
    // For monthly payments, we use: Interest = Principal × Rate × (Time in years)
    const timeInYears = months / 12;
    const totalInterest = amount * rate * timeInYears / 100;
    
    // Total amount to repay
    const totalRepayment = amount + totalInterest;
    
    // Monthly payment (equal installments)
    const monthlyPayment = totalRepayment / months;
    
    // Update display
    updateLoanCalculator(amount, totalInterest, totalRepayment, monthlyPayment);
    
    return {
        interest: totalInterest,
        total: totalRepayment,
        monthly: monthlyPayment
    };
}

/**
 * Update loan calculator display
 */
function updateLoanCalculator(amount, interest, total, monthly) {
    document.getElementById('displayAmount').textContent = `$${amount.toFixed(2)}`;
    document.getElementById('displayInterest').textContent = `$${interest.toFixed(2)}`;
    document.getElementById('displayTotal').textContent = `$${total.toFixed(2)}`;
    document.getElementById('displayMonthly').textContent = `$${monthly.toFixed(2)}`;
}

/**
 * Apply for a loan
 */
function applyForLoan(event) {
    event.preventDefault();
    
    const form = document.getElementById('loanForm');
    const formData = new FormData(form);
    
    const principal = parseFloat(formData.get('loanAmount'));
    const rate = parseFloat(formData.get('interestRate'));
    const months = parseInt(formData.get('loanTerm'));
    const borrowerId = formData.get('borrowerId');
    const loanDate = formData.get('loanDate');
    
    // Calculate interest
    const timeInYears = months / 12;
    const totalInterest = principal * rate * timeInYears / 100;
    const totalRepayment = principal + totalInterest;
    const monthlyPayment = totalRepayment / months;
    
    // Calculate due date
    const dueDate = new Date(loanDate);
    dueDate.setMonth(dueDate.getMonth() + months);
    
    const loan = {
        id: generateId('LOAN'),
        borrowerId: borrowerId,
        principal: principal,
        interestRate: rate,
        totalInterest: totalInterest,
        totalRepayment: totalRepayment,
        monthlyPayment: monthlyPayment,
        loanTerm: months,
        loanDate: loanDate,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'active',
        amountPaid: 0,
        createdDate: new Date().toISOString()
    };
    
    // Add to localStorage
    let loans = getLoans();
    loans.push(loan);
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
    
    // Update member record
    updateMemberSavings(borrowerId, principal);
    
    alert('Loan application submitted successfully!');
    form.reset();
    displayLoans();
    updateDashboardStats();
}

/**
 * Get all loans
 */
function getLoans() {
    const data = localStorage.getItem(STORAGE_KEYS.LOANS);
    return data ? JSON.parse(data) : [];
}

/**
 * Display all loans
 */
function displayLoans() {
    const loansTable = document.getElementById('loansTable');
    if (!loansTable) return;
    
    const loans = getLoans();
    const members = getMembers();
    
    if (loans.length === 0) {
        loansTable.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999;">No loans yet.</td></tr>';
        return;
    }
    
    loansTable.innerHTML = loans.map(loan => {
        const member = members.find(m => m.id === loan.borrowerId);
        const memberName = member ? `${member.firstName} ${member.lastName}` : 'Unknown';
        
        return `
            <tr>
                <td>${memberName}</td>
                <td>$${loan.principal.toFixed(2)}</td>
                <td>${loan.interestRate.toFixed(1)}%</td>
                <td>$${loan.totalRepayment.toFixed(2)}</td>
                <td>$${loan.monthlyPayment.toFixed(2)}</td>
                <td><span class="status-${loan.status}">${loan.status.toUpperCase()}</span></td>
                <td>${formatDate(loan.loanDate)}</td>
                <td>
                    <button class="btn btn-secondary" onclick="recordPayment('${loan.id}')" style="font-size: 0.8rem; padding: 0.4rem 0.6rem;">Pay</button>
                    <button class="btn btn-danger" onclick="deleteLoan('${loan.id}')" style="font-size: 0.8rem; padding: 0.4rem 0.6rem;">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Filter loans by status
 */
function filterLoans(status) {
    const loansTable = document.getElementById('loansTable');
    if (!loansTable) return;
    
    let loans = getLoans();
    if (status) {
        loans = loans.filter(loan => loan.status === status);
    }
    
    const members = getMembers();
    
    if (loans.length === 0) {
        loansTable.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999;">No loans found.</td></tr>';
        return;
    }
    
    loansTable.innerHTML = loans.map(loan => {
        const member = members.find(m => m.id === loan.borrowerId);
        const memberName = member ? `${member.firstName} ${member.lastName}` : 'Unknown';
        
        return `
            <tr>
                <td>${memberName}</td>
                <td>$${loan.principal.toFixed(2)}</td>
                <td>${loan.interestRate.toFixed(1)}%</td>
                <td>$${loan.totalRepayment.toFixed(2)}</td>
                <td>$${loan.monthlyPayment.toFixed(2)}</td>
                <td><span class="status-${loan.status}">${loan.status.toUpperCase()}</span></td>
                <td>${formatDate(loan.loanDate)}</td>
                <td>
                    <button class="btn btn-secondary" onclick="recordPayment('${loan.id}')" style="font-size: 0.8rem; padding: 0.4rem 0.6rem;">Pay</button>
                    <button class="btn btn-danger" onclick="deleteLoan('${loan.id}')" style="font-size: 0.8rem; padding: 0.4rem 0.6rem;">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Record loan payment
 */
function recordPayment(loanId) {
    const loans = getLoans();
    const loan = loans.find(l => l.id === loanId);
    
    if (!loan) {
        alert('Loan not found!');
        return;
    }
    
    const paymentAmount = prompt(`Enter payment amount (Monthly payment: $${loan.monthlyPayment.toFixed(2)}):`);
    
    if (paymentAmount === null) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
        alert('Invalid amount!');
        return;
    }
    
    loan.amountPaid += amount;
    
    // Check if loan is fully paid
    if (loan.amountPaid >= loan.totalRepayment) {
        loan.status = 'completed';
        loan.amountPaid = loan.totalRepayment;
    }
    
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
    alert(`Payment of $${amount.toFixed(2)} recorded successfully!`);
    displayLoans();
    updateDashboardStats();
}

/**
 * Delete a loan
 */
function deleteLoan(loanId) {
    if (confirm('Are you sure you want to delete this loan?')) {
        let loans = getLoans();
        loans = loans.filter(l => l.id !== loanId);
        localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
        displayLoans();
        updateDashboardStats();
    }
}

// ==================== Savings Management ====================

/**
 * Record a savings deposit
 */
function recordDeposit(event) {
    event.preventDefault();
    
    const form = document.getElementById('savingsForm');
    const formData = new FormData(form);
    
    const memberId = formData.get('savingsMemberId');
    const amount = parseFloat(formData.get('depositAmount'));
    const depositDate = formData.get('depositDate');
    const note = formData.get('depositNote');
    
    recordSavingTransaction(memberId, amount, 'deposit', note, depositDate);
    
    alert('Deposit recorded successfully!');
    form.reset();
    displaySavings();
    displaySavingsSummary();
    updateDashboardStats();
}

/**
 * Record a savings transaction (internal function)
 */
function recordSavingTransaction(memberId, amount, type, note = '', date = null) {
    if (!date) {
        date = new Date().toISOString().split('T')[0];
    }
    
    const transaction = {
        id: generateId('SAV'),
        memberId: memberId,
        amount: amount,
        type: type,
        date: date,
        note: note,
        createdDate: new Date().toISOString()
    };
    
    let savings = getSavings();
    savings.push(transaction);
    localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(savings));
    
    // Update member savings balance
    updateMemberSavings(memberId, amount);
}

/**
 * Update member's savings balance
 */
function updateMemberSavings(memberId, amount) {
    let members = getMembers();
    const member = members.find(m => m.id === memberId);
    
    if (member) {
        member.savings = (member.savings || 0) + amount;
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    }
}

/**
 * Get all savings transactions
 */
function getSavings() {
    const data = localStorage.getItem(STORAGE_KEYS.SAVINGS);
    return data ? JSON.parse(data) : [];
}

/**
 * Display savings by member
 */
function displaySavings() {
    const savingsTable = document.getElementById('savingsTable');
    if (!savingsTable) return;
    
    const members = getMembers();
    const savings = getSavings();
    
    if (members.length === 0) {
        savingsTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No members with savings.</td></tr>';
        return;
    }
    
    // Group savings by member
    const memberSavings = {};
    members.forEach(member => {
        const memberTransactions = savings.filter(s => s.memberId === member.id);
        const totalSavings = memberTransactions.reduce((sum, t) => sum + t.amount, 0);
        const lastDeposit = memberTransactions.length > 0 
            ? memberTransactions[memberTransactions.length - 1].date 
            : 'N/A';
        
        memberSavings[member.id] = {
            name: `${member.firstName} ${member.lastName}`,
            idNumber: member.id,
            totalSavings: totalSavings,
            lastDeposit: lastDeposit,
            depositCount: memberTransactions.length
        };
    });
    
    savingsTable.innerHTML = Object.entries(memberSavings).map(([memberId, data]) => `
        <tr>
            <td>${data.name}</td>
            <td>${data.idNumber}</td>
            <td>$${data.totalSavings.toFixed(2)}</td>
            <td>${data.lastDeposit}</td>
            <td>${data.depositCount}</td>
            <td>
                <button class="btn btn-secondary" onclick="viewMemberTransactions('${memberId}')" style="font-size: 0.8rem; padding: 0.4rem 0.6rem;">View</button>
            </td>
        </tr>
    `).join('');
}

/**
 * Display recent deposits
 */
function displayRecentDeposits() {
    const depositsTable = document.getElementById('depositsTable');
    if (!depositsTable) return;
    
    const savings = getSavings();
    const members = getMembers();
    
    // Sort by date, most recent first
    const sortedSavings = [...savings].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);
    
    if (sortedSavings.length === 0) {
        depositsTable.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999;">No deposits recorded.</td></tr>';
        return;
    }
    
    depositsTable.innerHTML = sortedSavings.map(transaction => {
        const member = members.find(m => m.id === transaction.memberId);
        const memberName = member ? `${member.firstName} ${member.lastName}` : 'Unknown';
        
        return `
            <tr>
                <td>${memberName}</td>
                <td>$${transaction.amount.toFixed(2)}</td>
                <td>${formatDate(transaction.date)}</td>
                <td>${transaction.note || '-'}</td>
            </tr>
        `;
    }).join('');
}

/**
 * View member transactions
 */
function viewMemberTransactions(memberId) {
    const members = getMembers();
    const member = members.find(m => m.id === memberId);
    
    if (!member) {
        alert('Member not found!');
        return;
    }
    
    const savings = getSavings();
    const transactions = savings.filter(s => s.memberId === memberId);
    
    let message = `Transactions for ${member.firstName} ${member.lastName}:\n\n`;
    
    if (transactions.length === 0) {
        message += 'No transactions found.';
    } else {
        transactions.forEach(t => {
            message += `${formatDate(t.date)}: +$${t.amount.toFixed(2)}\n`;
        });
    }
    
    alert(message);
}

/**
 * Filter savings by search term
 */
function filterSavings(searchTerm) {
    const savingsTable = document.getElementById('savingsTable');
    if (!savingsTable) return;
    
    const members = getMembers();
    const savings = getSavings();
    
    const filtered = members.filter(member =>
        member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filtered.length === 0) {
        savingsTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No members found.</td></tr>';
        return;
    }
    
    savingsTable.innerHTML = filtered.map(member => {
        const memberTransactions = savings.filter(s => s.memberId === member.id);
        const totalSavings = memberTransactions.reduce((sum, t) => sum + t.amount, 0);
        const lastDeposit = memberTransactions.length > 0 
            ? memberTransactions[memberTransactions.length - 1].date 
            : 'N/A';
        
        return `
            <tr>
                <td>${member.firstName} ${member.lastName}</td>
                <td>${member.id}</td>
                <td>$${totalSavings.toFixed(2)}</td>
                <td>${lastDeposit}</td>
                <td>${memberTransactions.length}</td>
                <td>
                    <button class="btn btn-secondary" onclick="viewMemberTransactions('${member.id}')" style="font-size: 0.8rem; padding: 0.4rem 0.6rem;">View</button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Display savings summary
 */
function displaySavingsSummary() {
    const members = getMembers();
    const savings = getSavings();
    
    const totalSavings = savings.reduce((sum, s) => sum + s.amount, 0);
    const avgSavings = members.length > 0 ? totalSavings / members.length : 0;
    
    const totalSavingsEl = document.getElementById('totalSavings');
    const totalMembersEl = document.getElementById('totalSavingsMembers');
    const avgSavingsEl = document.getElementById('avgSavings');
    
    if (totalSavingsEl) totalSavingsEl.textContent = `$${totalSavings.toFixed(2)}`;
    if (totalMembersEl) totalMembersEl.textContent = members.length;
    if (avgSavingsEl) avgSavingsEl.textContent = `$${avgSavings.toFixed(2)}`;
}

// ==================== Contact Management ====================

/**
 * Send contact message
 */
function sendContactMessage() {
    const form = document.getElementById('contactForm');
    const formData = new FormData(form);
    
    const message = {
        id: generateId('MSG'),
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        createdDate: new Date().toISOString()
    };
    
    // In a real application, this would be sent to a server
    console.log('Contact message:', message);
    
    const responseDiv = document.getElementById('contactResponse');
    if (responseDiv) {
        responseDiv.style.display = 'block';
        responseDiv.textContent = '✓ Thank you for your message! We will get back to you soon.';
        responseDiv.classList.remove('error');
    }
    
    form.reset();
    
    // Hide message after 5 seconds
    setTimeout(() => {
        if (responseDiv) {
            responseDiv.style.display = 'none';
        }
    }, 5000);
}

// ==================== Dashboard Statistics ====================

/**
 * Update dashboard statistics
 */
function updateDashboardStats() {
    const members = getMembers();
    const loans = getLoans();
    const savings = getSavings();
    
    const totalMembers = members.length;
    const totalSavings = savings.reduce((sum, s) => sum + s.amount, 0);
    const totalLoanAmount = loans.reduce((sum, l) => sum + l.principal, 0);
    const totalInterest = loans.reduce((sum, l) => sum + l.totalInterest, 0);
    
    // Update home page stats if they exist
    const memberEl = document.getElementById('total-members');
    const savingsEl = document.getElementById('total-savings');
    const loansEl = document.getElementById('total-loans');
    const interestEl = document.getElementById('total-interest');
    
    if (memberEl) memberEl.textContent = totalMembers;
    if (savingsEl) savingsEl.textContent = `$${totalSavings.toFixed(2)}`;
    if (loansEl) loansEl.textContent = `$${totalLoanAmount.toFixed(2)}`;
    if (interestEl) interestEl.textContent = `$${totalInterest.toFixed(2)}`;
}

// ==================== Utility Functions ====================

/**
 * Generate unique ID with prefix
 */
function generateId(prefix) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 9);
    return `${prefix}-${timestamp}-${randomStr}`;
}

/**
 * Format date to readable format
 */
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

/**
 * Get payment status
 */
function getPaymentStatus(loan) {
    const paidPercentage = (loan.amountPaid / loan.totalRepayment) * 100;
    
    if (paidPercentage === 0) {
        return 'pending';
    } else if (paidPercentage < 100) {
        return 'partial';
    } else {
        return 'completed';
    }
}

/**
 * Track savings for a member
 */
function trackMemberSavings(memberId) {
    const members = getMembers();
    const member = members.find(m => m.id === memberId);
    
    if (!member) {
        return { error: 'Member not found' };
    }
    
    const savings = getSavings();
    const memberTransactions = savings.filter(s => s.memberId === memberId);
    const totalSavings = memberTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return {
        memberId: memberId,
        memberName: `${member.firstName} ${member.lastName}`,
        totalSavings: totalSavings,
        transactionCount: memberTransactions.length,
        transactions: memberTransactions,
        lastUpdate: new Date().toISOString()
    };
}

/**
 * Calculate interest for display purposes
 */
function calculateInterestDisplay(principal, rate, months) {
    const timeInYears = months / 12;
    return principal * rate * timeInYears / 100;
}

// ==================== Initialization ====================

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('CoopSave Application Initialized');
    
    // Load initial data on page load
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('members')) {
        displayMembers();
    } else if (currentPage.includes('loans')) {
        displayLoans();
        populateMemberSelect();
    } else if (currentPage.includes('savings')) {
        displaySavings();
        displayRecentDeposits();
        displaySavingsSummary();
        populateMemberSelectForSavings();
    }
}

// Export functions for global use if needed
window.registerMember = registerMember;
window.displayMembers = displayMembers;
window.filterMembers = filterMembers;
window.deleteMember = deleteMember;
window.editMember = editMember;
window.calculateLoanInterest = calculateLoanInterest;
window.applyForLoan = applyForLoan;
window.displayLoans = displayLoans;
window.filterLoans = filterLoans;
window.recordPayment = recordPayment;
window.deleteLoan = deleteLoan;
window.recordDeposit = recordDeposit;
window.displaySavings = displaySavings;
window.filterSavings = filterSavings;
window.displaySavingsSummary = displaySavingsSummary;
window.viewMemberTransactions = viewMemberTransactions;
window.sendContactMessage = sendContactMessage;
window.updateDashboardStats = updateDashboardStats;
window.populateMemberSelect = populateMemberSelect;
window.populateMemberSelectForSavings = populateMemberSelectForSavings;
