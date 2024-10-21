from flask import Flask, request, jsonify, render_template, make_response
import csv
import io
from openai import OpenAI
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Initialize OpenAI with API key
openai_api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=openai_api_key)


# Home route - main entry point of the app
@app.route('/')
def home():
    return render_template('home.html')


# Index route - another main page (if needed)
@app.route('/index')
def index():
    return render_template('index.html')


# Main analysis route - handles both export and relationship/customization requests
@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    user_input = data['input']
    table = data['tables']
    context = data['context']

    print('check app: ', '\n', table, '\n', context)

    # Handle export context - generate CSV
    if context == 'export':
        return export_table_as_csv(table)

    # Handle OpenAI-related contexts (e.g., addRelationships, customization)
    return handle_openai_request(user_input, table, context)


# Function to export table data as CSV
def export_table_as_csv(table):
    output = io.StringIO()
    writer = csv.writer(output)

    # Extract columns and rows from table data
    columns = table.get('columns', [])
    rows = table.get('rows', [])

    # Write header (columns) and rows to the CSV
    writer.writerow(columns)
    writer.writerows(rows)

    output.seek(0)

    # Send the CSV file as a response
    response = make_response(output.getvalue())
    response.headers["Content-Disposition"] = "attachment; filename=exported_data.csv"
    response.headers["Content-type"] = "text/csv"
    return response


# Function to handle OpenAI requests (relationships, customizations)
def handle_openai_request(user_input, table, context):
    # Define content based on the context provided by the user
    if context == 'addRelationships':
        content = (
            "Below are multiple SQL tables. Users will provide details on how they want the relationship between those tables "
            "to be, such as left join, outer join, etc. Apply the user's command to the corresponding table or tables. "
            "Make sure the output is in JSON format, containing 'columns' and 'rows' only. "
            "Do not include any explanations, descriptions, or additional text; output only the JSON data. "
            "For example:\n"
            "{\n"
            "  \"columns\": [\"Column 1\", \"Column 2\"],\n"
            "  \"rows\": [[\"Data1\", \"Data2\"], [\"Data3\", \"Data4\"]]\n"
            "}\n\n"
            f"User's changes: {user_input}\n"
            f"Table data: {table}"
        )

    elif context == 'customization':
        content = (
            "Execute the specified SQL operations expressed in natural language on the provided tables. "
            "The operations will be dynamically specified by the user, such as replacing some values in specified columns or rows. "
            "Do not include any explanations, descriptions, or additional text; output only the JSON data. "
            "For example:\n"
            "{\n"
            "  \"columns\": [\"Column 1\", \"Column 2\"],\n"
            "  \"rows\": [[\"Data1\", \"Data2\"], [\"Data3\", \"Data4\"]]\n"
            "}\n\n"
            f"User Operations: {user_input}\n"
            f"Table data: {table}"
        )

    # Interact with OpenAI's API
    messages = [
        {
            "role": "user",
            "content": content,
        },
    ]

    completion = client.chat_completions.create(
        model="gpt-4",
        messages=messages,
    )

    response_text = completion.choices[0].message['content']

    # Return the result as a JSON response
    return jsonify({"result": response_text})


if __name__ == '__main__':
    app.run(debug=True)