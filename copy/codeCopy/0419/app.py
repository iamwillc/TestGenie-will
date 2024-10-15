from flask import Flask, request, jsonify, render_template
from openai import OpenAI
from dotenv import load_dotenv


# Load environment variables
load_dotenv()

app = Flask(__name__)

# Access your OpenAI API key

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
            "Apply the user\'s changes to the input tables and create a result table. \n\n"
            "Make sure the output is in JSON format, containing 'columns' and 'rows'. No introduction sentences please. \n\n"
            f'User\'s changes: {user_input}\n'
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
