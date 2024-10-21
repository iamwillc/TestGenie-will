let columnTypesByTableId = {}; // Default to 'String'
let primaryKeyColumnsByTableId = {}; // Stores primary key columns for each table
let tableCounter = 0;

document.addEventListener('DOMContentLoaded', function() {
    initializeTable(tableCounter);

    // Select the "Revise" button by its ID
    let reviseButton = document.getElementById('reviseButton');
    reviseButton.addEventListener('click', function() {
        sendCustomizationRequest();
    });

    let closePopupButton = document.getElementById('closePopup');
    if (closePopupButton) {
        closePopupButton.addEventListener('click', function() {
            let customizePopup = document.getElementById('customizePopup');
            if (customizePopup) {
                customizePopup.style.display = 'none';
            }
        });
    }

    document.getElementById('closeRelationPopup').addEventListener('click', closeAddRelationPopup);

    document.getElementById('applyRelationButton').addEventListener('click', function() {
        sendRelationshipRequest();
    });

    // Export Button: Attach event listener for export
    let exportButton = document.getElementById('exportButton');
    if (exportButton) {
        exportButton.addEventListener('click', function() {
            exportResults();  // Call the export function
        });
    }
});

function exportResults() {
    console.log('Export button clicked');  // Debugging line
    
    let tableData = readTableData();  // Ensure table data is collected properly
    console.log('Table Data: ', tableData);  // Log table data for debugging

    fetch('/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            input: '',
            tables: tableData,
            context: 'export'
        }),
    })
    .then(response => {
        // Ensure we have a proper response from the backend
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        return response.blob();  // Convert response to a blob for download
    })
    .then(blob => {
        console.log('Blob received: ', blob);  // Check if blob is received
        
        // Create a link element to initiate download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exported_data.csv';  // Name of the file
        document.body.appendChild(a);  // Append link to body
        a.click();  // Trigger download
        a.remove();  // Clean up
    })
    .catch(error => {
        console.error('Error during fetch or download: ', error);  // Log any errors
    });
}

function resetTable(tableId) {
    console.log('id: ', tableId);

    clearTable(tableId);

    let tableContainer = document.getElementById(`table-container-${tableId}`);
    let buttonsContainer = tableContainer.querySelector('.buttons-container');
    buttonsContainer.remove();

    let table = document.getElementById(tableId);
    let header = table.createTHead();
    let row = header.insertRow(0);

    types = ['Complex String I', 'Category I', 'Number', 'Date'];

    for (let i = 1; i <= 4; i++) {
        let headerCell = row.insertCell(-1);
        headerCell.dataset.tableId = tableId;
        let dropdown = createTypeDropdown(tableId, types[i - 1]);
        headerCell.appendChild(dropdown);
        headerCell.ondblclick = togglePrimaryKey;
        headerCell.classList.add('header-cell');
    }

    createTableButtons(tableId, tableContainer);

    columnTypesByTableId[tableId] = ['Complex String I', 'Category I', 'Number', 'Date'];
    addRow(tableId);
}

function sendRelationshipRequest() {
    clearButtonsUponRelationshipAdded();
    let userInput = document.getElementById('relationReq').value;
    let tableData = readTableData();

    fetch('/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            input: userInput,
            tables: tableData,
            context: 'addRelationships'
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (typeof data.result === 'string') {
            let cleanString = data.result.replace(/```json\n|\n```/g, '');

            try {
                data.result = JSON.parse(cleanString);
                console.log('Parsed data.result (relationship):', data.result);
                if (data.result && data.result.rows) {
                    addResultTable(data.result);
                }
            } catch (error) {
                console.error('Parsing error:', error);
            }
        } else if (data.result && data.result.rows) {
            addResultTable(data.result);
        }
        document.getElementById('addRelationPopup').style.display = 'none';
    })
    .catch(error => console.error('Error:', error));
}

function addResultTable(data) {
    let resultContainer = document.getElementById('resultTableContainer');

    if (resultContainer) {
        resultContainer.innerHTML = '';
    } else {
        resultContainer = document.createElement('div');
        resultContainer.className = 'result-table-container';
        resultContainer.id = 'resultTableContainer';
        document.getElementById('mainContainer').appendChild(resultContainer);
    }

    let resultTable = document.createElement('table');
    resultTable.className = 'result-table';

    let header = resultTable.createTHead();
    let headerRow = header.insertRow(0);
    data.columns.forEach((column, index) => {
        let headerCell = document.createElement('th');
        headerCell.innerText = `Column ${index + 1}`;
        headerRow.appendChild(headerCell);
    });

    data.rows.forEach((rowData) => {
        let row = resultTable.insertRow(-1);
        rowData.forEach((cellData) => {
            let cell = row.insertCell(-1);
            cell.innerText = cellData;
        });
    });

    resultContainer.appendChild(resultTable);

    let addRelationshipsButton = createAddRelationshipsButton();
    resultContainer.appendChild(addRelationshipsButton);

    let exportResultButton = createControlButton('Export', exportResults, 'export');
    resultContainer.appendChild(exportResultButton);

    document.getElementById('mainContainer').appendChild(resultContainer);
}

function readTableData() {
    let allTablesData = {};
    let allTables = document.querySelectorAll('.dynamic-table');

    allTables.forEach((table, index) => {
        let tableName = `Table ${index + 1}`;
        let tableData = {
            columns: [],
            rows: []
        };

        let headerCells = table.rows[0].cells;
        for (let i = 0; i < headerCells.length; i++) {
            tableData.columns.push(headerCells[i].innerText);
        }

        for (let i = 1; i < table.rows.length; i++) {
            let row = table.rows[i];
            let rowData = [];
            for (let j = 0; j < row.cells.length; j++) {
                rowData.push(row.cells[j].innerText);
            }
            tableData.rows.push(rowData);
        }

        allTablesData[tableName] = tableData;
    });

    return allTablesData;
}

function createControlButton(buttonText, onClickFunction, dataAction) {
    let button = document.createElement('button');
    button.textContent = buttonText;
    button.onclick = onClickFunction;
    button.setAttribute('data-action', dataAction);

    return button;
}
