from flask import Flask, request, jsonify, render_template
import openai
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Access your OpenAI API key
openai.api_key = os.getenv('OPENAI_API_KEY')

@app.route('/')
def index():
    # Renders the main page
    return render_template('index.html')

@app.route('/modify_table', methods=['POST'])
def modify_table():
    # Endpoint to handle dynamic table modifications (add/delete rows and columns, change types, etc.)
    data = request.json
    # Example handling could be added here based on the action type (add_row, delete_column, etc.)
    return jsonify({"success": True, "message": "Table modified successfully"})

@app.route('/analyze', methods=['POST'])
def analyze():
    # Placeholder for OpenAI API integration
    data = request.json
    user_input = data['input']
    # Here is where you would make an API call to OpenAI or another service
    # For demonstration, echoing back the input
    result = f"Processed input: {user_input}"
    return jsonify({"result": result})

if __name__ == '__main__':
    app.run(debug=True)
