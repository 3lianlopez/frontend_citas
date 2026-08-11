const API_ROOT_DEFAULT='https://backendcitas-production-2e49.up.railway.app';
const API_ROOT=localStorage.getItem('tucitas.apiRoot')||API_ROOT_DEFAULT;
const AUTH_KEY='tucitas.auth';
const PENDING_OTP_EMAIL_KEY='tucitas.pendingOtpEmail';

function authData(){try{return JSON.parse(sessionStorage.getItem(AUTH_KEY)||'null')}catch{return null}}
function saveAuth(data){sessionStorage.setItem(AUTH_KEY,JSON.stringify(data))}
function clearAuth(){sessionStorage.removeItem(AUTH_KEY)}
function authHeaders(){const a=authData();return a?.token?{Authorization:`Bearer ${a.token}`}:{}}
function apiError(body,status){const e=new Error(body?.message||body?.detail||body?.error||`La petición falló con estado ${status}`);e.status=status;return e}
async function apiFetch(path,options={}){const r=await fetch(`${API_ROOT}${path}`,{...options,headers:{'Content-Type':'application/json',Accept:'application/json',...authHeaders(),...(options.headers||{})}});let body=null;try{body=await r.json()}catch{}if(!r.ok)throw apiError(body,r.status);return body}
function payloadOf(body){return body?.data??body}
function redirectIfLogged(){if(authData()?.token)location.replace('index.html')}
function requireAuth(){if(!authData()?.token){location.replace('index.html');return false}return true}
function showAuthError(message){const el=document.querySelector('#errorBox');if(el){el.textContent=message;el.classList.toggle('show',Boolean(message))}}
function friendlyAuthError(e){return e instanceof TypeError?'No se pudo conectar con el servicio.':e.message||'No se pudo completar la operación.'}

function wireAuthForms(){
  const form=document.querySelector('#authForm');
  if(!form)return;

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!form.reportValidity())return;

    const btn=form.querySelector('button[type=submit]');
    btn.disabled=true;
    showAuthError('');

    try{
      const isRegister=form.dataset.mode==='register';
      const data=Object.fromEntries(new FormData(form));

      if(isRegister&&data.password!==data.confirmPassword){
        throw new Error('Las contraseñas no coinciden.');
      }

      const body=isRegister
        ?{nombres:data.nombres,apellidos:data.apellidos,email:data.email,password:data.password}
        :{email:data.email,password:data.password};

      const result=payloadOf(await apiFetch(isRegister?'/api/auth/register':'/api/auth/login',{
        method:'POST',
        body:JSON.stringify(body)
      }));

      if(isRegister){
        sessionStorage.setItem(PENDING_OTP_EMAIL_KEY,data.email);
        location.replace('verificar-otp.html');
        return;
      }

      const token=result?.token||result?.accessToken;
      if(!token)throw new Error('El servicio no devolvió un token de acceso.');
      saveAuth({token,email:data.email,nombres:result.nombres,apellidos:result.apellidos});
      location.replace('citas.html');
    }catch(err){
      showAuthError(friendlyAuthError(err));
    }finally{
      btn.disabled=false;
    }
  });
}

function wireOtpForm(){
  const form=document.querySelector('#otpForm');
  if(!form)return;

  const email=sessionStorage.getItem(PENDING_OTP_EMAIL_KEY);
  if(!email){
    location.replace('registro.html');
    return;
  }

  const emailInput=form.querySelector('#email');
  const otpInput=form.querySelector('#otp');
  emailInput.value=email;
  otpInput.focus();

  otpInput.addEventListener('input',()=>{
    otpInput.value=otpInput.value.replace(/\D/g,'').slice(0,6);
  });

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!form.reportValidity())return;

    const btn=form.querySelector('button[type=submit]');
    btn.disabled=true;
    showAuthError('');

    try{
      await apiFetch('/api/auth/verify-otp',{
        method:'POST',
        body:JSON.stringify({email,otp:otpInput.value})
      });
      sessionStorage.removeItem(PENDING_OTP_EMAIL_KEY);
      location.replace('index.html?verified=1');
    }catch(err){
      showAuthError(friendlyAuthError(err));
      otpInput.select();
    }finally{
      btn.disabled=false;
    }
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  if(document.body.dataset.auth==='guest'){
    redirectIfLogged();
    wireAuthForms();
    wireOtpForm();
  }
});
