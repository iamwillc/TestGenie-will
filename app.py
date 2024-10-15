from flask import Flask, request, jsonify, render_template
from openai import OpenAI
from dotenv import load_dotenv


# Load environment variables
load_dotenv()

app = Flask(__name__)


# initializing

@app.route('/')
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

    print('check app: ', table, context)

    if context == 'addRelationships':

        content = (
            "Below are multiple SQL tables. Apply the user\'s changes specified by the user "
            "to the CURRENT Table (the table that corresponds to the key of \'CURRENT Table\') only. Use data from other tables if and only if "
            "the instructions explicitly mention doing so. Make sure the output is "
            "in JSON format, containing 'columns' and 'rows' for the CURRENT Table only.\n\n"
            f'User\'s changes: {user_input}\n'
            f'Table data: {table}'
        )
    else:

        content = (
            "Execute the specified SQL operations on the provided tables. "
            "The operations will be dynamically specified by the user, such as joining tables "
            "on specified columns or applying different types of SQL joins (INNER, RIGHT, ANTI JOIN, etc.). "
            "The results should be output in JSON format with 'columns' and 'rows'. No introduction sentences please. \n\n"
            f'User Operations: {user_input}\n'
            f'Table data: {table}'
        )

    messages = [
        {
            "role": "user",
            "content": content,
        },
    ]

    completion = client.chat.completions.create(
        model="gpt-4-0125-preview",  
        messages=messages,
    )
    response = completion.choices[0].message.content

    # check result
    print(response)

    return jsonify({"result": response})

if __name__ == '__main__':
    app.run(debug=True)
