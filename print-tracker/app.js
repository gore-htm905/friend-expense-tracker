class ExpenseProManager {
    constructor() {
        this.friends = JSON.parse(localStorage.getItem('friends')) || [];
        this.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        
        // Form & Containers
        this.friendForm = document.getElementById('friend-form');
        this.friendNameInput = document.getElementById('new-friend-name');
        this.friendsListContainer = document.getElementById('friends-list-container');
        
        this.expenseForm = document.getElementById('expense-form');
        this.paidBySelect = document.getElementById('paid-by');
        this.friendsInvolvedList = document.getElementById('friends-involved-list');
        this.expenseList = document.getElementById('expense-list');
        
        this.totalExpEl = document.getElementById('total-expenses');
        this.totalPendingEl = document.getElementById('total-pending');
        this.totalPaidEl = document.getElementById('total-paid');
        
        this.clearAllBtn = document.getElementById('clear-all');

        this.init();
    }

    init() {
        this.friendForm.addEventListener('submit', (e) => this.addFriend(e));
        this.expenseForm.addEventListener('submit', (e) => this.addExpense(e));
        this.clearAllBtn.addEventListener('click', () => this.clearAllData());
        
        this.renderAll();
    }

    // --- State Management ---
    
    saveFriends() {
        localStorage.setItem('friends', JSON.stringify(this.friends));
        this.renderFriendsUI();
    }

    saveExpenses() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
        this.renderExpensesUI();
        this.updateStats();
    }

    // --- Friend Logic ---

    addFriend(e) {
        e.preventDefault();
        const name = this.friendNameInput.value.trim();
        if (!name) return;
        
        if (this.friends.includes(name)) {
            alert('This friend is already added!');
            return;
        }

        this.friends.push(name);
        this.friendNameInput.value = '';
        this.saveFriends();
    }

    removeFriend(name) {
        if (confirm(`Remove ${name} from friends? This won't affect past expenses.`)) {
            this.friends = this.friends.filter(f => f !== name);
            this.saveFriends();
        }
    }

    // --- Expense Logic ---

    addExpense(e) {
        e.preventDefault();
        
        const name = document.getElementById('expense-name').value.trim();
        const amount = parseFloat(document.getElementById('total-amount').value);
        const paidBy = this.paidBySelect.value;
        const checkboxes = this.friendsInvolvedList.querySelectorAll('input[type="checkbox"]:checked');
        
        const involvedFriends = Array.from(checkboxes).map(cb => cb.value);

        if (!paidBy) {
            alert('Please select who paid.');
            return;
        }
        if (involvedFriends.length === 0) {
            alert('Please select at least one friend involved.');
            return;
        }

        const shareAmt = amount / involvedFriends.length;

        const expense = {
            id: Date.now(),
            name,
            totalAmount: amount,
            paidBy,
            date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            shares: involvedFriends.map(friend => ({
                name: friend,
                amount: shareAmt,
                paid: false
            }))
        };

        this.expenses.unshift(expense);
        this.saveExpenses();
        this.expenseForm.reset();
    }

    markAsPaid(expenseId, shareIdx) {
        const exp = this.expenses.find(e => e.id === expenseId);
        if (exp) {
            exp.shares[shareIdx].paid = true;
            this.saveExpenses();
        }
    }

    deleteExpense(id) {
        if (confirm('Delete this expense record?')) {
            this.expenses = this.expenses.filter(e => e.id !== id);
            this.saveExpenses();
        }
    }

    clearAllData() {
        if (confirm('This will wipe ALL history and friends. Proceed?')) {
            this.expenses = [];
            this.friends = [];
            localStorage.clear();
            this.renderAll();
        }
    }

    // --- Rendering Logic ---

    renderAll() {
        this.renderFriendsUI();
        this.renderExpensesUI();
        this.updateStats();
    }

    renderFriendsUI() {
        // Update Friend Pills
        this.friendsListContainer.innerHTML = '';
        this.friends.forEach(f => {
            const pill = document.createElement('div');
            pill.className = 'friend-pill';
            pill.innerHTML = `${f} <button onclick="proMgr.removeFriend('${f}')">×</button>`;
            this.friendsListContainer.appendChild(pill);
        });

        // Update Dropdown
        const currentVal = this.paidBySelect.value;
        this.paidBySelect.innerHTML = '<option value="" disabled selected>Select Friend</option>';
        this.friends.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f;
            opt.textContent = f;
            this.paidBySelect.appendChild(opt);
        });
        if (this.friends.includes(currentVal)) this.paidBySelect.value = currentVal;

        // Update Checkbox List
        this.friendsInvolvedList.innerHTML = '';
        if (this.friends.length === 0) {
            this.friendsInvolvedList.innerHTML = '<p class="muted">Add friends first to select them here.</p>';
        } else {
            this.friends.forEach(f => {
                const label = document.createElement('label');
                label.className = 'checkbox-item';
                label.innerHTML = `<input type="checkbox" value="${f}"> ${f}`;
                this.friendsInvolvedList.appendChild(label);
            });
        }
    }

    updateStats() {
        let total = 0;
        let pending = 0;
        let paid = 0;

        this.expenses.forEach(exp => {
            total += exp.totalAmount;
            exp.shares.forEach(s => {
                if (s.paid) paid += s.amount;
                else pending += s.amount;
            });
        });

        this.totalExpEl.textContent = `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        this.totalPendingEl.textContent = `₹${pending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        this.totalPaidEl.textContent = `₹${paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }

    renderExpensesUI() {
        if (this.expenses.length === 0) {
            this.expenseList.innerHTML = '<div class="empty-state"><p>No expenses added yet.</p></div>';
            return;
        }

        this.expenseList.innerHTML = '';
        this.expenses.forEach(exp => {
            const card = document.createElement('div');
            card.className = 'expense-card';
            
            const sharesHtml = exp.shares.map((s, idx) => `
                <div class="share-item">
                    <div class="share-user-info">
                        <span class="share-name">${s.name}</span>
                        <span class="share-amt">₹${s.amount.toFixed(2)}</span>
                    </div>
                    <div class="share-actions">
                        <span class="status-tag ${s.paid ? 'paid' : 'pending'}">${s.paid ? 'Paid' : 'Pending'}</span>
                        ${!s.paid ? `<button class="btn-pay" onclick="proMgr.markAsPaid(${exp.id}, ${idx})">Pay</button>` : ''}
                    </div>
                </div>
            `).join('');

            card.innerHTML = `
                <div class="expense-header">
                    <div class="expense-title">
                        <h3>${exp.name}</h3>
                        <p class="expense-meta">Paid by <strong>${exp.paidBy}</strong> • ${exp.date}</p>
                    </div>
                    <div style="text-align: right">
                        <div class="expense-total">₹${exp.totalAmount.toLocaleString('en-IN')}</div>
                        <button class="btn-delete-exp" onclick="proMgr.deleteExpense(${exp.id})">Delete</button>
                    </div>
                </div>
                <div class="share-grid">
                    ${sharesHtml}
                </div>
            `;
            this.expenseList.appendChild(card);
        });
    }
}

const proMgr = new ExpenseProManager();
