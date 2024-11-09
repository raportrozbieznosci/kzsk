document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const loadButton = document.getElementById('loadButton');
    const saveButton = document.getElementById('saveButton');
    const deleteAllButton = document.getElementById('deleteAllButton');
    const loadJsonButton = document.getElementById('loadJsonButton');
    const saveJsonButton = document.getElementById('saveJsonButton');
    const routeList = document.getElementById('routeList');
    const searchInput = document.getElementById('searchInput');
    const courierForm = document.getElementById('courierForm');
    const routeSelect = document.getElementById('routeSelect');
    const courierNameInput = document.getElementById('courierName');
    let jsonData = [];
    let originalData = [];

    // Sprawdzamy, czy są dane w localStorage
    if (localStorage.getItem('jsonData')) {
        jsonData = JSON.parse(localStorage.getItem('jsonData'));
        originalData = JSON.parse(localStorage.getItem('jsonData'));
        displayData(jsonData);
        populateRouteSelect(jsonData);
    }

    loadButton.addEventListener('click', handleFile);
    saveButton.addEventListener('click', saveToFile);
    deleteAllButton.addEventListener('click', deleteAllData);
    loadJsonButton.addEventListener('click', loadJson);
    saveJsonButton.addEventListener('click', saveJson);
    courierForm.addEventListener('submit', assignCourier);

    courierNameInput.addEventListener('input', function() {
        if (!courierNameInput.value.startsWith('KAT')) {
            courierNameInput.value = 'KAT';
        }
    });

    function handleFile() {
        const file = fileInput.files[0];
        if (!file) {
            alert('Proszę wybrać plik.');
            return;
        }

        const reader = new FileReader();

        reader.onload = function(event) {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                originalData = JSON.parse(JSON.stringify(jsonData)); // Kopia oryginalnych danych

                // Zapisujemy dane do localStorage
                localStorage.setItem('jsonData', JSON.stringify(jsonData));
                localStorage.setItem('originalData', JSON.stringify(originalData));

                displayData(jsonData);
                populateRouteSelect(jsonData);
            } catch (error) {
                console.error('Error reading Excel file:', error);
                alert('Błąd podczas wczytywania pliku Excel.');
            }
        };

        reader.readAsArrayBuffer(file);
    }

    function displayData(data) {
        routeList.innerHTML = '';
        data.forEach((row, index) => {
            if (index === 0) return; // Pomijamy nagłówki

            const [apm, city, addr, routeNumber, courier] = row;
            const listItem = document.createElement('tr');
            listItem.innerHTML = `
                <td>${apm || ''}</td>
                <td>${city || ''}</td>
                <td>${addr || ''}</td>
                <td>${routeNumber || ''}</td>
                <td>${courier || ''}</td>
                <td class="route-actions">
                    <button class="btn btn-secondary btn-sm edit-address" data-index="${index}">Edytuj</button>
                    <button class="btn btn-danger btn-sm delete-address" data-index="${index}">Usuń</button>
                </td>
            `;
            routeList.appendChild(listItem);
        });

        // Dodajemy event listenery do przycisków edycji i usuwania
        document.querySelectorAll('.edit-address').forEach(button => {
            button.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                editRow(index);
            });
        });

        document.querySelectorAll('.delete-address').forEach(button => {
            button.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                deleteRow(index);
            });
        });
    }

    function populateRouteSelect(data) {
        routeSelect.innerHTML = '<option value="">Wybierz trasę</option>';
        const uniqueRoutes = new Set();
        data.forEach((row, index) => {
            if (index === 0) return; // Pomijamy nagłówki
            const routeNumber = row[3];
            if (routeNumber && !uniqueRoutes.has(routeNumber)) {
                uniqueRoutes.add(routeNumber);
                const option = document.createElement('option');
                option.value = routeNumber;
                option.textContent = `Trasa ${routeNumber}`;
                routeSelect.appendChild(option);
            }
        });
    }

    function assignCourier(event) {
        event.preventDefault();
        const selectedRouteNumber = routeSelect.value;
        const courierName = courierNameInput.value;

        if (!selectedRouteNumber || !courierName) {
            alert('Proszę wybrać trasę i podać imię i nazwisko kuriera.');
            return;
        }

        jsonData.forEach(row => {
            if (row[3] == selectedRouteNumber) {
                row[4] = courierName; // Przypisujemy kuriera do wszystkich tras o tym samym numerze
            }
        });

        // Zapisujemy dane do localStorage
        localStorage.setItem('jsonData', JSON.stringify(jsonData));

        displayData(jsonData); // Aktualizujemy wyświetlanie danych
        courierForm.reset(); // Resetujemy formularz
        courierNameInput.value = 'KAT'; // Przywracamy prefiks KAT
    }

    function editRow(index) {
        const row = routeList.children[index];
        const cells = row.children;
        const apm = cells[0].textContent;
        const city = cells[1].textContent;
        const addr = cells[2].textContent;
        const routeNumber = cells[3].textContent;
        const courier = cells[4].textContent;

        // Wypełniamy formularz edycji danymi z wybranej trasy
        routeSelect.value = routeNumber;
        courierNameInput.value = courier;

        // Usuwamy wiersz z tabeli
        jsonData.splice(index + 1, 1);
        localStorage.setItem('jsonData', JSON.stringify(jsonData));
        displayData(jsonData);
    }

    function deleteRow(index) {
        jsonData[index][4] = ''; // Usuwamy kuriera z danej linii
        localStorage.setItem('jsonData', JSON.stringify(jsonData));
        displayData(jsonData);
    }

    function deleteAllData() {
        routeList.innerHTML = '';
        localStorage.removeItem('jsonData');
        jsonData = [];
        populateRouteSelect([]);
    }

    function saveToFile() {
        const worksheet = XLSX.utils.json_to_sheet(jsonData, { skipHeader: false });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Trasy');
        XLSX.writeFile(workbook, 'zaktualizowane_trasy.xlsx');
    }

    function loadJson() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(event) {
            const file = event.target.files[0];
            if (!file) {
                alert('Proszę wybrać plik JSON.');
                return;
            }
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    jsonData = JSON.parse(event.target.result);
                    originalData = JSON.parse(event.target.result); // Kopia oryginalnych danych
                    localStorage.setItem('jsonData', JSON.stringify(jsonData));
                    localStorage.setItem('originalData', JSON.stringify(originalData));
                    displayData(jsonData);
                    populateRouteSelect(jsonData);
                } catch (error) {
                    console.error('Error reading JSON file:', error);
                    alert('Błąd podczas wczytywania pliku JSON.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    function saveJson() {
        const dataStr = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'trasy.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    searchInput.addEventListener('input', function() {
        const query = searchInput.value.toLowerCase();
        const filteredData = jsonData.filter((row, index) => {
            if (index === 0) return true; // Pomijamy nagłówki
            return row.some(cell => cell && cell.toString().toLowerCase().includes(query));
        });
        displayData(filteredData);
    });
});