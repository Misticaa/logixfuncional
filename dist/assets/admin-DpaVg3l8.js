import"./modulepreload-polyfill-B5Qt9EMX.js";import{S as I,C as b}from"./cpf-validator-CUIy1Khx.js";class ${constructor(){this.leads=[],this.filteredLeads=[],this.selectedLeads=new Set,this.currentPage=1,this.leadsPerPage=20,this.isLoggedIn=!1,this.systemMode="auto",this.bulkData=[],this.bulkResults=null,this.supabaseService=new I,console.log("🔧 AdminPanel inicializado com Supabase"),this.init()}async init(){console.log("🚀 Inicializando painel administrativo...");try{this.setupEventListeners(),this.checkLoginStatus(),this.isLoggedIn&&(await this.loadLeads(),this.renderLeadsTable(),this.updateLeadsCount()),console.log("✅ Painel administrativo inicializado com sucesso")}catch(e){console.error("❌ Erro na inicialização do painel:",e)}}setupEventListeners(){const e=document.getElementById("loginForm");e&&e.addEventListener("submit",m=>this.handleLogin(m));const t=document.getElementById("logoutButton");t&&t.addEventListener("click",()=>this.handleLogout());const o=document.getElementById("showLeadsView");o&&o.addEventListener("click",()=>this.showView("leadsView"));const a=document.getElementById("showAddLeadView");a&&a.addEventListener("click",()=>this.showView("addLeadView"));const n=document.getElementById("showBulkAddView");n&&n.addEventListener("click",()=>this.showView("bulkAddView"));const d=document.getElementById("addLeadForm");d&&d.addEventListener("submit",m=>this.handleAddLead(m));const s=document.getElementById("previewBulkDataButton");s&&s.addEventListener("click",()=>this.previewBulkData());const i=document.getElementById("clearBulkDataButton");i&&i.addEventListener("click",()=>this.clearBulkData());const r=document.getElementById("confirmBulkImportButton");r&&r.addEventListener("click",()=>this.confirmBulkImport());const l=document.getElementById("editBulkDataButton");l&&l.addEventListener("click",()=>this.editBulkData());const c=document.getElementById("refreshButton");c&&c.addEventListener("click",()=>this.refreshLeads());const g=document.getElementById("applyFiltersButton");g&&g.addEventListener("click",()=>this.applyFilters());const u=document.getElementById("massNextStage");u&&u.addEventListener("click",()=>this.handleMassAction("nextStage"));const p=document.getElementById("massPrevStage");p&&p.addEventListener("click",()=>this.handleMassAction("prevStage"));const h=document.getElementById("massSetStage");h&&h.addEventListener("click",()=>this.handleMassAction("setStage"));const f=document.getElementById("massDeleteLeads");f&&f.addEventListener("click",()=>this.handleMassAction("delete"))}checkLoginStatus(){localStorage.getItem("admin_logged_in")==="true"?(this.isLoggedIn=!0,this.showAdminPanel()):this.showLoginScreen()}handleLogin(e){e.preventDefault(),this.isLoggedIn=!0,localStorage.setItem("admin_logged_in","true"),this.showAdminPanel(),this.loadLeads()}handleLogout(){this.isLoggedIn=!1,localStorage.removeItem("admin_logged_in"),this.showLoginScreen()}showLoginScreen(){const e=document.getElementById("loginScreen"),t=document.getElementById("adminPanel");e&&(e.style.display="flex"),t&&(t.style.display="none")}showAdminPanel(){const e=document.getElementById("loginScreen"),t=document.getElementById("adminPanel");e&&(e.style.display="none"),t&&(t.style.display="block"),this.showView("leadsView")}showView(e){document.querySelectorAll(".admin-view").forEach(a=>{a.style.display="none"}),document.querySelectorAll(".nav-button").forEach(a=>{a.classList.remove("active")});const t=document.getElementById(e);t&&(t.style.display="block");const o=document.getElementById(`show${e.charAt(0).toUpperCase()+e.slice(1)}`);o&&o.classList.add("active")}async loadLeads(){try{if(console.log("📊 Carregando leads do Supabase..."),this.supabaseService.isSupabaseConnected()){const{data:e,error:t}=await this.supabaseService.supabase.from("leads").select("*").order("created_at",{ascending:!1});!t&&e?(this.leads=e,console.log(`📦 ${this.leads.length} leads carregados do Supabase`),localStorage.setItem("leads",JSON.stringify(this.leads))):(console.warn("⚠️ Erro ao carregar do Supabase, usando localStorage:",t),this.loadFromLocalStorage())}else console.warn("⚠️ Supabase não conectado, usando localStorage"),this.loadFromLocalStorage();this.filteredLeads=[...this.leads],this.renderLeadsTable(),this.updateLeadsCount()}catch(e){console.error("❌ Erro ao carregar leads:",e),this.loadFromLocalStorage()}}loadFromLocalStorage(){try{const e=localStorage.getItem("leads");this.leads=e?JSON.parse(e):[],console.log(`📦 ${this.leads.length} leads carregados do localStorage (fallback)`)}catch(e){console.error("❌ Erro ao carregar do localStorage:",e),this.leads=[]}}async handleAddLead(e){var a,n,d,s,i,r,l,c;e.preventDefault();const t=new FormData(e.target),o={nome_completo:t.get("nome")||((a=document.getElementById("addLeadNome"))==null?void 0:a.value),cpf:(d=t.get("cpf")||((n=document.getElementById("addLeadCPF"))==null?void 0:n.value))==null?void 0:d.replace(/[^\d]/g,""),email:t.get("email")||((s=document.getElementById("addLeadEmail"))==null?void 0:s.value),telefone:t.get("telefone")||((i=document.getElementById("addLeadTelefone"))==null?void 0:i.value),endereco:this.buildAddress(t),produtos:[{nome:t.get("produto")||((r=document.getElementById("addLeadProduto"))==null?void 0:r.value)||"Kit 12 caixas organizadoras + brinde",preco:parseFloat(t.get("valor")||((l=document.getElementById("addLeadValor"))==null?void 0:l.value)||0)}],valor_total:parseFloat(t.get("valor")||((c=document.getElementById("addLeadValor"))==null?void 0:c.value)||0),meio_pagamento:"PIX",origem:"direto",etapa_atual:1,status_pagamento:"pendente",order_bumps:[],data_compra:new Date().toISOString(),created_at:new Date().toISOString(),updated_at:new Date().toISOString()};await this.saveLeadToSupabase(o),await this.loadLeads(),this.showView("leadsView"),e.target.reset(),this.showNotification("Lead criado com sucesso!","success")}async saveLeadToSupabase(e){try{console.log("💾 Salvando lead no Supabase automaticamente...");const t=await this.supabaseService.saveLead(e);t.success?console.log("✅ Lead salvo no Supabase"):console.warn("⚠️ Erro ao salvar no Supabase:",t.error),this.saveLeadToLocalStorage(e)}catch(t){console.error("❌ Erro ao salvar lead:",t),this.saveLeadToLocalStorage(e)}}saveLeadToLocalStorage(e){try{const t=JSON.parse(localStorage.getItem("leads")||"[]");e.id=Date.now().toString(),t.push(e),localStorage.setItem("leads",JSON.stringify(t)),console.log("✅ Lead salvo no localStorage (backup)")}catch(t){console.error("❌ Erro ao salvar lead no localStorage:",t)}}buildAddress(e){var l,c,g,u,p,h,f,m;const t=e.get("endereco")||((l=document.getElementById("addLeadEndereco"))==null?void 0:l.value)||"",o=e.get("numero")||((c=document.getElementById("addLeadNumero"))==null?void 0:c.value)||"",a=e.get("complemento")||((g=document.getElementById("addLeadComplemento"))==null?void 0:g.value)||"",n=e.get("bairro")||((u=document.getElementById("addLeadBairro"))==null?void 0:u.value)||"",d=e.get("cep")||((p=document.getElementById("addLeadCEP"))==null?void 0:p.value)||"",s=e.get("cidade")||((h=document.getElementById("addLeadCidade"))==null?void 0:h.value)||"",i=e.get("estado")||((f=document.getElementById("addLeadEstado"))==null?void 0:f.value)||"",r=e.get("pais")||((m=document.getElementById("addLeadPais"))==null?void 0:m.value)||"BR";return`${t}, ${o}${a?` - ${a}`:""} - ${n} - ${s}/${i} - CEP: ${d} - ${r}`}previewBulkData(){const e=document.getElementById("bulkDataTextarea");if(!e||!e.value.trim()){this.showNotification("Por favor, cole os dados na caixa de texto","error");return}try{this.bulkData=this.parseBulkData(e.value),this.displayBulkPreview()}catch(t){console.error("❌ Erro ao processar dados:",t),this.showNotification("Erro ao processar dados: "+t.message,"error")}}parseBulkData(e){const t=e.trim().split(`
`).filter(d=>d.trim()),o=[],a=new Set,n=[];for(let d=0;d<t.length;d++){const s=t[d].trim();if(!s)continue;const i=s.split(/\t+|\s{2,}/).map(k=>k.trim());if(i.length<4){console.warn(`Linha ${d+1} ignorada: poucos campos`);continue}const[r,l,c,g,u,p,h,f,m,S,L,x,E,w]=i,y=(g||"").replace(/[^\d]/g,"");if(a.has(y)){n.push({nome:r,cpf:y});continue}a.add(y);const B=this.buildAddressFromFields({rua:h||"",numero:f||"",complemento:m||"",bairro:S||"",cep:L||"",cidade:x||"",estado:E||"",pais:w||"BR"});o.push({nome_completo:r||"",email:l||"",telefone:c||"",cpf:y,produto:u||"Kit 12 caixas organizadoras + brinde",valor_total:parseFloat(p)||67.9,endereco:B,meio_pagamento:"PIX",origem:"direto",etapa_atual:1,status_pagamento:"pendente",order_bumps:[],produtos:[{nome:u||"Kit 12 caixas organizadoras + brinde",preco:parseFloat(p)||67.9}],lineNumber:d+1})}return console.log(`📊 Dados processados: ${o.length} leads, ${n.length} duplicatas removidas`),{leads:o,duplicatesRemoved:n}}buildAddressFromFields({rua:e,numero:t,complemento:o,bairro:a,cep:n,cidade:d,estado:s,pais:i}){return`${e}, ${t}${o?` - ${o}`:""} - ${a} - ${d}/${s} - CEP: ${n} - ${i}`}displayBulkPreview(){const e=document.getElementById("bulkPreviewSection"),t=document.getElementById("bulkPreviewContainer"),o=document.getElementById("confirmBulkImportButton"),a=document.getElementById("previewSummary");if(!e||!t)return;e.style.display="block";let n=`
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Nome</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Email</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Telefone</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">CPF</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Produto</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Valor</th>
                    </tr>
                </thead>
                <tbody>
        `;this.bulkData.leads.forEach((d,s)=>{const i=s%2===0?"background: #f9f9f9;":"";n+=`
                <tr style="${i}">
                    <td style="padding: 6px; border: 1px solid #ddd;">${d.nome_completo}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${d.email}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${d.telefone}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${b.formatCPF(d.cpf)}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${d.produto}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">R$ ${d.valor_total.toFixed(2)}</td>
                </tr>
            `}),n+="</tbody></table>",this.bulkData.duplicatesRemoved.length>0&&(n+=`
                <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
                    <strong>📋 Duplicatas Removidas (${this.bulkData.duplicatesRemoved.length}):</strong>
                    <ul style="margin: 5px 0 0 20px;">
                        ${this.bulkData.duplicatesRemoved.map(d=>`<li>${d.nome} - CPF: ${this.formatCPF(d.cpf)}</li>`).join("")}
                    </ul>
                </div>
            `),t.innerHTML=n,a&&(a.textContent=`${this.bulkData.leads.length} leads para importar${this.bulkData.duplicatesRemoved.length>0?`, ${this.bulkData.duplicatesRemoved.length} duplicatas removidas`:""}`),o&&(o.style.display="inline-block")}async confirmBulkImport(){if(!this.bulkData||!this.bulkData.leads.length){this.showNotification("Nenhum dado para importar","error");return}const e=document.getElementById("confirmBulkImportButton");if(!e)return;const t=e.innerHTML;e.innerHTML='<i class="fas fa-spinner fa-spin"></i> Importando...',e.disabled=!0;try{const o=await this.processBulkImport();this.displayBulkResults(o)}catch(o){console.error("❌ Erro na importação em massa:",o),this.showNotification("Erro na importação: "+o.message,"error")}finally{e.innerHTML=t,e.disabled=!1}}async processBulkImport(){const e={success:[],errors:[],total:this.bulkData.leads.length};for(const t of this.bulkData.leads)try{const o=this.validateLeadData(t);if(!o.isValid){e.errors.push({nome:t.nome_completo,cpf:t.cpf,error:o.error,type:"validation"});continue}if((await this.supabaseService.getLeadByCPF(t.cpf)).success){e.errors.push({nome:t.nome_completo,cpf:t.cpf,error:"CPF já existe no sistema",type:"duplicate"});continue}const n={...t,id:Date.now().toString()+Math.random().toString(36).substr(2,9),created_at:new Date().toISOString(),updated_at:new Date().toISOString()},d=await this.supabaseService.saveLead(n);d.success?e.success.push({nome:t.nome_completo,cpf:t.cpf,id:n.id}):e.errors.push({nome:t.nome_completo,cpf:t.cpf,error:d.error,type:"database"})}catch(o){e.errors.push({nome:t.nome_completo,cpf:t.cpf,error:o.message,type:"exception"})}return e}validateLeadData(e){return!e.nome_completo||e.nome_completo.trim().length<2?{isValid:!1,error:"Nome completo é obrigatório (mínimo 2 caracteres)"}:!e.email||!this.isValidEmail(e.email)?{isValid:!1,error:"Email é obrigatório e deve ter formato válido"}:!e.telefone||e.telefone.length<10?{isValid:!1,error:"Telefone é obrigatório (mínimo 10 dígitos)"}:!e.cpf||e.cpf.length!==11?{isValid:!1,error:"CPF é obrigatório e deve ter 11 dígitos"}:this.isValidCPF(e.cpf)?{isValid:!0}:{isValid:!1,error:"CPF inválido (formato ou dígitos verificadores incorretos)"}}isValidCPF(e){const t=e.replace(/[^\d]/g,"");return!(t.length!==11||/^(\d)\1{10}$/.test(t))}isValidEmail(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}displayBulkResults(e){const t=document.getElementById("bulkResultsSection"),o=document.getElementById("bulkResultsContainer");if(!t||!o)return;t.style.display="block";let a=`
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        `;a+=`
            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px;">
                <h4 style="color: #155724; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-check-circle"></i>
                    Pedidos Postados com Sucesso (${e.success.length})
                </h4>
        `,e.success.length>0?(a+='<ul style="margin: 0; padding-left: 20px; max-height: 200px; overflow-y: auto;">',e.success.forEach(s=>{a+=`<li style="margin-bottom: 5px; color: #155724;">
                    <strong>${s.nome}</strong> - CPF: ${b.formatCPF(s.cpf)}
                </li>`}),a+="</ul>",a+=`
                <div style="margin-top: 15px; text-align: center;">
                    <button id="goToLeadsListButton" style="
                        background: #28a745;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='#218838'" onmouseout="this.style.background='#28a745'">
                        <i class="fas fa-list"></i> Ir para Lista
                    </button>
                </div>
            `):a+='<p style="color: #856404; font-style: italic;">Nenhum pedido foi postado com sucesso.</p>',a+="</div>",a+=`
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px;">
                <h4 style="color: #721c24; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-exclamation-triangle"></i>
                    Pedidos com Erro (${e.errors.length})
                </h4>
        `,e.errors.length>0?(a+=`
                <div style="max-height: 200px; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead>
                            <tr style="background: #f5c6cb;">
                                <th style="padding: 6px; border: 1px solid #f1b0b7; text-align: left;">Nome</th>
                                <th style="padding: 6px; border: 1px solid #f1b0b7; text-align: left;">CPF</th>
                                <th style="padding: 6px; border: 1px solid #f1b0b7; text-align: left;">Motivo do Erro</th>
                            </tr>
                        </thead>
                        <tbody>
            `,e.errors.forEach((s,i)=>{const r=i%2===0?"background: #fdf2f2;":"";a+=`
                    <tr style="${r}">
                        <td style="padding: 6px; border: 1px solid #f1b0b7;">${s.nome}</td>
                        <td style="padding: 6px; border: 1px solid #f1b0b7;">${this.formatCPF(s.cpf)}</td>
                        <td style="padding: 6px; border: 1px solid #f1b0b7; color: #721c24;">
                            <strong>${this.getErrorTypeLabel(s.type)}:</strong> ${s.error}
                        </td>
                    </tr>
                `}),a+="</tbody></table></div>"):a+='<p style="color: #155724; font-style: italic;">Nenhum erro encontrado! 🎉</p>',a+="</div></div>",a+=`
            <div style="background: #e2e3e5; border: 1px solid #d6d8db; border-radius: 8px; padding: 15px; text-align: center;">
                <h4 style="color: #383d41; margin-bottom: 10px;">📊 Resumo da Importação</h4>
                <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <strong style="color: #28a745;">${e.success.length}</strong>
                        <span style="color: #6c757d;"> Sucessos</span>
                    </div>
                    <div>
                        <strong style="color: #dc3545;">${e.errors.length}</strong>
                        <span style="color: #6c757d;"> Erros</span>
                    </div>
                    <div>
                        <strong style="color: #007bff;">${e.total}</strong>
                        <span style="color: #6c757d;"> Total Processados</span>
                    </div>
                    <div>
                        <strong style="color: #ffc107;">${this.bulkData.duplicatesRemoved.length}</strong>
                        <span style="color: #6c757d;"> Duplicatas Removidas</span>
                    </div>
                </div>
            </div>
        `,o.innerHTML=a;const n=document.getElementById("goToLeadsListButton");n&&n.addEventListener("click",()=>{this.showView("leadsView"),this.refreshLeads()});const d=document.getElementById("bulkPreviewSection");d&&(d.style.display="none"),this.bulkResults=e}getErrorTypeLabel(e){return{validation:"Dados Inválidos",duplicate:"Duplicidade",database:"Erro de Banco",exception:"Erro Interno"}[e]||"Erro"}clearBulkData(){const e=document.getElementById("bulkDataTextarea"),t=document.getElementById("bulkPreviewSection"),o=document.getElementById("bulkResultsSection");e&&(e.value=""),t&&(t.style.display="none"),o&&(o.style.display="none"),this.bulkData=[],this.bulkResults=null}editBulkData(){const e=document.getElementById("bulkPreviewSection");e&&(e.style.display="none");const t=document.getElementById("bulkDataTextarea");t&&t.focus()}async refreshLeads(){console.log("🔄 Atualizando lista de leads..."),await this.loadLeads(),this.showNotification("Lista atualizada com sucesso!","success")}renderLeadsTable(){const e=document.getElementById("leadsTableBody"),t=document.getElementById("emptyState");if(!e)return;if(this.filteredLeads.length===0){e.innerHTML="",t&&(t.style.display="block");return}t&&(t.style.display="none");const o=(this.currentPage-1)*this.leadsPerPage,a=o+this.leadsPerPage,n=this.filteredLeads.slice(o,a);let d="";n.forEach(s=>{const i=this.selectedLeads.has(s.id||s.cpf),r=Array.isArray(s.produtos)?s.produtos:[],l=r.length>0?r[0].nome:"Produto não informado",c=this.formatCPF(s.cpf||"");d+=`
                <tr style="${i?"background-color: #e3f2fd;":""}">
                    <td>
                        <input type="checkbox" ${i?"checked":""} 
                               onchange="adminPanel.toggleLeadSelection('${s.id||s.cpf}', this.checked)">
                    </td>
                    <td>${s.nome_completo||"N/A"}</td>
                    <td>${c}</td>
                    <td>${s.email||"N/A"}</td>
                    <td>${s.telefone||"N/A"}</td>
                    <td>${l}</td>
                    <td>R$ ${(s.valor_total||0).toFixed(2)}</td>
                    <td>${this.formatDate(s.created_at)}</td>
                    <td>
                        <span class="stage-badge ${this.getStageClass(s.etapa_atual)}">
                            ${s.etapa_atual||1}
                        </span>
                    </td>
                    <td>${this.formatDate(s.updated_at)}</td>
                    <td>
                        <div class="lead-actions">
                            <button class="action-button edit" onclick="adminPanel.editLead('${s.id||s.cpf}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-button next" onclick="adminPanel.nextStage('${s.id||s.cpf}')">
                                <i class="fas fa-forward"></i>
                            </button>
                            <button class="action-button prev" onclick="adminPanel.prevStage('${s.id||s.cpf}')">
                                <i class="fas fa-backward"></i>
                            </button>
                            <button class="action-button delete" onclick="adminPanel.deleteLead('${s.id||s.cpf}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `}),e.innerHTML=d,this.updateSelectedCount()}formatCPF(e){const t=e.replace(/[^\d]/g,"");return t.length<=11?t.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,"$1.$2.$3-$4"):e}toggleLeadSelection(e,t){t?this.selectedLeads.add(e):this.selectedLeads.delete(e),this.updateSelectedCount()}toggleSelectAll(e){const t=document.querySelectorAll('#leadsTableBody input[type="checkbox"]');e?this.filteredLeads.forEach(o=>{this.selectedLeads.add(o.id||o.cpf)}):this.selectedLeads.clear(),t.forEach(o=>{o.checked=e}),this.renderLeadsTable(),this.updateSelectedCount()}updateSelectedCount(){const e=document.getElementById("selectedCount"),t=document.querySelectorAll(".mass-action-button"),o=document.querySelectorAll(".action-count"),a=this.selectedLeads.size;e&&(e.textContent=`${a} selecionados`),t.forEach(n=>{n.disabled=a===0,a===0?(n.style.opacity="0.5",n.style.cursor="not-allowed"):(n.style.opacity="1",n.style.cursor="pointer")}),o.forEach(n=>{n.textContent=`(${a} leads)`})}updateLeadsCount(){const e=document.getElementById("leadsCount");e&&(e.textContent=`${this.filteredLeads.length} leads`)}formatDate(e){if(!e)return"N/A";try{return new Date(e).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return"Data inválida"}}getStageClass(e){return e>=12?"completed":e>=6?"pending":""}showNotification(e,t="info"){const o=document.createElement("div");switch(o.style.cssText=`
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 9999;
            animation: slideInRight 0.3s ease;
        `,t){case"success":o.style.background="#28a745";break;case"error":o.style.background="#dc3545";break;default:o.style.background="#007bff"}o.textContent=e,document.body.appendChild(o),setTimeout(()=>{o.style.animation="slideOutRight 0.3s ease",setTimeout(()=>{o.parentNode&&o.remove()},300)},3e3)}applyFilters(){console.log("🔍 Aplicando filtros...")}handleMassAction(e){console.log(`🔧 Ação em massa: ${e} para ${this.selectedLeads.size} leads`)}editLead(e){console.log(`✏️ Editando lead: ${e}`);const t=JSON.parse(localStorage.getItem("leads")||"[]").find(o=>(o.id||o.cpf)===e);t&&console.log("Lead encontrado para edição:",t)}nextStage(e){console.log(`⏭️ Próxima etapa para lead: ${e}`),this.updateLeadStage(e,1)}prevStage(e){console.log(`⏮️ Etapa anterior para lead: ${e}`),this.updateLeadStage(e,-1)}async updateLeadStage(e,t){try{const o=JSON.parse(localStorage.getItem("leads")||"[]"),a=o.findIndex(n=>(n.id||n.cpf)===e);if(a!==-1){const n=o[a].etapa_atual||1,d=Math.max(1,Math.min(16,n+t));o[a].etapa_atual=d,o[a].updated_at=new Date().toISOString(),localStorage.setItem("leads",JSON.stringify(o));const s=o[a].cpf;if(s){console.log("🔄 Sincronizando etapa com Supabase...");const i=await this.supabaseService.updateLeadStage(s,d);i.success?console.log("✅ Etapa sincronizada com Supabase"):console.warn("⚠️ Erro ao sincronizar com Supabase:",i.error)}await this.loadLeads(),console.log(`✅ Etapa atualizada para ${d}`)}}catch(o){console.error("❌ Erro ao atualizar etapa:",o)}}async deleteLead(e){if(confirm("Tem certeza que deseja excluir este lead?")){console.log(`🗑️ Excluindo lead: ${e}`);try{const t=JSON.parse(localStorage.getItem("leads")||"[]").filter(o=>(o.id||o.cpf)!==e);if(localStorage.setItem("leads",JSON.stringify(t)),this.supabaseService.isSupabaseConnected()){const o=this.leads.find(a=>(a.id||a.cpf)===e);if(o&&o.cpf){console.log("🗑️ Removendo do Supabase...");const{error:a}=await this.supabaseService.supabase.from("leads").delete().eq("cpf",o.cpf.replace(/[^\d]/g,""));a?console.warn("⚠️ Erro ao remover do Supabase:",a):console.log("✅ Lead removido do Supabase")}}await this.loadLeads(),this.showNotification("Lead excluído com sucesso!","success")}catch(t){console.error("❌ Erro ao excluir lead:",t),this.showNotification("Erro ao excluir lead","error")}}}}let v=null;document.addEventListener("DOMContentLoaded",()=>{v=new $});window.adminPanel=v;
