(()=>{
const q=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)],key='finsyndeo-whole-review-unified-draft-v1';
const fields=s=>[...s.querySelectorAll('input,select,textarea')].filter(e=>!e.closest('.country-picker'));let draft;const saved=new Map();
try{draft=JSON.parse(localStorage.getItem(key)||'null');if(draft&&draft.version<5)draft.screens.forEach(st=>{const screen=q('[data-screen="'+st.id+'"]');if(screen)fields(screen).forEach((e,i)=>{if(st.values[i])saved.set(e,st.values[i]);});});}catch(e){}
const style=document.createElement('style');style.textContent='.ubo-grid .country-picker details{margin:0!important;min-height:46px;box-sizing:border-box}.ubo-grid .country-picker{margin:0}';document.head.append(style);
all('#fi-type input').forEach(e=>{e.type='radio';e.name='institution-type';});
const msb=document.createElement('label');msb.className='field';msb.id='msb-country-field';msb.hidden=true;msb.innerHTML='<span>Country of MSB registration</span><select id="msb-country" required><option value="">Select country</option></select>';countryNames.forEach(c=>msb.querySelector('select').add(new Option(c,c)));q('#fi-type').after(msb);
const assets=q('#pb-assets').closest('label'),hint=assets.nextElementSibling,elig=q('#pb-eligibility'),discuss=elig.nextElementSibling;
q('#pb-needs-other').after(assets);assets.after(hint);hint.after(elig);if(discuss?.tagName==='BUTTON')elig.after(discuss);
const scope=document.createElement('p');scope.className='hint';scope.textContent='Confirm the applicant’s actual legal form. Institution type does not establish its legal form or authorisation.';q('#entity-type').closest('label').after(scope);
let corporateType=q('#entity-type').value,wasFI=false;
function sync(){const fi=q('#applicant').value==='institution';const type=q('#entity-type');if(fi&&!wasFI){corporateType=type.value;}if(!fi&&wasFI)type.value=corporateType;type.closest('label').hidden=false;scope.hidden=!fi;wasFI=fi;
const op=q('#fi-account-model input');op.checked=true;op.disabled=true;op.parentElement.title='Required for this application';
msb.hidden=!all('#fi-type input:checked').some(e=>e.value==='Money services business (MSB)');
q('#canadian-msb').hidden=msb.hidden||q('#msb-country').value!=='Canada';q('#fi-operational-flows').hidden=false;
}
['casp-travel','casp-chain'].forEach((id,i)=>{const h=document.createElement('p');h.className='hint';h.textContent=i?'Checks blockchain addresses and transfers for sanctions exposure and suspicious activity. Requirements depend on your jurisdiction and services.':'Processes for collecting and sharing sender and recipient information with crypto transfers where required by law.';q('#'+id).closest('label').append(h);});
const old=refreshFlow;refreshFlow=function(){old();sync();};window.refreshFlow=refreshFlow;document.addEventListener('change',sync);sync();
if(draft&&draft.version<5){let selected=false;all('#fi-type input').forEach(e=>{const v=saved.get(e);if(v?.checked){v.checked=!selected;selected=true;}});draft.screens=all('.screen').map(s=>({id:s.dataset.screen,values:fields(s).map(e=>saved.get(e)||{value:e.value,checked:e.checked}),pickers:draft.screens.find(x=>x.id===s.dataset.screen)?.pickers||[]}));draft.version=5;localStorage.setItem(key,JSON.stringify(draft));}
})();
