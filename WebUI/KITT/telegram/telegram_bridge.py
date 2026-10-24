#!/usr/bin/env python3
"""K.I.T.T. Telegram bot bridge v0.1, stdlib only, polling, opt-in allowlist."""
import json, os, sqlite3, time, urllib.request, urllib.error
from pathlib import Path

BASE = Path(os.getenv('KITT_TELEGRAM_HOME', str(Path.home()/'.local/share/kitt-telegram')))
DB = BASE/'archive.sqlite3'
AGENTS = {'kitt', 'bill', 'wanderer', 'artanis', 'tania', 'tom', 'karr'}

def allowed():
    return {int(x.strip()) for x in os.getenv('KITT_TELEGRAM_ALLOWED_CHATS','').split(',') if x.strip().lstrip('-').isdigit()}

def init(db):
    db.execute('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, chat_id INTEGER NOT NULL, message_id INTEGER, direction TEXT NOT NULL, agent TEXT, body TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)')
    db.execute('CREATE TABLE IF NOT EXISTS assignments (chat_id INTEGER PRIMARY KEY, agent TEXT NOT NULL)')
    db.execute('CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER NOT NULL, agent TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL DEFAULT "queued", created_at TEXT DEFAULT CURRENT_TIMESTAMP)')
    db.commit()

def api(token, method, payload):
    req=urllib.request.Request('https://api.telegram.org/bot'+token+'/'+method, data=json.dumps(payload).encode(), headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req,timeout=45) as response:
        result=json.load(response)
    if not result.get('ok'): raise RuntimeError('Telegram API request failed')
    return result['result']

def handle(db, chat_id, message_id, body):
    body=body.strip()
    agent_row=db.execute('SELECT agent FROM assignments WHERE chat_id=?',(chat_id,)).fetchone()
    agent=agent_row[0] if agent_row else 'kitt'
    db.execute('INSERT INTO messages(chat_id,message_id,direction,agent,body) VALUES (?, ?, ?, ?, ?)',(chat_id,message_id,'in',agent,body))
    if body.startswith('/start') or body.startswith('/help'):
        answer='K.I.T.T. Befehle: /status, /agents, /agent NAME, /task AUFTRAG, /history, /chats. Nur freigegebene Chats.'
    elif body.startswith('/status'):
        count=db.execute('SELECT COUNT(*) FROM tasks WHERE chat_id=?',(chat_id,)).fetchone()[0]
        answer=f'K.I.T.T. Bridge aktiv. Agent: {agent}. Aufträge: {count}. Keine automatische KI-Ausführung.'
    elif body.startswith('/agents'):
        answer='Agenten: '+', '.join(sorted(AGENTS))
    elif body.startswith('/agent '):
        requested=body.split(maxsplit=1)[1].strip().lower()
        if requested not in AGENTS: answer='Unbekannter Agent. /agents zeigt die Auswahl.'
        else:
            db.execute('INSERT INTO assignments(chat_id,agent) VALUES (?,?) ON CONFLICT(chat_id) DO UPDATE SET agent=excluded.agent',(chat_id,requested))
            agent=requested
            answer=f'Agent für diesen Chat: {agent}'
    elif body.startswith('/task '):
        task=body.split(maxsplit=1)[1].strip()[:4000]
        if not task: answer='Bitte Auftrag nach /task eingeben.'
        else:
            cur=db.execute('INSERT INTO tasks(chat_id,agent,body) VALUES (?,?,?)',(chat_id,agent,task))
            answer=f'Auftrag #{cur.lastrowid} für {agent} gespeichert (Warteschlange, noch nicht ausgeführt).'
    elif body.startswith('/history'):
        rows=db.execute('SELECT id,agent,status,substr(body,1,90) FROM tasks WHERE chat_id=? ORDER BY id DESC LIMIT 5',(chat_id,)).fetchall()
        answer='Letzte Aufträge:\n'+'\n'.join(f'#{r[0]} [{r[1]}] {r[2]}: {r[3]}' for r in rows) if rows else 'Noch keine Aufträge.'
    elif body.startswith('/chats'):
        answer=f'Aktueller Chat: {chat_id}. Chat-Wechsel über die jeweilige Telegram-Unterhaltung. Freigaben nur über lokale Konfiguration.'
    else:
        answer='Nachricht archiviert. Für einen Auftrag bitte /task TEXT verwenden.'
    db.execute('INSERT INTO messages(chat_id,direction,agent,body) VALUES (?,?,?,?)',(chat_id,'out',agent,answer))
    db.commit()
    return answer

def main():
    token=os.getenv('KITT_TELEGRAM_BOT_TOKEN','').strip()
    allow=allowed()
    if not token or not allow:
        raise SystemExit('KITT_TELEGRAM_BOT_TOKEN und KITT_TELEGRAM_ALLOWED_CHATS erforderlich. Keine Verbindung gestartet.')
    BASE.mkdir(parents=True,exist_ok=True)
    os.chmod(BASE,0o700)
    with sqlite3.connect(DB) as db:
        init(db)
        offset=0
        print('K.I.T.T. Telegram Bridge aktiv (nur freigegebene Chats).',flush=True)
        while True:
            try:
                updates=api(token,'getUpdates',{'offset':offset,'timeout':25,'allowed_updates':['message']})
                for update in updates:
                    offset=max(offset,update['update_id']+1)
                    msg=update.get('message') or {}
                    chat=msg.get('chat') or {}
                    chat_id=chat.get('id')
                    if chat_id not in allow or not isinstance(msg.get('text'),str): continue
                    reply=handle(db,chat_id,msg.get('message_id'),msg['text'])
                    api(token,'sendMessage',{'chat_id':chat_id,'text':reply[:4096]})
            except (urllib.error.URLError,TimeoutError,OSError,RuntimeError) as exc:
                print('Verbindungsproblem:',type(exc).__name__,flush=True)
                time.sleep(5)

if __name__=='__main__': main()
