from openai import OpenAI

client = OpenAI()

# completion = client.chat.completions.create(
#     model="gpt-4",  # e.g. gpt-35-instant
#     messages=[
#         {
#             "role": "user",
#             "content": "How do I output all files in a directory using Python?",
#         },
#     ],
# )
# print(completion.model_dump_json(indent=2))



# Starting messages with an initial prompt for a short poem.
messages = [
    {
        "role": "user",
        "content": "Write a short poem.",
    },
]

# Function to interact with the model for 3 rounds.
def interact_with_model(client, rounds=3):
    for round_number in range(rounds):
        print(f"Round {round_number + 1}:")
        # Making a request to the model.
        completion = client.chat.completions.create(
            model="gpt-4",  # Adjust model as necessary.
            messages=messages,
        )

        # Assuming the completion object has the expected structure.
        if completion.choices and len(completion.choices) > 0:
            response_content = completion.choices[0].message.content
            print("Model response:", response_content)

            # Add the model's response to the messages list.
            messages.append({
                "role": "assistant",
                "content": response_content,
            })

            # If it's not the last round, add the user's next prompt.
            if round_number < rounds - 1:
                next_user_input = input("Enter your next prompt: ")
                messages.append({
                    "role": "user",
                    "content": next_user_input,
                })
            else:
                print('messages', messages)
        else:
            print("No response from model.")
            break

# Call the function.
interact_with_model(client, 3)
