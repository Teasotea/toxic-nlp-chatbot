import openai
import os

# Set up the OpenAI API client
openai.api_key = os.environ.get('OPENAI_API')

# Set up the model and prompt
model_engine = "text-davinci-003"


def generateMessage(word):
    prompt =  f'Generate offensive message or joke, that should be deleted, in Ukrainian with word: {word}. If the ending of word is missing - add this ending.'

    print("Prompt :\n", prompt)

    # Generate a response
    completion = openai.Completion.create(
        engine=model_engine,
        prompt=prompt,
        max_tokens=1024,
        n=1,
        stop=None,
        temperature=0.5,
    )

    response = completion.choices[0].text
    return response


if __name__ == "__main__":
    path = 'model-training/synthetic-data/obscene-ukr/'
    datapath = path + 'obscene_stemmed.txt'
    obscene = []
    with open(datapath) as f:
        obscene = f.readlines()
    
    with open(path + 'offensive_ukr.txt', 'a+') as f:
        for word in obscene:
            f.write('\n')
            print(word)
            try:
                f.write(generateMessage(word).strip())
            except Exception:
                print("exception")

