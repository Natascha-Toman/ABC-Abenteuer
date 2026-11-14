# Erzeugt ABC-Lernprogramm/Anleitung.html aus Anleitung-Vorlage.html (Bilder + Schrift eingebettet)
import re, base64, io, os
from PIL import Image
os.chdir(os.path.dirname(os.path.abspath(__file__)))
tpl=open("Anleitung-Vorlage.html",encoding="utf-8").read()
def img_uri(name):
    im=Image.open(os.path.join("anleitung-bilder",name)).convert("RGB")
    if im.width>960: im=im.resize((960,round(im.height*960/im.width)),Image.LANCZOS)
    b=io.BytesIO(); im.save(b,"JPEG",quality=80,optimize=True)
    return "data:image/jpeg;base64,"+base64.b64encode(b.getvalue()).decode()
def font_uri(name):
    return "data:font/woff2;base64,"+base64.b64encode(open(os.path.join("../ABC-Lernprogramm/files/fonts",name),"rb").read()).decode()
out=re.sub(r'src="anleitung-bilder/([^"]+)"',lambda m:'src="'+img_uri(m.group(1))+'"',tpl)
out=re.sub(r'url\("\.\./ABC-Lernprogramm/files/fonts/([^"]+)"\)',lambda m:'url("'+font_uri(m.group(1))+'")',out)
open("../ABC-Lernprogramm/Anleitung.html","w",encoding="utf-8").write(out)
print("ok")
