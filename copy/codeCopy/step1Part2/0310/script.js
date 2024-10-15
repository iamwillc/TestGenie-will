// script.js


let columnTypes = ['String', 'String', 'String', 'String']; // Default to 'String'
let primaryKeyColumns = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeTable();
    document.getElementById('addRow').addEventListener('click', addRow);
    document.getElementById('addColumn').addEventListener('click', addColumn);
    document.getElementById('customizeButton').addEventListener('click', createCustomizePopup);
    document.getElementById('reviseButton').addEventListener('click', sendCustomizationRequest);
});


function createCustomizePopup() {
    // Toggle the display of the popup
    let popup = document.getElementById('customizePopup');
    if (popup.style.display === 'block') {
        popup.style.display = 'none';
    } else {
        popup.style.display = 'block';
    }
}

function sendCustomizationRequest() {
    let userInput = document.getElementById('customReq').value;
    let tableData = readTableData();
    
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
                    applyChangesToTable(data.result);
                }
            } catch (error) {
                console.error('Parsing error:', error);
            }
        }
    
        // Now data.result should be an object, if it was a valid JSON string
        console.log('Type of data.result.rows:', typeof data.result);
    
        // Continue with applying changes to the table
        if (data.result && data.result.rows) {
            applyChangesToTable(data.result);
        }
    })
    .catch(error => console.error('Error:', error))
    .finally(() => {
        // This will execute after either the .then() or .catch() finishes
        document.getElementById('customizePopup').style.display = 'none'; // Hide the popup
    });
}

function readTableData() {
    let table = document.getElementById('dynamicTable');
    let data = {
        columns: [],
        rows: [],
        primaryKeyColumns: primaryKeyColumns,
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


function applyChangesToTable(data) {
    let table = document.getElementById('dynamicTable');

    // Clear the existing table first
    clearTable();

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

    // Update primary key columns, if necessary
    // This part depends on how primaryKeyColumns are defined and used in your app
}

function clearTable() {
    let table = document.getElementById('dynamicTable');
    while(table.rows.length > 0) {
        table.deleteRow(0);
    }
    // If the table uses a <thead> element, clear it separately
    if(table.tHead) {
        table.removeChild(table.tHead);
    }
}




function resolvePrimaryKeyDuplicates() {
    let table = document.getElementById('dynamicTable');
    if (!table || primaryKeyColumns.length === 0) return;

    let uniqueRecords = new Set();
    let rowsToDelete = [];
    
    // // Collect all rows that have duplicate primary key values
    // for (let i = 1; i < table.rows.length; i++) {
    //     for (let j = i + 1; j < table.rows.length; j++) {
    //         let isDuplicateRow = primaryKeyColumns.every((columnIndex) => {
    //             return table.rows[i].cells[columnIndex].innerText === table.rows[j].cells[columnIndex].innerText;
    //         });
    //         if (isDuplicateRow) {
    //             // Add the row index to the list of rows to delete or resolve
    //             rowsToDelete.push(j);
    //         }
    //     }
    // }
    for (let i = 1; i < table.rows.length; i++) {
        let keyValues = primaryKeyColumns.map(columnIndex => table.rows[i].cells[columnIndex].innerText).join('-');
        if (uniqueRecords.has(keyValues)) {
            rowsToDelete.push(i); // If the combination is already seen, mark this row for deletion
        } else {
            uniqueRecords.add(keyValues); // Add the new combination to the set
        }
    }
    
    // Resolve duplicates by deleting the rows or generating new values
    // This simple example deletes the rows; you may want to make this more sophisticated
    for (let i = rowsToDelete.length - 1; i >= 0; i--) {
        table.deleteRow(rowsToDelete[i]);
    }
}


function makePrimaryKey(e) {
    const headerCell = e.target;
    const columnIndex = headerCell.cellIndex;
    
    headerCell.classList.toggle('primary-key');
    
    // If this column is now a primary key, add its index to primaryKeyColumns
    if (headerCell.classList.contains('primary-key')) {
        if (!primaryKeyColumns.includes(columnIndex)) {
            primaryKeyColumns.push(columnIndex);
        }
    } else {
        // If it's no longer a primary key, remove it
        primaryKeyColumns = primaryKeyColumns.filter(index => index !== columnIndex);
    }

    // After updating the primary key columns, check for and resolve any conflicts
    resolvePrimaryKeyDuplicates();
}

function togglePrimaryKey(e) {
    const headerCell = e.target;
    const columnIndex = headerCell.cellIndex;
    
    // Toggle primary key class
    headerCell.classList.toggle('primary-key');
    
    // If this column is now a primary key, add its index to primaryKeyColumns
    if (headerCell.classList.contains('primary-key')) {
        if (!primaryKeyColumns.includes(columnIndex)) {
            primaryKeyColumns.push(columnIndex);
        }
    } else {
        // If it's no longer a primary key, remove it
        primaryKeyColumns = primaryKeyColumns.filter(index => index !== columnIndex);
    }

    resolvePrimaryKeyDuplicates();
}

function initializeTable() {
    let table = document.createElement('table');
    table.id = 'dynamicTable';
    let header = table.createTHead();
    let row = header.insertRow(0);

    for (let i = 1; i <= 4; i++) {
        let headerCell = row.insertCell(-1);
        let dropdown = createTypeDropdown(i); // Create the dropdown
        headerCell.appendChild(dropdown); // Append the dropdown to the header cell
        headerCell.ondblclick = togglePrimaryKey; // Set the double-click event
        headerCell.classList.add('header-cell'); // Add the class for styling
    }

    document.getElementById('tableContainer').appendChild(table);
    addRow(); // Add the first row by default
}

// Utility function to check if the combination of values across primary key columns is unique
function isUnique(table, newRowData) {
    for (let i = 1; i < table.rows.length; i++) {
        let isDuplicateRow = primaryKeyColumns.every((columnIndex) => {
            return table.rows[i].cells[columnIndex].innerHTML === newRowData[columnIndex];
        });
        
        if (isDuplicateRow) return false; // Found a duplicate combination in primary key columns
    }
    return true; // Combination is unique
}


function addRow() {
    console.log('addRow triggered'); // Debugging line
    let table = document.getElementById('dynamicTable');
    if (!table) return;

    let newRowData = [];
    let maxAttempts = 100;
    let attempt = 0;
    let isUniqueRow = false;

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

            isUniqueRow = isUnique(table, newRowData);
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



function addColumn() {
    let table = document.getElementById('dynamicTable');
    if (!table) return;

    // Add new column header
    let headerRow = table.rows[0];
    let newHeaderCell = headerRow.insertCell(-1);
    //newHeaderCell.innerHTML = `col${headerRow.cells.length + 1}`;
    newHeaderCell.ondblclick = makePrimaryKey;

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


function createTypeDropdown(columnNumber) {
    const select = document.createElement('select');
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
    let table = document.getElementById('dynamicTable');
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

