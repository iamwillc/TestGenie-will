// script.js


let columnTypes = ['String', 'String', 'String', 'String']; // Default to 'String'
let primaryKeyColumnsByTableId = {}; // Stores primary key columns for each table
let tableCounter = 0;

document.addEventListener('DOMContentLoaded', function() {
    initializeTable(tableCounter);

    // Select the "Revise" button by its ID
    let reviseButton = document.getElementById('reviseButton');

    // Attach a click event listener to the "Revise" button
    reviseButton.addEventListener('click', function() {
        sendCustomizationRequest();
    });
});


function resetTable(tableId) {
    // Clear the current table
    let tableContainer = document.getElementById(`table-container-${tableId}`);
    if (tableContainer) {
        // Properly remove the existing tableContainer from the DOM
        tableContainer.remove();
    }

    // Reinitialize the table
    initializeTable(tableId);
}


function sendCustomizationRequest() {
    let customizePopup = document.getElementById('customizePopup');
    let tableId = customizePopup.getAttribute('data-current-table'); // Retrieve the current table ID
    let userInput = document.getElementById('customReq').value;
    let tableData = readTableData(tableId);
    
    fetch('/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            input: userInput,
            table: tableData
        }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Type of data.result:', typeof data.result);
        console.log('check: ', data.result)

        // Check if data.result is a string, and if so, parse it
        if (typeof data.result === 'string') {
            // Remove the unwanted parts of the string
            let cleanString = data.result.replace(/```json\n|\n```/g, '');
            console.log('Type of cleanString:', typeof cleanString);
            console.log('check 2: ', cleanString)
            // Attempt to parse the cleaned string as JSON
            try {
                data.result = JSON.parse(cleanString);
                console.log('Parsed data.result:', data.result);
                // Continue with applying changes to the table
                if (data.result && data.result.rows) {
                    applyChangesToTable(data.result, tableId);
                }
            } catch (error) {
                console.error('Parsing error:', error);
            }
        }
    
        // Now data.result should be an object, if it was a valid JSON string
        console.log('Type of data.result.rows:', typeof data.result);
    
        // Continue with applying changes to the table
        if (data.result && data.result.rows) {
            applyChangesToTable(data.result, tableId);
        }
    })
    .catch(error => console.error('Error:', error))
    .finally(() => {
        // This will execute after either the .then() or .catch() finishes
        document.getElementById('customizePopup').style.display = 'none'; // Hide the popup
    });
}

function readTableData(tableId) {
    let table = document.getElementById(tableId);
    let data = {
        columns: [],
        rows: [],
        primaryKeyColumns: primaryKeyColumnsByTableId[tableId] || [],
    };

    // Read columns
    let headerCells = table.rows[0].cells;
    for (let i = 0; i < headerCells.length; i++) {
        data.columns.push(headerCells[i].innerText || `Column ${i+1}`);
    }

    // Read rows
    for (let i = 1; i < table.rows.length; i++) {
        let row = table.rows[i];
        let rowData = [];
        for (let j = 0; j < row.cells.length; j++) {
            rowData.push(row.cells[j].innerText);
        }
        data.rows.push(rowData);
    }

    return data;
}


function applyChangesToTable(data, tableId) {
    let table = document.getElementById(tableId);

    // Clear the existing table first
    clearTable(tableId);

    // Create the header row with new column names
    let headerRow = table.createTHead().insertRow(0);
    for (let i = 0; i < data.columns.length; i++) {
        let headerCell = document.createElement('th');
        headerCell.innerText = `Column ${i + 1}`;
        headerRow.appendChild(headerCell);
    }

    // Iterate over each row of data and create table rows
    data.rows.forEach(rowData => {
        let row = table.insertRow(-1);
        rowData.forEach(cellData => {
            let cell = row.insertCell(-1);
            cell.innerText = cellData;
        });
    });

    updateTableButtons(tableId);
}

function clearTable(tableId) {
    let table = document.getElementById(tableId);
    while(table.rows.length > 0) {
        table.deleteRow(0);
    }
    // If the table uses a <thead> element, clear it separately
    if(table.tHead) {
        table.removeChild(table.tHead);
    }
}

function updateTableButtons(tableId) {

    console.log('test', tableId)

    let tableContainerId = `table-container-${tableId}`;
    let tableContainer = document.getElementById(tableContainerId);

    // Remove existing "Add Row" and "Add Column" buttons if present
    let addRowButton = tableContainer.querySelector('button[data-action="addRow"]');
    let addColumnButton = tableContainer.querySelector('button[data-action="addColumn"]');
    
    addRowButton?.remove();
    addColumnButton?.remove();

    // Create and append "Reset" button if not already present
    if (!tableContainer.querySelector('button[data-action="reset"]')) {
        let resetButton = createControlButton('Reset', () => resetTable(tableId), 'reset');
        tableContainer.appendChild(resetButton);
    }

    // Create and append "Add Table" button if not already present
    if (!tableContainer.querySelector('button[data-action="addTable"]')) {
        let addTableButton = createControlButton('Add Table', () => initializeTable(++tableCounter), 'addTable');
        tableContainer.appendChild(addTableButton);
    }
}

