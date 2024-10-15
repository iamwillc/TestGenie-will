// script.js


let columnTypesByTableId = {}; // Default to 'String'
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
});

function updateButtonOrder(tableId) {
    let tableContainer = document.getElementById(`table-container-${tableId}`);
    let buttonsContainer = tableContainer.querySelector('.buttons-container');
    
    // Check if the "Add Relationships" button needs to be moved
    let addRelationshipsButton = buttonsContainer.querySelector('button[data-action="addRelationships"]');
    if (addRelationshipsButton) {
        // Temporarily remove the "Add Relationships" button
        addRelationshipsButton.remove();
        // Re-append it to ensure it's the last button
        buttonsContainer.appendChild(addRelationshipsButton);
    }
}



function resetTable(tableId) {


    console.log('id: ', tableId)

    clearTable(tableId);

    // Remove the buttons-container to be rebuilt by createTableButtons
    let tableContainer = document.getElementById(`table-container-${tableId}`);
    let buttonsContainer = tableContainer.querySelector('.buttons-container');
    buttonsContainer.remove();

    // Re-create the header and first row of the table as per initial load
    let table = document.getElementById(tableId);
    let header = table.createTHead();
    let row = header.insertRow(0);

    for (let i = 1; i <= 4; i++) {
        let headerCell = row.insertCell(-1);
        headerCell.dataset.tableId = tableId;
        let dropdown = createTypeDropdown(i, tableId); 
        headerCell.appendChild(dropdown);
        headerCell.ondblclick = togglePrimaryKey; 
        headerCell.classList.add('header-cell');
    }

    // Re-add the initial set of buttons (Add Row, Add Column, Customize)
    createTableButtons(tableId, tableContainer);

    // Reset column type and add a new random row
    columnTypesByTableId[tableId] = ['String', 'String', 'String', 'String']
    addRow(tableId);

}


function sendRelationshipRequest() {
    let userInput = document.getElementById('relationReq').value;
    let tableData = readTableData();  

    fetch('/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            input: userInput,
            tables: tableData,  // Passing all tables data for potential cross-table operations
            context: 'addRelationships'  // Explicitly defining the context as adding relationships
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (typeof data.result === 'string') {
            // Remove the unwanted parts of the string
            let cleanString = data.result.replace(/```json\n|\n```/g, '');

            // Attempt to parse the cleaned string as JSON
            try {
                data.result = JSON.parse(cleanString);
                console.log('Parsed data.result (relationship):', data.result);
                // Continue with applying changes to the table
                if (data.result && data.result.rows) {
                    addResultTable(data.result);
                }
            } catch (error) {
                console.error('Parsing error:', error);
            }
        }

        if (data.result && data.result.rows) {

            console.log('New relationship table:', data.result);

        }
        document.getElementById('addRelationPopup').style.display = 'none';  // Hide the popup
    })
    .catch(error => console.error('Error:', error));
}

