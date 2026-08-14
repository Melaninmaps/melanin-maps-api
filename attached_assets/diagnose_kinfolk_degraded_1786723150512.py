import concurrent.futures, json, os, time, requests
BASE=os.environ.get('BASE_URL','https://api-server-production-a991.up.railway.app').rstrip('/')
PASSWORD=os.environ.get('TEST_PASSWORD','ManusAudit@2026!')
EMAILS=[f'manus.tester.{i:02d}@mwm.audit' for i in range(1,31)]
QUESTIONS=[('food','What are some Black-owned restaurants in Atlanta?'),('pop_culture','Tell me about important Black contributions to pop culture.'),('library','What can I learn from the Divine Nine library topic?')]

def login(email):
    for attempt in range(8):
        try:
            r=requests.post(f'{BASE}/api/auth/login-email',json={'email':email,'password':PASSWORD},timeout=30)
            if r.status_code==200:
                p=r.json();
                if p.get('token'): return (email,p['token'])
            if r.status_code!=429: return None
        except Exception: pass
        time.sleep(2+attempt)
    return None

def chat(item):
    idx,(email,token)=item
    kind,q=QUESTIONS[idx%3]
    t=time.perf_counter()
    try:
        r=requests.post(f'{BASE}/api/kinfolk/chat',headers={'Authorization':f'Bearer {token}','Content-Type':'application/json'},json={'message':q},timeout=120)
        try:b=r.json()
        except Exception:b={}
        reply=b.get('reply') if isinstance(b,dict) else None
        return {'question_class':kind,'status':r.status_code,'latency_ms':round((time.perf_counter()-t)*1000,1),'has_reply':isinstance(reply,str) and len(reply.strip())>20,'reply_len':len(reply) if isinstance(reply,str) else 0,'degraded':b.get('degraded') if isinstance(b,dict) else None,'degraded_reason':b.get('degradedReason') if isinstance(b,dict) else None,'code':b.get('code') if r.status_code>=400 and isinstance(b,dict) else None,'has_library_action':bool(b.get('libraryAction')) if isinstance(b,dict) else False,'source_count':len(b.get('sources',[])) if isinstance(b,dict) and isinstance(b.get('sources'),list) else None}
    except Exception as e:return {'question_class':kind,'status':None,'error_type':type(e).__name__}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex: logins=list(ex.map(login,EMAILS))
valid=[x for x in logins if x]
with concurrent.futures.ThreadPoolExecutor(max_workers=30) as ex: rows=list(ex.map(chat,enumerate(valid)))
print(json.dumps({'users_logged_in':len(valid),'total_responses':len(rows),'status_counts':{str(s):sum(1 for r in rows if r.get('status')==s) for s in sorted(set(r.get('status') for r in rows))},'degraded_rows':[r for r in rows if r.get('degraded') is True],'failed_rows':[r for r in rows if r.get('status')!=200],'class_summary':{k:{'count':sum(1 for r in rows if r.get('question_class')==k),'degraded':sum(1 for r in rows if r.get('question_class')==k and r.get('degraded') is True),'usable':sum(1 for r in rows if r.get('question_class')==k and r.get('has_reply'))} for k,_ in QUESTIONS},'tokens_redacted':True,'response_bodies_redacted':True,'writes_performed':False},indent=2))
