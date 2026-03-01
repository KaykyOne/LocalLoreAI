# Meu AI Dungeon Local - Clone Offline com IA

Projeto pessoal para criar um jogo de RPG de texto estilo AI Dungeon, rodando 100% local no PC (sem internet após download), usando modelo de linguagem leve (Phi-3.5-mini-instruct Uncensored).

**Objetivo do portfólio**: Demonstrar integração de LLM local (GGUF), inferência em CPU, interface simples futura (HTML/CSS ou Electron) e fine-tuning básico.

---

## Hardware Testado

- Notebook: Ryzen 5 5500U (6 núcleos/12 threads), 20 GB RAM, sem GPU dedicada  
- Sistema: Windows  
- Performance esperada: ~15-25 tokens/segundo em geração (Q5_K_M)

---

## Requisitos

- Python 3.10, 3.11 ou 3.12 instalado globalmente (não usamos Conda/Anaconda)  
- Git (opcional, para versionamento)  
- ~3-4 GB de espaço livre para o modelo  

---

## Passo a Passo de Instalação e Teste

### 1. Criar pasta do projeto

```bash
mkdir C:\projetos\rpg-ia-python
cd C:\projetos\rpg-ia-python
```

---

### 2. Criar e ativar ambiente virtual (isolado, como node_modules)

```bash
python -m venv venv
venv\Scripts\activate
```

(O prompt muda para `(venv)`)

---

### 3. Atualizar pip e ferramentas básicas

```bash
python -m pip install --upgrade pip setuptools wheel
```

---

### 4. Instalar llama-cpp-python (versão CPU com wheel pré-compilado – sem compilação manual)

```bash
pip install llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu
```

Isso instala binários prontos para Windows CPU.  
Se quiser aceleração BLAS (melhora ~20-30% no Ryzen):

```bash
pip install numpy
pip install llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu --force-reinstall --no-cache-dir
```

---

### 5. Baixar o modelo GGUF (Phi-3.5-mini-instruct Uncensored Q5_K_M)

Usamos o repositório do bartowski (qualidade alta, quantização recomendada).

#### Opção 1 – Via huggingface-cli (se você instalou)

```bash
mkdir C:\modelos-de-ia\phi-35
cd C:\modelos-de-ia\phi-35
huggingface-cli download bartowski/Phi-3.5-mini-instruct_Uncensored-GGUF --include "Phi-3.5-mini-instruct_Uncensored-Q5_K_M.gguf" --local-dir ./
```

---

#### Opção 2 – Download manual (mais simples se CLI falhar)

Acesse:  
https://huggingface.co/bartowski/Phi-3.5-mini-instruct_Uncensored-GGUF/tree/main  

Clique em `Phi-3.5-mini-instruct_Uncensored-Q5_K_M.gguf`  
Baixe (~2.8 GB)  

Salve em:  
`C:\modelos-de-ia\phi-35\`