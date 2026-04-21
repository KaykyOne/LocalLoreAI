from app.service import bot
from app.service import translate

def read_stream(stream):
    response = ""
    for token in stream:
        print(token, end="", flush=True)
        response += token
    print("\n")
    return response

def main():
    print("\nModelo carregado! Testando como Mestre de RPG...\n\n")

    worldStyle = f"World style: {input('Escreva como você gostaria que fosse o mundo do seu RPG:')}"
    characterName = f"Protagonist Name: {input('Escreva o nome do seu personagem:')}"
    characterRole = f"Tone of Protagonist: {input('Escreva a classe/tom do seu personagem:')}"
    characterKeyTrait = f"Protagonist Key Traits: {input('Escreva os traços do seu personagem:')}"

    trats = [worldStyle, characterRole, characterName, characterKeyTrait]

    print("\nResposta do Mestre:\n")
    read_stream(bot.createWordStream(trats))

    message = ""
    while message != "fim":
        message = input("Digite a mensagem: ")

        if message == "fim":
            break
        
        print("\nResposta do Mestre:\n")
        read_stream(bot.sendMessageForIA(trats))


main()