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

print("\nModelo carregado! Testando como Mestre de RPG...\n")

prompt = """<|system|>
Você é um Mestre de RPG épico e imersivo. Responda sempre em português, narrativo, criativo e descritivo. Nunca controle o jogador.
<|end|>

<|user|>
Acordo numa floresta sombria à noite, com chuva fina e um uivo ao longe. O que faço primeiro?
<|end|>

<|assistant|>"""

output = llm(
    prompt,
    max_tokens=300,
    temperature=0.85,
    top_p=0.95,
    stop=["<|user|>", "<|end|>"],
    echo=False
)

print("Resposta do Mestre:")
print(output['choices'][0]['text'].strip())

# Olhe o final do terminal pra ver velocidade (tokens por segundo na linha "eval time")