function createControlButton(buttonText, onClickFunction, dataAction) {
    let button = document.createElement('button');
    button.textContent = buttonText; // Set the button's text
    button.onclick = onClickFunction; // Attach the event handler
    button.setAttribute('data-action', dataAction); // Set a data-action attribute for further identification

    return button; // Return the created button
}


function resolvePrimaryKeyDuplicates(tableId) {
    let table = document.getElementById(tableId);
    if (!table) return;

    // Get the primary key columns for this specific table
    let primaryKeyColumns = primaryKeyColumnsByTableId[tableId] || [];

    if (primaryKeyColumns.length === 0) return; // Exit if there are no primary key columns

    let uniqueRecords = new Set();
    let rowsToDelete = [];

    for (let i = 1; i < table.rows.length; i++) {
        let keyValues = primaryKeyColumns.map(columnIndex => table.rows[i].cells[columnIndex].innerText).join('-');
        if (uniqueRecords.has(keyValues)) {
            // If the combination is already seen, mark this row for deletion
            rowsToDelete.push(i);
        } else {
            // Add the new combination to the set
            uniqueRecords.add(keyValues);
        }
    }
    
    // Resolve duplicates by deleting the rows
    for (let i = rowsToDelete.length - 1; i >= 0; i--) {
        table.deleteRow(rowsToDelete[i]);
    }
}


function togglePrimaryKey(e) {
    const headerCell = e.target;
    const columnIndex = headerCell.cellIndex;
    const tableId = headerCell.dataset.tableId; // Retrieve table ID from the cell's data attribute

    
    // Toggle primary key class
    headerCell.classList.toggle('primary-key');
    
    // Initialize primaryKeyColumns array for this table if it doesn't exist
    if (!primaryKeyColumnsByTableId[tableId]) {
        primaryKeyColumnsByTableId[tableId] = [];
    }

    // Update primaryKeyColumnsByTableId based on whether column is now primary key or not
    if (headerCell.classList.contains('primary-key')) {
        // Add column index to primary key columns for this table if not already present
        if (!primaryKeyColumnsByTableId[tableId].includes(columnIndex)) {
            primaryKeyColumnsByTableId[tableId].push(columnIndex);
        }
    } else {
        // Remove column index from primary key columns for this table
        primaryKeyColumnsByTableId[tableId] = primaryKeyColumnsByTableId[tableId].filter(index => index !== columnIndex);
    }

    resolvePrimaryKeyDuplicates(tableId);
}


function initializeTable(tableId) {
    let tableContainerId = `table-container-${tableId}`;
    let tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    tableContainer.id = tableContainerId; // Use constructed ID
    
    let tableIdActual = tableId;
    let table = document.createElement('table');
    table.id = tableIdActual;
    table.classList.add('dynamic-table');

    let header = table.createTHead();
    let row = header.insertRow(0);

    for (let i = 1; i <= 4; i++) {
        let headerCell = row.insertCell(-1);
        let dropdown = createTypeDropdown(i, tableIdActual); // Assume this function is defined elsewhere
        headerCell.appendChild(dropdown);
        headerCell.dataset.tableId = tableIdActual;
        headerCell.ondblclick = togglePrimaryKey; // Assume this function is adjusted to work with the new structure
        headerCell.classList.add('header-cell');
    }

    // Append the new table to the tableContainer div
    tableContainer.appendChild(table);  

    // Finally, append the tableContainer to the main container in your document
    document.getElementById('mainContainer').appendChild(tableContainer); // Make sure you have a div with id="mainContainer" in your HTML

    createTableButtons(tableIdActual, tableContainer);
}

// Updated createTableButtons function
function createTableButtons(tableId, tableContainer) {
    // Create and append the "Add Row" button
    let addRowButton = createControlButton('Add Row', () => addRow(tableId), 'addRow');
    tableContainer.appendChild(addRowButton);

    // Create and append the "Add Column" button
    let addColumnButton = createControlButton('Add Column', () => addColumn(tableId), 'addColumn');
    tableContainer.appendChild(addColumnButton);

    // Create and append the "Customize" button
    let customizeButton = createControlButton('Customize', () => showCustomizePopup(tableId), 'customize');
    tableContainer.appendChild(customizeButton);
}


