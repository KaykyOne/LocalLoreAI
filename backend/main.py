from app import bot, translate

worldStyle = "World style: "
characterRole = "Tone: "
characterName = "Protagonist: "
characterKeyTrait = ""

def main():
    print("\nModelo carregado! Testando como Mestre de RPG...\n\n")
    
    worldStyle = f"World style: {input("Escreva como você gostária que fosse o mundo do seu RPG, algo sádio? escuro? ou um mundo classico e feliz de RPG:")}"
    characterName = f"Protagonist Name: {input("Escreva o Nome do seu personagem:")}"
    characterRole = f"Tone of Protagonist: {input("Escreva qual classe de pergonagem você quer, um guerreiro estoico? um necromante, decida e se divirta:")}"
    characterKeyTrait = f"Protagonist Key Traits: {input("Escreva os traços do seu personagem, ele é forte? é o honrado desse mundo? só o tempo e você conseguira decidir:")}"
    
    trats = [worldStyle, characterRole, characterName, characterKeyTrait]
    tratsTranslate = []
    
    for trat in trats:
        newTrat = translate.translateForEnglish(trat)
        tratsTranslate.append(newTrat)
    
    res = bot.createWord(tratsTranslate) 
    
    resTraduzido = translate.translateForPortuguese(res)
    bot.mostrarRespostaIA(resTraduzido)
    message = ""    
    while message != "fim":
        message = input("Digite a Mensagem:");
        
        if message == "fim":
            break;
        
        res = bot.sendMessageForIA(message)
        resTraduzido = translate.translateForPortuguese(res)
        bot.mostrarRespostaIA(resTraduzido)
        
main()