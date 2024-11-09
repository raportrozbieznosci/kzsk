document.addEventListener('DOMContentLoaded', function() {
    const wiaty = [11, 12, 20, 21, 24, 25, 26, 30, 31];
    const wiatyContainer = document.getElementById('wiaty-container');
    const wiataSelect = document.getElementById('wiata');
    const miejsceSelect = document.getElementById('miejsce');
    const toggleViewCheckbox = document.getElementById('toggle-view');
    const toggleLabel = document.getElementById('toggle-label');
    const recentChanges = document.getElementById('recentChanges');
    const fullHistory = document.getElementById('fullHistory');
    const changelogForm = document.getElementById('changelogForm');
    const changeInput = document.getElementById('changeInput');
    const historyModal = document.getElementById('historyModal');
    const showHistoryButton = document.getElementById('showHistory');
    const closeModal = document.getElementsByClassName('changelog-close')[0];
    let currentKurier = null;
    let excelKurierzy = [];
    let viewMode = 'nazwisko';  // default view mode
    let changes = JSON.parse(localStorage.getItem('changelog')) || [];

    function loadWiaty() {
        wiaty.forEach(wiata => {
            const wiataDiv = document.createElement('div');
            wiataDiv.classList.add('wiata');
            wiataDiv.id = `wiata${wiata}`;
            wiataDiv.innerHTML = `
                <h2>Wiata ${wiata}</h2>
                <div class="magazyn">MAGAZYN</div>
                <div class="parking">
                    ${generateMiejsca(wiata)}
                </div>
                <button class="masgen" onclick="openBulkModal(${wiata})">MASGEN</button>
                <button class="usun-wszystkich" onclick="deleteAllFromWiata(${wiata})">Usuń wszystkich</button>
            `;
            wiatyContainer.appendChild(wiataDiv);

            const option = document.createElement('option');
            option.value = wiata;
            option.innerText = `Wiata ${wiata}`;
            wiataSelect.appendChild(option);
        });

        for (let i = 1; i <= 20; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.innerText = i;
            miejsceSelect.appendChild(option);
        }
    }

    function generateMiejsca(wiata) {
        let miejscaHTML = '<div class="miejsca">';
        for (let i = 1; i <= 10; i++) {
            miejscaHTML += `<div class="miejsce" id="miejsce${wiata}-${i}" onclick="showInfo('${wiata}', ${i})">${i}</div>`;
        }
        miejscaHTML += '</div><div class="miejsca">';
        for (let i = 11; i <= 20; i++) {
            miejscaHTML += `<div class="miejsce" id="miejsce${wiata}-${i}" onclick="showInfo('${wiata}', ${i})">${i}</div>`;
        }
        miejscaHTML += '</div>';
        return miejscaHTML;
    }

    function loadKurierzy() {
        const kurierzy = JSON.parse(localStorage.getItem('kurierzy')) || [];
        kurierzy.forEach(kurier => {
            const miejsceDiv = document.getElementById(`miejsce${kurier.wiata}-${kurier.miejsce}`);
            if (miejsceDiv) {
                miejsceDiv.innerText = viewMode === 'nazwisko' ? kurier.nazwisko : kurier.numerKurier;
                miejsceDiv.dataset.info = `Imię: ${kurier.imie}\nNazwisko: ${kurier.nazwisko}\nNumer Kuriera: ${kurier.numerKurier}\nNumer Rejestracyjny: ${kurier.numerRejestracyjny}\nMiejsce Parkingowe: ${kurier.miejsce}`;
            }
        });
    }

    function saveKurier(kurier) {
        const kurierzy = JSON.parse(localStorage.getItem('kurierzy')) || [];
        const existingKurierIndex = kurierzy.findIndex(k => k.wiata === kurier.wiata && k.miejsce === kurier.miejsce);
        if (existingKurierIndex !== -1) {
            kurierzy[existingKurierIndex] = kurier;
        } else {
            kurierzy.push(kurier);
        }
        localStorage.setItem('kurierzy', JSON.stringify(kurierzy));
    }

    document.getElementById('kurier-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const imie = document.getElementById('imie').value;
        const nazwisko = document.getElementById('nazwisko').value;
        const numerKurier = document.getElementById('numer-kuriera').value;
        const numerRejestracyjny = document.getElementById('numer-rejestracyjny').value;
        const wiata = document.getElementById('wiata').value;
        const miejsce = document.getElementById('miejsce').value;
        const kurier = {
            imie: imie,
            nazwisko: nazwisko,
            numerKurier: numerKurier,
            numerRejestracyjny: numerRejestracyjny,
            wiata: wiata,
            miejsce: miejsce
        };
        saveKurier(kurier);
        const miejsceDiv = document.getElementById(`miejsce${wiata}-${miejsce}`);
        if (miejsceDiv) {
            miejsceDiv.innerText = viewMode === 'nazwisko' ? nazwisko : numerKurier;
            miejsceDiv.dataset.info = `Imię: ${imie}\nNazwisko: ${nazwisko}\nNumer Kuriera: ${numerKurier}\nNumer Rejestracyjny: ${numerRejestracyjny}\nMiejsce Parkingowe: ${miejsce}`;
        }
        document.getElementById('kurier-form').reset();
    });

    window.showInfo = function(wiata, miejsce) {
        const miejsceDiv = document.getElementById(`miejsce${wiata}-${miejsce}`);
        const info = miejsceDiv.dataset.info || "Brak danych";
        const kurierInfo = document.getElementById('kurier-info');
        const kurierFullInfo = document.getElementById('kurier-full-info');
        currentKurier = { wiata, miejsce, info };
        kurierFullInfo.innerText = info;
        kurierInfo.style.display = 'block';
    };

    window.closeInfo = function() {
        document.getElementById('kurier-info').style.display = 'none';
        currentKurier = null;
    };

    window.editKurier = function() {
        if (!currentKurier) return;
        const { wiata, miejsce, info } = currentKurier;
        const [imie, nazwisko, numerKurier, numerRejestracyjny, miejsceParkingowe] = info.split('\n').map(line => line.split(': ')[1]);
        document.getElementById('imie').value = imie;
        document.getElementById('nazwisko').value = nazwisko;
        document.getElementById('numer-kuriera').value = numerKurier;
        document.getElementById('numer-rejestracyjny').value = numerRejestracyjny;
        document.getElementById('wiata').value = wiata;
        document.getElementById('miejsce').value = miejsceParkingowe;
        closeInfo();
    };

    window.deleteKurier = function() {
        if (!currentKurier) return;
        const { wiata, miejsce } = currentKurier;

        // Remove kurier from local storage
        let kurierzy = JSON.parse(localStorage.getItem('kurierzy')) || [];
        kurierzy = kurierzy.filter(kurier => !(kurier.wiata === wiata && kurier.miejsce === miejsce));
        localStorage.setItem('kurierzy', JSON.stringify(kurierzy));

        // Reset miejsce div
        const miejsceDiv = document.getElementById(`miejsce${wiata}-${miejsce}`);
        if (miejsceDiv) {
            miejsceDiv.innerText = `${miejsce}`;
            delete miejsceDiv.dataset.info;
        }

        closeInfo();
    };

    window.saveToFile = function() {
        const kurierzy = JSON.parse(localStorage.getItem('kurierzy')) || [];
        const changelog = JSON.parse(localStorage.getItem('changelog')) || [];
        const data = {
            kurierzy: kurierzy,
            changelog: changelog
        };
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.json';
        a.click();
        URL.revokeObjectURL(url);

        // Clear local storage and reload page
        localStorage.removeItem('kurierzy');
        localStorage.removeItem('changelog');
        location.reload();
    };

    window.loadFile = function() {
        document.getElementById('file-input').click();
    };

    window.loadFromFile = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = JSON.parse(e.target.result);
                localStorage.setItem('kurierzy', JSON.stringify(data.kurierzy));
                localStorage.setItem('changelog', JSON.stringify(data.changelog));
                changes = data.changelog; // Update the local changes variable
                loadKurierzyFromData(data.kurierzy);
                renderChanges();
            };
            reader.readAsText(file);
        }
    };

    function loadKurierzyFromData(kurierzy) {
        kurierzy.forEach(kurier => {
            const miejsceDiv = document.getElementById(`miejsce${kurier.wiata}-${kurier.miejsce}`);
            if (miejsceDiv) {
                miejsceDiv.innerText = viewMode === 'nazwisko' ? kurier.nazwisko : kurier.numerKurier;
                miejsceDiv.dataset.info = `Imię: ${kurier.imie}\nNazwisko: ${kurier.nazwisko}\nNumer Kuriera: ${kurier.numerKurier}\nNumer Rejestracyjny: ${kurier.numerRejestracyjny}\nMiejsce Parkingowe: ${kurier.miejsce}`;
            }
        });
    }

    function renderChanges() {
        recentChanges.innerHTML = '';
        fullHistory.innerHTML = '';

        const recent = changes.slice(-5).reverse();
        recent.forEach((change, index) => {
            const li = document.createElement('li');
            li.innerHTML = `${change.text} - ${change.date} <button class="delete-button" onclick="deleteChange(${index})">Usuń</button>`;
            recentChanges.appendChild(li);
        });

        changes.reverse().forEach((change, index) => {
            const li = document.createElement('li');
            li.innerHTML = `${change.text} - ${change.date} <button class="delete-button" onclick="deleteChange(${index})">Usuń</button>`;
            fullHistory.appendChild(li);
        });
        changes.reverse();
    }

    window.deleteChange = function(index) {
        changes.splice(index, 1);
        localStorage.setItem('changelog', JSON.stringify(changes));
        renderChanges();
    };

    changelogForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const changeText = changeInput.value.trim();
        if (changeText) {
            const now = new Date();
            const formattedDate = now.toLocaleString('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const change = { text: changeText, date: formattedDate };
            changes.push(change);
            localStorage.setItem('changelog', JSON.stringify(changes));
            changeInput.value = '';
            renderChanges();
        }
    });

    showHistoryButton.addEventListener('click', () => {
        historyModal.style.display = 'block';
        renderChanges(); // Ensure changes are rendered when opening history
    });

    closeModal.addEventListener('click', () => {
        historyModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === historyModal) {
            historyModal.style.display = 'none';
        }
    });

    window.toggleView = function() {
        viewMode = toggleViewCheckbox.checked ? 'numer' : 'nazwisko';
        toggleLabel.innerText = viewMode === 'numer' ? 'Numer Kuriera' : 'Nazwisko';
        loadKurierzy();
    };

    window.refreshPage = function() {
        localStorage.removeItem('kurierzy');
        localStorage.removeItem('changelog');
        location.reload();
    };

    loadWiaty();
    loadKurierzy();
    renderChanges();
});