// Utility function to check if the combination of values across primary key columns is unique
function isUnique(table, newRowData, primaryKeyColumns) {
    for (let i = 1; i < table.rows.length; i++) {
        let isDuplicateRow = primaryKeyColumns.every((columnIndex) => {
            return table.rows[i].cells[columnIndex].innerHTML === newRowData[columnIndex];
        });
        
        if (isDuplicateRow) return false; // Found a duplicate combination in primary key columns
    }
    return true; // Combination is unique
}

function showCustomizePopup(tableId) {
    let customizePopup = document.getElementById('customizePopup');
    customizePopup.style.display = 'block';
    customizePopup.setAttribute('data-current-table', tableId); // Store the current table ID
}


function addRow(tableId) {
    console.log('addRow triggered'); // Debugging line
    let table = document.getElementById(tableId);
    if (!table) return;

    let newRowData = [];
    let maxAttempts = 100;
    let attempt = 0;
    let isUniqueRow = false;

    // Get the primary key columns for this specific table
    let primaryKeyColumns = primaryKeyColumnsByTableId[tableId] || [];

    if (primaryKeyColumns.length === 0) {
        isUniqueRow = true; // Allow to add a row without unique check
        for (let i = 0; i < table.rows[0].cells.length; i++) {
            newRowData.push(generateDataByType(columnTypes[i]));
        }
    } else {
        // If primary keys are defined, perform the unique check
        while (!isUniqueRow && attempt < maxAttempts) {
            newRowData = [];
            for (let i = 0; i < table.rows[0].cells.length; i++) {
                newRowData.push(generateDataByType(columnTypes[i]));
            }

            isUniqueRow = isUnique(table, newRowData, primaryKeyColumns);
            attempt++;
            console.log('Attempt:', attempt); // Debugging line
        }
    }

    if (isUniqueRow) {
        let newRow = table.insertRow(-1);
        for (let i = 0; i < newRowData.length; i++) {
            let newCell = newRow.insertCell(-1);
            newCell.innerHTML = newRowData[i];
        }
    } else {
        console.error('Unique values could not be generated for the primary key fields.');
    }
}


// Utility function to generate data based on type
function generateDataByType(type) {
    switch (type) {
        case 'String':
            return generateRandomString(1);
        case 'Number':
            return generateRandomNumber(1);
        case 'Date':
            return generateRandomDate();
        // Add more cases for different types as necessary
        default:
            return '';
    }
}


function addColumn(tableId) {
    let table = document.getElementById(tableId); 
    if (!table) return;

    // Add new column header
    let headerRow = table.rows[0];
    let newHeaderCell = headerRow.insertCell(-1);
    //newHeaderCell.innerHTML = `col${headerRow.cells.length + 1}`;
    newHeaderCell.ondblclick = togglePrimaryKey;

    let dropdown = createTypeDropdown(headerRow.cells.length);
    newHeaderCell.appendChild(dropdown);

    columnTypes.push('String');

    // Add cells to existing rows
    for (let i = 1; i < table.rows.length; i++) {
        let newRowCell = table.rows[i].insertCell(-1);
        //newRowCell.innerHTML = generateRandomString(2); // Now generates random string data
        newRowCell.innerHTML = generateDataByType(columnTypes[headerRow.cells.length - 1]);
    }
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function generateRandomNumber(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 10); // Generates a single digit 0-9
    }
    return result;
}

function generateRandomDate() {
    let date = new Date(+new Date() - Math.floor(Math.random() * 10000000000));
    return date.toISOString().split('T')[0]; // Returns a date string in YYYY-MM-DD format
}


function createTypeDropdown(columnNumber, tableId) {
    const select = document.createElement('select');
    select.dataset.tableId = tableId;

    const types = ['String', 'Number', 'Date']; // Add more types as needed
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.text = type;
        select.appendChild(option);
    });
    select.value = 'String';
    select.onchange = changeFieldType; // Function to handle type change

    return select;
}


function changeFieldType(e) {
    // Get the index of the changed column
    let columnIndex = e.target.parentElement.cellIndex;
    columnTypes[columnIndex] = e.target.value;
    let tableId = e.target.dataset.tableId;
    let table = document.getElementById(tableId);
    let newType = e.target.value;
    
    for (let i = 1; i < table.rows.length; i++) {
        let cell = table.rows[i].cells[columnIndex];
        switch (newType) {
            case 'String':
                cell.innerHTML = generateRandomString(1);
                break;
            case 'Number':
                cell.innerHTML = generateRandomNumber(1);
                break;
            case 'Date':
                cell.innerHTML = generateRandomDate();
                break;
            // Add more cases for different types as necessary
        }
    }
}

