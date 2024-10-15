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
    table = data['table']
    requirement = 'Make sure you return only the resulting table following a json format having "columns" and "rows" as the attribute. No introducting sentence please, we just want the result. '
    
    content = f'Apply those changes - {user_input}, to this SQL table - {table}.' + requirement
    
    # check user input
    print('check prompt: \n', content)
    messages = [
        {
            "role": "user",
            "content": content,
        },
    ]

    completion = client.chat.completions.create(
        model="gpt-4-0125-preview",  # Adjust model as necessary.
        messages=messages,
    )
    response = completion.choices[0].message.content

    # check result
    print(response)

    return jsonify({"result": response})

if __name__ == '__main__':
    app.run(debug=True)
