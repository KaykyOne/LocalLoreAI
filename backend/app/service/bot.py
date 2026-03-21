from llama_cpp import Llama
import json

# Ajuste o caminho pro seu modelo (use r"..." pra evitar problemas com \)
model_path = r"C:\modelos-de-ia\phi-35\Phi-3.5-mini-instruct_Uncensored-Q5_K_M.gguf"
history_path = r"./history.json"

print("Carregando o modelo... (pode demorar 20-60s na primeira vez)")

llm = Llama(
    model_path=model_path,
    n_ctx=8192,          # contexto grande pra RPG
    n_gpu_layers=0,      # 0 = CPU only
    n_threads=12,        # threads do seu Ryzen 5 5500U
    n_batch=256,
    verbose=True
)

promptBase = """
Developer: You are a third-person fantasy narrator.

Write in clear, cinematic prose. Focus your description on the atmosphere, the setting, and what is happening around the characters. Do not talk to the player, and do not use the word 'you.'

Do not describe what the main character is thinking or deciding.

Start your scene in the middle of exciting or mysterious action. Build tension or create a sense of mystery.

End the scene without finishing the story; leave something unresolved. At the end, give a clear prompt for the player to respond to.

Your response must be less than 200 words.

Write a new, original fantasy scene now.
"""

promptBasePTBR = """
Developer: Você é um narrador de fantasia em terceira pessoa.

Responda SEMPRE em português brasileiro.

Escreva de forma clara e cinematográfica. Foque na atmosfera, no cenário e no que está acontecendo ao redor dos personagens. Não fale diretamente com o jogador e não use a palavra "você".

Não descreva o que o personagem principal está pensando ou decidindo.

Comece a cena já no meio de uma ação empolgante ou misteriosa. Construa tensão ou crie um senso de mistério.

Termine a cena sem concluir a história; deixe algo em aberto. Ao final, forneça um gancho claro para que o jogador responda.

Sua resposta deve ter menos de 200 palavras.

Agora escreva uma nova cena de fantasia original.
Nunca use inglês. Nunca fale diretamente com o jogador. Nunca use segunda pessoa.
"""

def _build_history_prompt(mensagens):
    historico = ""
    for mes in mensagens:
        historico += f"<|{mes['role']}|> {mes['value']} <|end|>"
    return historico


def sendMessageForIAStream(message):

    mensagens = getHistory()
    historico = _build_history_prompt(mensagens)

    prompt = f"""
{historico}
<|user|> {message} <|end|>
<|assistant|>"""

    stream = llm(
        prompt,
        max_tokens=300,
        temperature=0.6,
        top_p=0.9,
        stop=["<|user|>", "<|end|>"],
        echo=False,
        stream=True
    )

    response = ""

    for chunk in stream:
        token = chunk["choices"][0]["text"]
        response += token
        yield token

    mensagens.append({"role": "user", "value": message})
    mensagens.append({"role": "assistant", "value": response})
    saveHistory(mensagens)


def sendMessageForIA(message):
    response = ""
    for token in sendMessageForIAStream(message):
        response += token
    return response

def mostrarRespostaIA(res):
    print("Resposta do Mestre:\n")
    print(f"{res}\n")
        
def saveHistory(mensagens):
    with open(history_path, "w", encoding="utf-8") as f:
        json.dump(mensagens, f, indent=4, ensure_ascii=False)
    
def getHistory():
    try:
        with open(history_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []
    
def createWordStream(trats):
    mensagens = []
    prompt = f"<|system|> {promptBase}"
    for trat in trats:
        prompt += f"\n {trat}"
    prompt += "<|end|>"
    
    mensagens.append({"role": "system", "value" : prompt})
    saveHistory(mensagens)
    output = llm(
        prompt,
        max_tokens=300,
        temperature=0.6,
        top_p=0.9,
        stop=["<|user|>", "<|end|>"],
        echo=False,
        stream=True
    )
    
    response = ""
    for chunk in output:
        token = chunk["choices"][0]["text"]
        response += token
        yield token
    
    mensagens.append({"role": "assistant", "value": f"{response}"})
    saveHistory(mensagens)


def createWord(trats):
    response = ""
    for token in createWordStream(trats):
        response += token
    return response
    
def Bot():
    class _BotAPI:
        sendMessageForIA = staticmethod(sendMessageForIA)
        sendMessageForIAStream = staticmethod(sendMessageForIAStream)
        createWord = staticmethod(createWord)
        createWordStream = staticmethod(createWordStream)
        getHistory = staticmethod(getHistory)
        saveHistory = staticmethod(saveHistory)
        mostrarRespostaIA = staticmethod(mostrarRespostaIA)

    return _BotAPI()