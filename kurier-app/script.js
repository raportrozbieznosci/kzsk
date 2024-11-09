document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const loadButton = document.getElementById('loadButton');
    const saveButton = document.getElementById('saveButton');
    const deleteAllButton = document.getElementById('deleteAllButton');
    const downloadQRButton = document.getElementById('downloadQRButton');
    const simulateButton = document.getElementById('simulateButton');
    const routeList = document.getElementById('routeList');
    const searchInput = document.getElementById('searchInput');
    let jsonData = [];
    let selectedCourierNumber = null;

    // Sprawdzamy, czy są dane w localStorage
    if (localStorage.getItem('jsonData')) {
        jsonData = JSON.parse(localStorage.getItem('jsonData'));
        displayData(jsonData);
    }

    loadButton.addEventListener('click', handleFile);
    saveButton.addEventListener('click', saveToFile);
    deleteAllButton.addEventListener('click', deleteAllData);
    downloadQRButton.addEventListener('click', downloadQR);
    simulateButton.addEventListener('click', simulateQRCodeScan);

    function handleFile() {
        const file = fileInput.files[0];
        if (!file) {
            alert('Proszę wybrać plik.');
            return;
        }

        const reader = new FileReader();

        reader.onload = function(event) {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Zapisujemy dane do localStorage
            localStorage.setItem('jsonData', JSON.stringify(jsonData));

            displayData(jsonData);
        };

        reader.readAsArrayBuffer(file);
    }

    function displayData(data) {
        routeList.innerHTML = '';
        data.slice(1).forEach((row, index) => {
            const [firstName, lastName, courierNumber, qrCode, readDates] = row;
            const readDatesArray = readDates ? readDates.split(',') : [];
            const listItem = document.createElement('tr');
            listItem.innerHTML = `
                <td>${firstName || ''}</td>
                <td>${lastName || ''}</td>
                <td>${courierNumber || ''}</td>
                <td><img src="${qrCode || generateQRCode(courierNumber)}" alt="QR Code" class="qr-code"></td>
                <td><button class="btn btn-info view-calendar" data-courier-number="${courierNumber}" data-read-dates="${readDatesArray.join(',')}">Zobacz</button></td>
            `;
            routeList.appendChild(listItem);
        });

        // Dodaj event listenery do przycisków "Zobacz"
        document.querySelectorAll('.view-calendar').forEach(button => {
            button.addEventListener('click', function() {
                selectedCourierNumber = this.getAttribute('data-courier-number');
                const readDates = this.getAttribute('data-read-dates').split(',');
                showCalendar(readDates);
                $('#calendarModal').modal('show');
            });
        });

        // Dodaj event listenery do QR kodów
        document.querySelectorAll('.qr-code').forEach(img => {
            img.addEventListener('click', function() {
                const qrCodeSrc = this.src;
                const largeQrCode = document.getElementById('largeQrCode');
                largeQrCode.src = qrCodeSrc;
                $('#qrCodeModal').modal('show');
            });
        });
    }

    function generateQRCode(data) {
        const qr = new QRious({
            value: data,
            size: 100
        });
        return qr.toDataURL();
    }

    function deleteAllData() {
        routeList.innerHTML = '';
        localStorage.removeItem('jsonData');
        jsonData = [];
    }

    function saveToFile() {
        const updatedData = [['Imię', 'Nazwisko', 'Numer Kuriera', 'Kod QR', 'Data Odczytu']];
        routeList.querySelectorAll('tr').forEach(row => {
            const cells = row.querySelectorAll('td');
            const rowData = [
                cells[0].textContent,
                cells[1].textContent,
                cells[2].textContent,
                cells[3].querySelector('img').src,
                cells[4].querySelector('button').getAttribute('data-read-dates')
            ];
            updatedData.push(rowData);
        });
        const worksheet = XLSX.utils.aoa_to_sheet(updatedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Kurierzy');
        XLSX.writeFile(workbook, 'zaktualizowane_kurierzy.xlsx');
    }

    searchInput.addEventListener('input', function() {
        const query = searchInput.value.toLowerCase();
        const filteredData = jsonData.filter((row, index) => {
            if (index === 0) return true; // Pomijamy nagłówki
            return row.some(cell => cell && cell.toString().toLowerCase().includes(query));
        });
        displayData(filteredData);
    });

    // Funkcja do obsługi odczytu kodu QR przez kuriera
    function handleQRCodeScan(courierNumber) {
        const currentDate = new Date().toISOString().split('T')[0]; // Formatowanie daty w formacie YYYY-MM-DD
        jsonData.forEach(row => {
            if (row[2] === courierNumber) {
                if (!row[4]) {
                    row[4] = currentDate; // Ustawiamy datę odczytu
                } else {
                    const dates = row[4].split(',');
                    if (!dates.includes(currentDate)) {
                        dates.push(currentDate);
                        row[4] = dates.join(',');
                    }
                }
            }
        });
        localStorage.setItem('jsonData', JSON.stringify(jsonData));
        displayData(jsonData);
    }

    // Funkcja do wyświetlania kalendarza
    function showCalendar(readDates) {
        $('#calendar').fullCalendar('destroy'); // Destroy previous instance
        $('#calendar').fullCalendar({
            header: {
                left: 'prev,next today',
                center: 'title',
                right: 'month'
            },
            locale: 'pl', // Spolszczenie kalendarza
            events: generateCalendarEvents(readDates),
            dayRender: function(date, cell) {
                const formattedDate = date.format('YYYY-MM-DD');
                if (readDates.includes(formattedDate)) {
                    cell.css('background-color', '#28a745'); // Zielone tło dla zeskanowanych dni
                } else {
                    cell.css('background-color', '#dc3545'); // Czerwone tło dla niezeskanowanych dni
                }
            }
        });
    }

    // Funkcja do generowania wydarzeń kalendarza
    function generateCalendarEvents(readDates) {
        return readDates.map(date => {
            return {
                title: '', // Usunięcie tekstu "Odczyt"
                start: date,
                allDay: true
            };
        });
    }

    // Funkcja do symulacji skanowania kodu QR (możesz ją usunąć w produkcji)
    function simulateQRCodeScan() {
        const simulatedCourierNumber = prompt("Podaj numer kuriera do symulacji skanowania kodu QR:", "KAT");
        if (simulatedCourierNumber) {
            handleQRCodeScan(simulatedCourierNumber);
        }
    }

    // Funkcja do pobierania kodów QR w formacie PDF
    async function downloadQR() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const rows = routeList.querySelectorAll('tr');
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('td');
            const firstName = cells[0].textContent;
            const lastName = cells[1].textContent;
            const courierNumber = cells[2].textContent;
            const qrCodeImg = cells[3].querySelector('img');

            doc.text(`Imię: ${firstName}`, 10, 10 + i * 50);
            doc.text(`Nazwisko: ${lastName}`, 10, 20 + i * 50);
            doc.text(`Numer Kuriera: ${courierNumber}`, 10, 30 + i * 50);

            if (qrCodeImg) {
                await html2canvas(qrCodeImg).then(canvas => {
                    const imgData = canvas.toDataURL('image/png');
                    doc.addImage(imgData, 'PNG', 10, 40 + i * 50, 50, 50);
                });
            }

            if (i < rows.length - 1) {
                doc.addPage();
            }
        }

        doc.save('kody_qr.pdf');
    }
});