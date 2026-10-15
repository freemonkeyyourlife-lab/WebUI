# K.I.T.T. – Anleitung (ein Platz, alles kopierbar)

Ordner auf dem Chromebook: `~/KITT_new/WebUI/KITT`  (Terminal = Linux "penguin")

## 1. Erstinstallation
```bash
sudo apt update && sudo apt install -y git nodejs npm python3
cd ~
git clone -b copilot/setup-basic-foundation https://github.com/freemonkeyyourlife-lab/WebUI.git KITT_new
cd KITT_new/WebUI/KITT
chmod +x install.sh && ./install.sh
```
Browser: http://127.0.0.1:3005

## 2. Jeden Tag starten / stoppen
```bash
cd ~/KITT_new/WebUI/KITT && ./install.sh
pkill -f "app/server.js"      # stoppen
curl localhost:3005/api/health
cat data/kitt.log
```

## 3. Update holen (Dateien in app/ werden nie überschrieben)
```bash
pkill -f "app/server.js"
cd ~/KITT_new && git pull && cd WebUI/KITT
cp app/server.js app/server.js.alt && cp templates/server.js app/server.js
cp app/public/index.html app/public/index.html.alt && cp templates/public/index.html app/public/index.html
./install.sh
```
Im Browser danach Strg+Shift+R.

## 4. Aufträge + lokales Modell (Ollama, alles lokal)
Ollama installieren: https://ollama.com/download/linux – Modell selbst wählen: https://ollama.com/library
```bash
ollama pull MODELLNAME
ollama list
cd ~/KITT_new/WebUI/KITT
OLLAMA_MODEL=MODELLNAME python3 core/worker.py --once
cat data/proposals/*-antwort.md
```
Aufträge schreibst du im Browser in die Box "Aufträge an K.I.T.T.".

## 5. DNA / Prompt anpassen
```bash
cp dna/kitt_dna.json dna/kitt_dna.json.sicher
nano dna/kitt_dna.json            # Speichern Strg+O, Enter; Beenden Strg+X
nano prompts/system_prompt.md
python3 -m json.tool dna/kitt_dna.json > /dev/null && echo "DNA ok"
```

## 6. Module und Vorschläge
```bash
python3 core/extend.py --new-module meinmodul
python3 core/extend.py --propose DATEI --from NEUE_DATEI
python3 core/extend.py --apply ID
```

## 7. Sicherung
```bash
cd ~ && tar -czf KITT_backup_$(date +%Y%m%d).tar.gz KITT_Master KITT_new
```
Wichtigstes: `data/`, `dna/`, `prompts/`. Kopie zusätzlich auf Drive/USB.

## 8. Test
```bash
cd ~/KITT_new/WebUI/KITT && ./smoke-test.sh
```
