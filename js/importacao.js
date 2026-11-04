(() => {
 const $ = s => document.querySelector(s);
 const esc = x => String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const heads = {codigo:'Código',nome:'Produto',categoria:'Categoria',quantidade:'Quantidade',estoque_minimo:'Estoque mínimo',preco_custo:'Preço de custo',preco_venda:'Preço de venda',descricao:'Descrição'};
 let empresaId, papel, pending=null;
 const feedback=(s,bad=false)=>{ $('#import-feedback').textContent=s;$('#import-feedback').className='text-sm mt-4 '+(bad?'text-red-700':'text-slate-500'); };
 const integer = x => {const s=String(x??'').trim();return /^\d+$/.test(s)&&Number.isSafeInteger(Number(s))&&Number(s)<=2147483647?Number(s):null;};
 const money = x => {if(x===null||x===undefined||String(x).trim()==='')return null;let s=String(x).trim();if(/^\d{1,3}(\.\d{3})+,\d{1,2}$/.test(s))s=s.replace(/\./g,'').replace(',','.');else if(/^\d+,\d{1,2}$/.test(s))s=s.replace(',','.');if(!/^\d+(\.\d{1,2})?$/.test(s)||Number(s)>9999999999.99)return undefined;return s;};
 function clear(){pending=null;$('#preview').hidden=true;$('#preview-linhas').innerHTML='';}
 async function readFile(file){const ab=await file.arrayBuffer();const book=XLSX.read(ab,{type:'array',cellDates:false});const sheet=book.Sheets['Produtos']||book.Sheets['Estoque']||book.Sheets[book.SheetNames[0]];return XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:true,blankrows:false});}
 async function preview(event){event.preventDefault();clear();const file=$('#arquivo').files[0],tipo=$('#tipo').value; if(!file)return;
 if(!/\.xlsx?$/i.test(file.name)||file.size>5*1024*1024)return feedback('Envie um Excel .xlsx/.xls de até 5 MB.',true);
 const button=$('#import-form button[type=submit]');button.disabled=true;feedback('Validando planilha...');
 try{
  if(!window.XLSX)throw Error('Leitor Excel indisponível. Confira a conexão com a internet.');
  const rows=await readFile(file);if(rows.length<2)throw Error('Planilha vazia.');
  const expected=tipo==='cadastro'?Object.keys(heads):['codigo','quantidade'];
  const actual=rows[0].map(x=>String(x).trim());
  if(expected.some((k,i)=>actual[i]!==heads[k])||actual.length!==expected.length)throw Error('Cabeçalho diferente do modelo oficial. Baixe o modelo correto e mantenha os nomes e a ordem das colunas.');
  const items=[],seen=new Set(),errors=[];
  for(let i=1;i<rows.length;i++){
   const cells=rows[i];if(cells.every(v=>String(v??'').trim()===''))continue;
   const item={};expected.forEach((k,j)=>item[k]=cells[j]);
   item.codigo=String(item.codigo??'').trim();item.quantidade=integer(item.quantidade);
   if(!item.codigo||item.codigo.length>60)errors.push(`Linha ${i+1}: código obrigatório (até 60 caracteres).`);
   if(seen.has(item.codigo))errors.push(`Linha ${i+1}: código duplicado ${item.codigo}.`);seen.add(item.codigo);
   if(item.quantidade===null)errors.push(`Linha ${i+1}: quantidade inteira não negativa obrigatória.`);
   if(tipo==='cadastro'){
    item.nome=String(item.nome??'').trim();item.categoria=String(item.categoria??'').trim();item.descricao=String(item.descricao??'').trim();
    item.estoque_minimo=integer(item.estoque_minimo);item.preco_custo=money(item.preco_custo);item.preco_venda=money(item.preco_venda);
    if(item.nome.length<2||item.nome.length>200)errors.push(`Linha ${i+1}: nome inválido.`);
    if(item.estoque_minimo===null)errors.push(`Linha ${i+1}: estoque mínimo inválido.`);
    if(item.preco_custo===undefined||item.preco_venda===undefined)errors.push(`Linha ${i+1}: preço inválido.`);
    if(item.descricao.length>3000)errors.push(`Linha ${i+1}: descrição muito longa.`);
   }
   items.push(item);
  }
  if(items.length<1||items.length>1000)errors.push('A importação deve conter de 1 a 1000 produtos.');
  if(errors.length)throw Error(errors.slice(0,8).join('\n')+(errors.length>8?`\n... e mais ${errors.length-8} erro(s).`:''));
  const [p,c]=await Promise.all([window.stoka.from('produtos').select('codigo,nome,quantidade,ativo').eq('empresa_id',empresaId).in('codigo',items.map(x=>x.codigo)),window.stoka.from('categorias').select('nome').eq('empresa_id',empresaId)]);
  if(p.error)throw p.error;if(c.error)throw c.error;
  const products=new Map((p.data||[]).map(x=>[x.codigo,x]));const categories=new Set((c.data||[]).map(x=>x.nome));
  const actions=[];
  for(const [i,item] of items.entries()){
   const old=products.get(item.codigo);
   if(old&&!old.ativo)errors.push(`Linha ${i+2}: produto ${item.codigo} está desativado.`);
   if(!old&&tipo==='atualizacao')errors.push(`Linha ${i+2}: produto ${item.codigo} não existe.`);
   if(tipo==='cadastro'&&item.categoria&&!categories.has(item.categoria))errors.push(`Linha ${i+2}: categoria "${item.categoria}" não cadastrada.`);
   actions.push(old?(old.quantidade===item.quantidade?'Sem alteração':'Atualizar quantidade'):'Cadastrar');
  }
  if(errors.length)throw Error(errors.slice(0,8).join('\n'));
  pending={file:file.name,tipo,items};
  $('#preview-resumo').textContent=`${items.length} linha(s): ${actions.filter(x=>x==='Cadastrar').length} cadastro(s), ${actions.filter(x=>x==='Atualizar quantidade').length} atualização(ões) e ${actions.filter(x=>x==='Sem alteração').length} sem mudança. Para existentes, apenas a quantidade será alterada.`;
  $('#preview-linhas').innerHTML=items.map((x,i)=>{const old=products.get(x.codigo);return `<tr class="border-b"><td class="p-2">${i+2}</td><td class="p-2">${esc(x.codigo)}</td><td class="p-2">${esc(old?.nome||x.nome||'—')}</td><td class="p-2">${old?.quantidade??'—'}</td><td class="p-2">${x.quantidade}</td><td class="p-2">${actions[i]}</td></tr>`;}).join('');
  $('#preview').hidden=false;feedback('Validação concluída. Confira a prévia antes de confirmar.');
 }catch(e){feedback(e.message,true);await Swal.fire({icon:'error',title:'Planilha não validada',text:e.message});}finally{button.disabled=false;}
 }
 async function confirm(){if(!pending)return;const ok=await Swal.fire({icon:'question',title:'Confirmar importação?',text:`Serão processadas ${pending.items.length} linhas. As quantidades existentes serão substituídas.`,showCancelButton:true,confirmButtonText:'Importar',cancelButtonText:'Cancelar',confirmButtonColor:'#0d9488'});if(!ok.isConfirmed)return;
 const b=$('#confirmar');b.disabled=true;try{const {data,error}=await window.stoka.rpc('stoka_importar_planilha',{p_empresa_id:empresaId,p_tipo:pending.tipo,p_nome_arquivo:pending.file,p_linhas:pending.items});if(error)throw error;clear();$('#import-form').reset();feedback('Importação concluída e registrada no Supabase.');await Swal.fire({icon:'success',title:'Importação concluída',text:`${data.criados} criado(s), ${data.atualizados} atualizado(s), ${data.inalterados} sem alteração.`});}catch(e){await Swal.fire({icon:'error',title:'Importação não realizada',text:e.message});}finally{b.disabled=false;}
 }
 window.addEventListener('stoka:ready',({detail})=>{empresaId=detail.member.empresa_id;papel=detail.member.papel;$('#import-form').addEventListener('submit',preview);$('#confirmar').addEventListener('click',confirm);$('#cancelar').addEventListener('click',clear);$('#tipo').addEventListener('change',clear);$('#arquivo').addEventListener('change',clear);if(papel!=='administrador'){$('#import-form').hidden=true;feedback('Somente administradores podem importar planilhas.',true);}});
})();
