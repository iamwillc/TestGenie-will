from flask import Flask, request, jsonify, render_template
from openai import OpenAI
from dotenv import load_dotenv


# Load environment variables
load_dotenv()

app = Flask(__name__)


# initializing

@app.route('/')
def home():
    # Renders the homepage
    return render_template('home.html')

@app.route('/index')
def index():
    # Renders the main page
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    client = OpenAI()

    # This endpoint handles the LLM input processing
    data = request.json
    user_input = data['input']
    table = data['tables']
    context = data['context']

    print('check app: ', '\n', table, '\n', context)

    if context ==  'addRelationships':

        content = (
            "Below are multiple SQL tables. Users will provide details how the want the relation between those tables " 
            "to be, such as left join, outer join, ect. Apply user\'s command to the corresponding table or tables. "
            "Make sure the output is in JSON format, containing 'columns' and 'rows' only."
            "**Do not include any explanations, descriptions, or additional text; output only the JSON data.**"
            "**The JSON should be a single object with 'columns' and 'rows' as keys; do not include table names or any extra nesting.**"
            " For example:\n"
            "```json\n"
            "{\n"
            "  \"columns\": [\"Column 1\", \"Column 2\"],\n"
            "  \"rows\": [[\"Data1\", \"Data2\"], [\"Data3\", \"Data4\"]]\n"
            "}\n"
            "```\n\n"            
            f'User\'s changes: {user_input}\n'
            f'Table data: {table}'
        )
    elif context == 'customization':

        content = (
            "Execute the specified SQL operations expressed in natural language on the provided tables. "
            "The operations will be dynamically specified by the user, such as replacing some values in specificed columns or rows. "
            "**Do not include any explanations, descriptions, or additional text; output only the JSON data.**"
            "**The JSON should be a single object with 'columns' and 'rows' as keys; do not include table names or any extra nesting.**"
            " For example:\n"
            "```json\n"
            "{\n"
            "  \"columns\": [\"Column 1\", \"Column 2\"],\n"
            "  \"rows\": [[\"Data1\", \"Data2\"], [\"Data3\", \"Data4\"]]\n"
            "}\n"
            "```\n\n"
            f'User Operations: {user_input}\n'
            f'Table data: {table}'
        )

    elif context == 'export':
        # fill in code in the content
        content = ()

    messages = [
        {
            "role": "user",
            "content": content,
        },
    ]

    completion = client.chat.completions.create(
        model="chatgpt-4o-latest",  
        messages=messages,
    )
    response = completion.choices[0].message.content

    # check result
    print(response)

    return jsonify({"result": response})

if __name__ == '__main__':
    app.run(debug=True)
