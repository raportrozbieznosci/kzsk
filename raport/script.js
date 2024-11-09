document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const app = document.getElementById('app');
    const logoutButton = document.getElementById('logoutButton');
    const employeeForm = document.getElementById('employeeForm');
    const employeeList = document.getElementById('employeeList');
    const filterName = document.getElementById('filterName');
    const filterDate = document.getElementById('filterDate');
    const employeeBulk = document.getElementById('employeeBulk');
    const bulkDate = document.getElementById('bulkDate');
    const bulkAddButton = document.getElementById('bulkAddButton');
    const exportButton = document.getElementById('exportButton');
    const importFile = document.getElementById('importFile');
    const importButton = document.getElementById('importButton');
    const downloadJson = document.getElementById('downloadJson');
    const uploadJson = document.getElementById('uploadJson');
    const fileInput = document.getElementById('fileInput');

    // Administrator credentials
    const admin = { username: 'admin', password: 'raport' };

    // Load employees from local storage
    const employees = JSON.parse(localStorage.getItem('employees')) || [];

    const renderEmployees = (nameFilter = '', dateFilter = '') => {
        employeeList.innerHTML = '';
        // Sort employees by date
        employees.sort((a, b) => new Date(a.date) - new Date(b.date));
        employees
            .filter(employee => employee.name.toLowerCase().includes(nameFilter.toLowerCase()))
            .filter(employee => !dateFilter || employee.date === dateFilter)
            .forEach((employee, index) => {
                const li = document.createElement('li');
                li.textContent = `${employee.name} - ${employee.date}`;
                const editBtn = document.createElement('button');
                editBtn.textContent = 'Edytuj';
                editBtn.classList.add('edit-btn');
                editBtn.addEventListener('click', () => {
                    const newName = prompt('Edytuj imię i nazwisko:', employee.name);
                    const newDate = prompt('Edytuj datę zatrudnienia:', employee.date);
                    if (newName && newDate) {
                        employees[index] = { name: newName, date: newDate };
                        localStorage.setItem('employees', JSON.stringify(employees));
                        renderEmployees(nameFilter, dateFilter);
                    }
                });
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Usuń';
                deleteBtn.classList.add('delete-btn');
                deleteBtn.addEventListener('click', () => {
                    employees.splice(index, 1);
                    localStorage.setItem('employees', JSON.stringify(employees));
                    renderEmployees(nameFilter, dateFilter);
                });
                li.appendChild(editBtn);
                li.appendChild(deleteBtn);
                employeeList.appendChild(li);
            });
    };

    const checkLoginStatus = () => {
        const loggedIn = localStorage.getItem('loggedIn');
        if (loggedIn === 'true') {
            loginForm.style.display = 'none';
            app.style.display = 'block';
        }
    };

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        if (username === admin.username && password === admin.password) {
            alert('Zalogowano jako administrator');
            localStorage.setItem('loggedIn', 'true');
            loginForm.style.display = 'none';
            app.style.display = 'block';
        } else {
            alert('Nieprawidłowa nazwa użytkownika lub hasło');
        }
    });

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('loggedIn');
        app.style.display = 'none';
        loginForm.style.display = 'block';
    });

    employeeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('employeeName').value;
        const date = document.getElementById('hireDate').value;
        employees.push({ name, date });
        localStorage.setItem('employees', JSON.stringify(employees));
        renderEmployees(filterName.value, filterDate.value);
        document.getElementById('employeeName').value = 'KAT'; // Reset to "KAT"
    });

    bulkAddButton.addEventListener('click', () => {
        const bulkData = employeeBulk.value.split('\n');
        const date = bulkDate.value;
        bulkData.forEach(line => {
            const name = line.trim();
            if (name && date) {
                employees.push({ name, date });
            }
        });
        localStorage.setItem('employees', JSON.stringify(employees));
        renderEmployees(filterName.value, filterDate.value);
        employeeBulk.value = ''; // Clear the textarea
    });

    filterName.addEventListener('input', () => {
        renderEmployees(filterName.value, filterDate.value);
    });

    filterDate.addEventListener('input', () => {
        renderEmployees(filterName.value, filterDate.value);
    });

    exportButton.addEventListener('click', () => {
        const csvContent = "data:text/csv;charset=utf-8," + employees.map(e => `${e.name},${e.date}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "employees.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    importButton.addEventListener('click', () => {
        const file = importFile.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const importedEmployees = text.split('\n').map(line => {
                    const [name, date] = line.split(',').map(item => item.trim());
                    return { name, date };
                });
                employees.push(...importedEmployees);
                localStorage.setItem('employees', JSON.stringify(employees));
                renderEmployees(filterName.value, filterDate.value);
            };
            reader.readAsText(file);
        }
    });

    downloadJson.addEventListener('click', function() {
        const data = localStorage.getItem('employees');
        if (data) {
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'employees.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            // Clear the local storage and refresh the page
            localStorage.removeItem('employees');
            location.reload();
        } else {
            alert('Brak danych w localStorage');
        }
    });

    uploadJson.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                try {
                    const json = JSON.parse(content);
                    localStorage.setItem('employees', JSON.stringify(json));
                    alert('Dane zostały wczytane do localStorage');
                    location.reload(); // Refresh the page
                } catch (e) {
                    alert('Nieprawidłowy plik JSON');
                }
            };
            reader.readAsText(file);
        }
    });

    checkLoginStatus();
    renderEmployees();
});