function addResultTable(data) {

    let resultContainer = document.getElementById('resultTableContainer');

    // If the container already exists, clear its contents
    if (resultContainer) {
        resultContainer.innerHTML = '';
    } else {
        // Create the container for the result table if it doesn't exist
        resultContainer = document.createElement('div');
        resultContainer.className = 'result-table-container';
        resultContainer.id = 'resultTableContainer';
        document.getElementById('mainContainer').appendChild(resultContainer);
    }

    // Create the table element
    let resultTable = document.createElement('table');
    resultTable.className = 'result-table';

    // Create the header row
    let header = resultTable.createTHead();
    let headerRow = header.insertRow(0);
    data.columns.forEach((column, index) => {
        let headerCell = document.createElement('th');
        headerCell.innerText = `Column ${index + 1}`;
        headerCell.className = 'non-editable';  // Ensure headers are non-editable
        headerCell.contentEditable = "true";
        headerRow.appendChild(headerCell);
    });

    // Populate the table rows
    data.rows.forEach((rowData) => {
        let row = resultTable.insertRow(-1);
        rowData.forEach((cellData) => {
            let cell = row.insertCell(-1);
            cell.innerText = cellData;
            cell.className = 'non-editable';  // Ensure cells are non-editable
        });
    });

    // Append the table to the container
    resultContainer.appendChild(resultTable);

    // Create and append the "Add Relationship" button
    let addRelationshipsButton = createAddRelationshipsButton();  // Assuming this function already exists
    resultContainer.appendChild(addRelationshipsButton);

    // Append the result table container to the main container in your document
    document.getElementById('mainContainer').appendChild(resultContainer);
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
            tables: tableData,
            context: 'customization'
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
            // console.log('Type of cleanString:', typeof cleanString);
            // console.log('check 2: ', cleanString)
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

function readTableData(tableId = null) {
    let allTablesData = {};

    let allTables = document.querySelectorAll('.dynamic-table');
    allTables.forEach((table, index) =>{
        let tableName = (tableId !== null && index === parseInt(tableId, 10)) ? 'CURRENT Table' : 'Table ' + (index+1);
        
        let tableData = {
            columns: [],
            rows: [],
            primaryKeyColumns: primaryKeyColumnsByTableId[tableId] || [],
        };
    
        let headerCells = table.rows[0].cells;
        for (let i = 0; i < headerCells.length; i++) {
            tableData.columns.push(headerCells[i].innerText || `Column ${i+1}`);
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

    adjustAddRelationshipsButtonPlacement();

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

    let tableContainer = document.getElementById(`table-container-${tableId}`);

    // Select the buttons-container within the tableContainer
    let buttonsContainer = tableContainer.querySelector('.buttons-container');

    if (buttonsContainer) {
        let addRowButton = buttonsContainer.querySelector('button[data-action="addRow"]');
        let addColumnButton = buttonsContainer.querySelector('button[data-action="addColumn"]');

        addRowButton?.remove();
        addColumnButton?.remove();

        // Add "Reset" button if it's not already present
        if (!buttonsContainer.querySelector('button[data-action="reset"]')) {

            let resetButton = createControlButton('Reset', () => resetTable(tableId), 'reset');
            
            buttonsContainer.appendChild(resetButton)
            tableContainer.appendChild(buttonsContainer);
        }
    }

}

function addTable(tableId) {

    updateTableButtons(tableId)

    let previousLastTableContainer = document.getElementById(`table-container-${tableId}`);
    let addRelationshipsButton = previousLastTableContainer.querySelector('button[data-action="addRelationships"]');
    addRelationshipsButton?.remove();

    // Initialize a new table with the next table ID
    tableCounter++; // Increment the counter to ensure a unique ID for the new table
    initializeTable(tableCounter);

    adjustAddRelationshipsButtonPlacement()
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

    console.log('id (toggle): ', tableId)

    resolvePrimaryKeyDuplicates(tableId);
}

function createAddRelationshipsButton() {
    let addRelationshipsButton = createControlButton('Add Relationships', () => {
        // Find all button containers and hide them
        let buttonContainers = document.querySelectorAll('.buttons-container');
        buttonContainers.forEach(function(container) {
            // Hide each container
            container.style.display = 'none';
        });

        let allTables = document.querySelectorAll('.dynamic-table');
        allTables.forEach(table => {

            createTableHeaders(table); // Use the current headers or retrieve them from somewhere


            let allCells = table.querySelectorAll('td', 'th');
            allCells.forEach(cell => {
                cell.classList.add('non-editable');
            });
        });

        showAddRelationPopup();

        // This might involve changing the UI or setting certain flags
    }, 'addRelationships');

    addRelationshipsButton.classList.add('add-relationships-button')

    return addRelationshipsButton;
}


function createTableHeaders(table) {
    let thead = table.tHead || table.createTHead();
    let headerRow = thead.rows[0] || thead.insertRow();

    // Find the maximum number of columns in any row in the table
    let numberOfColumns = Array.from(table.rows).reduce((max, row) => Math.max(max, row.cells.length), 0);

    // Clear the header row
    while (headerRow.firstChild) {
        headerRow.removeChild(headerRow.firstChild);
    }

    // Add `th` elements to the header row based on the number of columns
    for (let i = 0; i < numberOfColumns; i++) {
        let headerCell = document.createElement('th');
        headerCell.innerText = `Column ${i + 1}`;
        headerRow.appendChild(headerCell);
    }
}


function adjustAddRelationshipsButtonPlacement() {
    // Remove existing "Add Relationships" button from all tables
    document.querySelectorAll('button[data-action="addRelationships"]').forEach(button => button.remove());

    // Append the "Add Relationships" button to the last table's .buttons-container
    const lastTableId = tableCounter;
    const lastTableButtonsContainer = document.getElementById(`table-container-${lastTableId}`).querySelector('.buttons-container');
    if (lastTableButtonsContainer) {
        let addRelationshipsButton = createAddRelationshipsButton();
        lastTableButtonsContainer.appendChild(addRelationshipsButton);
    }
}



function initializeTable(tableId) {
    let tableContainerId = `table-container-${tableId}`;
    let tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    tableContainer.id = tableContainerId; // Use constructed ID

    columnTypesByTableId[tableId] = ['String', 'String', 'String', 'String'];
    
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

    addRow(tableId);
    createTableButtons(tableIdActual, tableContainer);

}

// Updated createTableButtons function
function createTableButtons(tableId, tableContainer) {

    let buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'buttons-container'; // This class will be used in the CSS to align the buttons

    // Create and append the "Add Row" button
    let addRowButton = createControlButton('Add Row', () => addRow(tableId), 'addRow');
    buttonsContainer.appendChild(addRowButton);

    // Create and append the "Add Column" button
    let addColumnButton = createControlButton('Add Column', () => addColumn(tableId), 'addColumn');
    buttonsContainer.appendChild(addColumnButton);

    // Create and append the "Customize" button
    let customizeButton = createControlButton('Customize', () => showCustomizePopup(tableId), 'customize');
    buttonsContainer.appendChild(customizeButton);

    // Create and append the "Add Table" button
    let addTableButton = createControlButton('Add Table', () => addTable(tableId), 'addTable');
    buttonsContainer.appendChild(addTableButton);

    
    if (parseInt(tableId, 10) === tableCounter) {
        let addRelationshipsButton = createAddRelationshipsButton();
        buttonsContainer.appendChild(addRelationshipsButton);
    }

    // Append the buttons container to the table container
    tableContainer.appendChild(buttonsContainer);
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

function showAddRelationPopup() {
    document.getElementById('addRelationPopup').style.display = 'block';
}

function closeAddRelationPopup() {
    document.getElementById('addRelationPopup').style.display = 'none';
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
            newRowData.push(generateDataByType(columnTypesByTableId[tableId][i]));
        }
    } else {
        // If primary keys are defined, perform the unique check
        while (!isUniqueRow && attempt < maxAttempts) {
            newRowData = [];
            for (let i = 0; i < table.rows[0].cells.length; i++) {
                newRowData.push(generateDataByType(columnTypesByTableId[tableId][i]));
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
    dropdown.dataset.tableId = tableId; // Make sure to set the data-tableId attribute
    dropdown.onchange = changeFieldType; 
    newHeaderCell.appendChild(dropdown);

    columnTypesByTableId[tableId].push('String');

    // Add cells to existing rows
    for (let i = 1; i < table.rows.length; i++) {
        let newRowCell = table.rows[i].insertCell(-1);
        newRowCell.innerHTML = generateDataByType(columnTypesByTableId[tableId][headerRow.cells.length - 1]);
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
    let tableId = e.target.dataset.tableId;
    let table = document.getElementById(tableId);
    let newType = e.target.value;

    if (!columnTypesByTableId[tableId]) {
        columnTypesByTableId[tableId] = ['String', 'String', 'String', 'String']; // Default to 'String'
    }
    
    // Update the column type for this specific column
    columnTypesByTableId[tableId][columnIndex] = newType;
    
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
        }
    }
}

