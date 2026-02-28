from llama_cpp import Llama

# Ajuste o caminho pro seu modelo (use r"..." pra evitar problemas com \)
model_path = r"C:\modelos-de-ia\phi-35\Phi-3.5-mini-instruct_Uncensored-Q5_K_M.gguf"

print("Carregando o modelo... (pode demorar 20-60s na primeira vez)")

llm = Llama(
    model_path=model_path,
    n_ctx=8192,          # contexto grande pra RPG
    n_gpu_layers=0,      # 0 = CPU only
    n_threads=12,        # threads do seu Ryzen 5 5500U
    n_batch=512,
    verbose=True
)

mensagens = []

promptInit = " rie um cenario inicial classico de RPG, e pergunte qual o próximo passo"

promptBase = """
<|system|>
Você é um Mestre de RPG épico e imersivo. Responda sempre em português, narrativo, criativo e descritivo. Nunca controle o jogador.
<|end|>
"""

def sendMessageForIA(message):
    
    prompt = f"""{promptBase}
        <|user|> {message} <|end|>
        <|assistant|>"""
    
    output = llm(
        prompt,
        max_tokens=300,
        temperature=0.85,
        top_p=0.95,
        stop=["<|user|>", "<|end|>"],
        echo=False
    )
    return output

def mostrarRespostaIA(res):
    print("Resposta do Mestre:")
    print(res['choices'][0]['text'].strip())
    
def main():
    print("\nModelo carregado! Testando como Mestre de RPG...\n")
    mostrarRespostaIA(sendMessageForIA(promptInit))
    message = ""
    while message != "fim":
        message = input("Digite a Mensagem:");
        if message == "fim":
            break;
        mostrarRespostaIA(sendMessageForIA(message))
        
main()

# Olhe o final do terminal pra ver velocidade (tokens por segundo na linha "eval time")