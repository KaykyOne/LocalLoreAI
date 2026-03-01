from deep_translator import GoogleTranslator

def translateForEnglish(text):
    traduzido = GoogleTranslator(source='pt', target='en').translate(text)
    return traduzido

def translateForPortuguese(text):
    traduzido = GoogleTranslator(source='en', target='pt').translate(text)
    return traduzido