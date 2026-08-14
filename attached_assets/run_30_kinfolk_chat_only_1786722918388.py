import concurrent.futures, json, os, statistics, time, requests
BASE=os.environ.get('BASE_URL','https://api-server-production-a991.up.railway.app').rstrip('/')
PASSWORD=os.environ.get('TEST_PASSWORD','ManusAudit@2026!')
EMAILS=[f'manus.tester.{i:02d}@mwm.audit' for i in range(1,31)]
QUESTIONS=['What are some Black-owned restaurants in Atlanta?','Tell me about important Black contributions to pop culture.','What can I learn from the Divine Nine library topic?']

def staged_login(email):
    last=None
    for attempt in range(8):
        t=time.perf_counter()
        try:
            r=requests.post(f'{BASE}/api/auth/login-email',json={'email':email,'password':PASSWORD},timeout=30)
            last={'status':r.status_code,'ms':round((time.perf_counter()-t)*1000,1)}
            if r.status_code==200:
                p=r.json(); token=p.get('token')
                if token: return {'email':email,'token':token,'status':200}
            if r.status_code!=429: return {'email':email,**last}
        except Exception as e: last={'error_type':type(e).__name__}
        time.sleep(2+attempt)
    return {'email':email,**(last or {'status':None})}

def one_chat(item):
    email,token,q=item;t=time.perf_counter()
    try:
        r=requests.post(f'{BASE}/api/kinfolk/chat',headers={'Authorization':f'Bearer {token}','Content-Type':'application/json'},json={'message':q},timeout=120)
        try: b=r.json()
        except Exception: b={}
        reply=b.get('reply') if isinstance(b,dict) else None
        return {'account':email.split('@')[0],'status':r.status_code,'ms':round((time.perf_counter()-t)*1000,1),'has_reply':isinstance(reply,str) and len(reply.strip())>20,'reply_len':len(reply) if isinstance(reply,str) else 0,'has_sources':isinstance(b.get('sources'),list) if isinstance(b,dict) else False,'degraded':b.get('degraded') if isinstance(b,dict) else None,'error_code':b.get('code') if isinstance(b,dict) and r.status_code>=400 else None}
    except Exception as e:return {'account':email.split('@')[0],'status':None,'ms':round((time.perf_counter()-t)*1000,1),'has_reply':False,'error_type':type(e).__name__}

def summary(rows):
    s={}
    for x in rows:s[str(x.get('status','ERROR'))]=s.get(str(x.get('status','ERROR')),0)+1
    lat=[x['ms'] for x in rows if isinstance(x.get('ms'),(int,float))]
    return {'count':len(rows),'status_counts':s,'usable_replies':sum(x.get('has_reply',False) for x in rows),'with_sources_array':sum(x.get('has_sources',False) for x in rows),'degraded_count':sum(x.get('degraded') is True for x in rows),'median_ms':statistics.median(lat) if lat else None,'max_ms':max(lat) if lat else None,'error_types':sorted(set(x.get('error_type') for x in rows if x.get('error_type')))}

# Login is intentionally staged so this test measures chat capacity rather than auth throttling.
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex: logins=list(ex.map(staged_login,EMAILS))
valid=[x for x in logins if x.get('token')]
inputs=[(x['email'],x['token'],QUESTIONS[i%3]) for i,x in enumerate(valid)]
t=time.perf_counter()
with concurrent.futures.ThreadPoolExecutor(max_workers=30) as ex: chats=list(ex.map(one_chat,inputs))
wall=round((time.perf_counter()-t)*1000,1)
print(json.dumps({'base_url':BASE,'users_requested':30,'staged_login_summary':summary(logins),'chat_summary':summary(chats),'chat_wall_clock_ms':wall,'chat_users':len(inputs),'questions_distributed':{'food':10,'pop_culture':10,'library':10},'tokens_redacted':True,'response_bodies_redacted':True,'writes_performed':False,'result':'PASS' if len(valid)==30 and all(x.get('status')==200 and x.get('has_reply') for x in chats) else 'FAIL'},indent=2))
