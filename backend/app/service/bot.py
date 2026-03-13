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
    n_threads=8,        # threads do seu Ryzen 5 5500U
    n_batch=512,
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

def sendMessageForIA(message):
    
    mensagens = []
    mensagens = getHistory()

    historico = ""
    if len(mensagens) > 0:
        for mes in mensagens:
            historico += f"<|{mes["role"]}|> {mes["value"]} <|end|>"
            
    prompt = f"""
        {historico}
        <|user|> {message} <|end|>
        <|assistant|>"""
    
    output = llm(
        prompt,
        max_tokens=300,
        temperature=0.6,
        top_p=0.9,
        stop=["<|user|>", "<|end|>"],
        echo=False
    )
    
    response = output['choices'][0]['text'].strip()
    
    mensagens.append({"role": "user", "value" : message})
    mensagens.append({"role": "assistant", "value": f"{response}"})
    saveHistory(mensagens)
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
    
def createWord(trats):
      
    mensagens = []
    prompt = f"<|system|> {promptBase}"
    for trat in trats:
        prompt += f"\n {trat}"
    prompt += "<|end|>"
    
    mensagens.append({"role": "system", "value" : prompt})
    saveHistory(mensagens)
    output = llm(
        prompt,
        max_tokens=500,
        temperature=0.6,
        top_p=0.9,
        stop=["<|user|>", "<|end|>"],
        echo=False
    )
    
    response = output['choices'][0]['text'].strip()
    
    mensagens.append({"role": "assistant", "value": f"{response}"})
    saveHistory(mensagens)
    return response