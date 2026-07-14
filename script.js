(function(){
  var $=function(id){return document.getElementById(id);};
  var cartoesEl=$('cartoes'); var idx=0;

  function parseBR(s){
    if(s==null) return NaN;
    s=String(s).trim().replace(/[R$\s]/g,'');
    if(s==='') return NaN;
    s=s.replace(/\.(?=\d{3}(\D|$))/g,'').replace(',','.');
    return parseFloat(s);
  }
  function fmt(n){return n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});}
  function real(n){return 'R$ '+fmt(n);}

  // Termos conforme o tipo selecionado (cartão x empréstimo)
  function termos(){
    var t=$('tipo').value;
    if(t==='emprestimo'){
      return {sing:'Empréstimo', singL:'empréstimo', plur:'empréstimos', taxa:'2%'};
    }
    return {sing:'Cartão', singL:'cartão', plur:'cartões', taxa:'5%'};
  }
  function ehMisto(){ return $('tipo').value==='misto'; }
  // Termos de um item individual (usado no modo misto)
  function termosItem(tipoItem){
    if(tipoItem==='emprestimo') return {sing:'Empréstimo', singL:'empréstimo', plur:'empréstimos', taxa:'2%'};
    return {sing:'Cartão', singL:'cartão', plur:'cartões', taxa:'5%'};
  }
  // Atualiza os rótulos visíveis da interface quando troca o tipo
  function atualizarRotulos(){
    var misto=ehMisto();
    if(misto){
      $('tituloBloco2').textContent='Cartões e empréstimos';
      $('addCartao').textContent='+ Adicionar item';
    } else {
      var tm=termos();
      $('tituloBloco2').textContent=tm.sing+'s atuais';
      $('addCartao').textContent='+ Adicionar '+tm.singL;
    }
    // Mostra/oculta o seletor de tipo por item e ajusta as etiquetas
    cartoesEl.querySelectorAll('.cartao').forEach(function(c,i){
      var sel=c.querySelector('.c-tipo-wrap');
      if(sel) sel.style.display = misto ? '' : 'none';
      var tag=c.querySelector('.tag');
      if(misto){
        var ti=c.querySelector('.c-tipo') ? c.querySelector('.c-tipo').value : 'cartao';
        tag.textContent=termosItem(ti).sing+' '+(i+1);
      } else {
        tag.textContent=termos().sing+' '+(i+1);
      }
    });
  }

  function novoCartao(){
    idx++;
    var n=document.createElement('div');
    n.className='cartao'; n.dataset.i=idx;
    var misto=ehMisto();
    var tm= misto ? termosItem('cartao') : termos();
    n.innerHTML=
      '<span class="tag">'+tm.sing+' '+idx+'</span>'+
      '<button class="rm" title="Remover">✕</button>'+
      '<div class="c-tipo-wrap" style="margin-top:6px;'+(misto?'':'display:none')+'">'+
        '<label>Tipo deste item</label>'+
        '<select class="inp c-tipo">'+
          '<option value="cartao">Cartão (5% ao mês)</option>'+
          '<option value="emprestimo">Empréstimo (2% ao mês)</option>'+
        '</select>'+
      '</div>'+
      '<div class="row c4" style="margin-top:8px">'+
        '<div><label>Banco</label><input class="inp c-banco" placeholder="Ex.: Clickbank"></div>'+
        '<div><label>Parcela (R$)</label><input class="inp c-parc" inputmode="decimal" placeholder="826,93"></div>'+
        '<div><label>Prazo</label><input class="inp c-prazo" inputmode="numeric" placeholder="78"></div>'+
        '<div><label>Saldo devedor (R$)</label><input class="inp c-saldo" inputmode="decimal" placeholder="24.000,00"></div>'+
      '</div>';
    cartoesEl.appendChild(n);
    n.querySelector('.rm').addEventListener('click',function(){ n.remove(); renumerar(); totais(); });
    n.querySelectorAll('.c-parc,.c-saldo').forEach(function(i){ i.addEventListener('input',totais); });
    var selTipo=n.querySelector('.c-tipo');
    if(selTipo) selTipo.addEventListener('change',renumerar);
    totais();
  }
  function renumerar(){
    var cs=cartoesEl.querySelectorAll('.cartao');
    var misto=ehMisto();
    idx=0; cs.forEach(function(c){
      idx++;
      var tag=c.querySelector('.tag');
      if(misto){
        var ti=c.querySelector('.c-tipo') ? c.querySelector('.c-tipo').value : 'cartao';
        tag.textContent=termosItem(ti).sing+' '+idx;
      } else {
        tag.textContent=termos().sing+' '+idx;
      }
    });
  }
  function lerCartoes(){
    var out=[];
    var misto=ehMisto();
    cartoesEl.querySelectorAll('.cartao').forEach(function(c){
      var tipoItem = misto && c.querySelector('.c-tipo') ? c.querySelector('.c-tipo').value
                    : ($('tipo').value==='emprestimo' ? 'emprestimo' : 'cartao');
      out.push({
        banco:c.querySelector('.c-banco').value.trim(),
        parc:parseBR(c.querySelector('.c-parc').value),
        prazo:c.querySelector('.c-prazo').value.trim(),
        saldo:parseBR(c.querySelector('.c-saldo').value),
        tipoItem:tipoItem
      });
    });
    return out;
  }
  function totais(){
    var cs=lerCartoes(), tp=0, ts=0;
    cs.forEach(function(c){ if(!isNaN(c.parc))tp+=c.parc; if(!isNaN(c.saldo))ts+=c.saldo; });
    $('tParc').textContent=real(tp); $('tSaldo').textContent=real(ts);
    return {tp:tp,ts:ts};
  }

  function gerar(){
    $('erro').textContent='';
    var misto=ehMisto();
    var cs=lerCartoes();
    var validos=cs.filter(function(c){return c.banco&&!isNaN(c.parc)&&!isNaN(c.saldo)&&c.prazo;});
    if(validos.length===0){ $('erro').textContent='Adicione ao menos um cartão completo (banco, parcela, prazo e saldo).'; return; }

    var coef=parseBR($('coef').value); if(isNaN(coef)||coef<=0)coef=0.022526;
    var t=totais(); var totalParc=t.tp, totalSaldo=t.ts;

    var b1=$('b1').value.trim()||'o banco'; var b2=$('b2').value.trim()||'o banco';
    var p1=parseBR($('p1').value); if(isNaN(p1)) p1=totalSaldo*coef;
    var p2=parseBR($('p2').value);
    var temOpcao2=!isNaN(p2);  // Opção 2 só entra se a parcela foi preenchida

    var lib1=p1/coef, troco1=lib1-totalSaldo, econ1=totalParc-p1;
    var lib2=0, troco2=0, econ2=0, amortParc=0, novoPrazo=120;
    var TAXA_AMORT=0.0179, PRAZO=120;
    if(temOpcao2){
      lib2=p2/coef; troco2=lib2-totalSaldo; econ2=totalParc-p2;
      // Amortização: quantas parcelas do FIM o troco quita (valor presente a 1,79%)
      if(troco2>0){
        var vp=0, k;
        for(k=PRAZO;k>=1;k--){
          var v=p2/Math.pow(1+TAXA_AMORT,k);
          if(vp+v<=troco2){ vp+=v; amortParc++; } else { break; }
        }
      }
      novoPrazo=PRAZO-amortParc;
    }

    var nome=$('nome').value.trim(); var consultor=$('consultor').value.trim();
    var tm=termos();

    // Lista de bancos únicos (preserva a ordem, sem repetir)
    var bancosUnicos=[];
    validos.forEach(function(c){ if(bancosUnicos.indexOf(c.banco)===-1) bancosUnicos.push(c.banco); });
    var bancosTxt;
    if(bancosUnicos.length===1){ bancosTxt='*'+bancosUnicos[0]+'*'; }
    else if(bancosUnicos.length===2){ bancosTxt='*'+bancosUnicos[0]+'* e *'+bancosUnicos[1]+'*'; }
    else {
      var ini=bancosUnicos.slice(0,-1).map(function(b){return '*'+b+'*';}).join(', ');
      bancosTxt=ini+' e *'+bancosUnicos[bancosUnicos.length-1]+'*';
    }

    var lista=validos.map(function(c,i){
      var ti=termosItem(c.tipoItem);
      var rotulo = misto ? (ti.sing+' – '+c.banco) : (ti.sing+' '+(i+1)+' – '+c.banco);
      return '📌 *'+rotulo+' (juros acima de '+ti.taxa+' ao mês!)*\n'+
             '* Parcela: R$ '+fmt(c.parc)+' x '+c.prazo+'x\n'+
             '* Saldo devedor: R$ '+fmt(c.saldo);
    }).join('\n');

    var qtd=validos.length;

    // Resumo dos itens: no misto conta cartões e empréstimos separadamente
    var resumoItens;
    if(misto){
      var nC=0, nE=0;
      validos.forEach(function(c){ if(c.tipoItem==='emprestimo') nE++; else nC++; });
      var partes=[];
      if(nC>0) partes.push(nC+' '+(nC===1?'cartão':'cartões'));
      if(nE>0) partes.push(nE+' '+(nE===1?'empréstimo':'empréstimos'));
      resumoItens=partes.join(' e ');
    } else {
      resumoItens=qtd+' '+(qtd===1 ? tm.singL : tm.plur);
    }

    // Texto da taxa na abertura: única no modo simples; genérico no misto
    var taxaAbertura = misto ? 'taxas altas' : ((qtd===1?'taxa acima':'taxas acima')+' de '+tm.taxa+' ao mês');

    var saud='Bom dia '+(nome?'*'+nome+'*':'')+'! Tudo bem com você? 😊';
    var apres=consultor
      ? 'Sou eu novamente, '+consultor+'! Entrei em contato com você há um tempo sobre descontos em folha. Fiz uma nova análise e identifiquei '+resumoItens+' com o Banco '+bancosTxt+' com '+taxaAbertura+':'
      : 'Fiz uma nova análise e identifiquei '+resumoItens+' com o Banco '+bancosTxt+' com '+taxaAbertura+':';

    var linha='——————————————';
    var quitaTxt;
    if(misto){
      var qC=0,qE=0;
      validos.forEach(function(c){ if(c.tipoItem==='emprestimo') qE++; else qC++; });
      var pQ=[];
      if(qC>0) pQ.push('os '+qC+' '+(qC===1?'cartão':'cartões'));
      if(qE>0) pQ.push(qE===1?'o empréstimo':'todos os empréstimos');
      quitaTxt=pQ.join(' e ');
    } else {
      quitaTxt=(qtd===1?('o '+qtd+' '+tm.singL):('os '+qtd+' '+tm.plur));
    }

    // Bloco da Opção 1 — título muda conforme haja ou não a Opção 2
    var tituloOp1 = temOpcao2 ? ('✅ *OPÇÃO 1 – '+b1+'*') : '✅ *Temos essa opção disponível*';
    // Só menciona sobra se houver troco de fato (arredonda p/ evitar centavos residuais)
    var sobra1 = (troco1 >= 0.01)
      ? (' e ainda sobram R$ '+fmt(troco1)+' no seu bolso! 💵')
      : '!';
    var blocoOp1=
      tituloOp1+'\n'+
      '* Parcela nova: R$ '+fmt(p1)+' x 120x\n'+
      '* Valor liberado: R$ '+fmt(lib1)+' (quita '+quitaTxt+sobra1+')\n'+
      '* 1º desconto: 2 meses de carência!\n'+
      '* 💚 Economia mensal: R$ '+fmt(econ1);

    var blocoOp2='';
    if(temOpcao2){
      blocoOp2=
        '\n\n'+linha+'\n'+
        '✅ *OPÇÃO 2 – '+b2+'*\n'+
        '* Parcela nova: R$ '+fmt(p2)+' x '+novoPrazo+'x\n'+
        '* Valor liberado: R$ '+fmt(lib2)+' (quita '+quitaTxt+'!)\n'+
        '* ⏱️ '+amortParc+' parcelas a menos: de 120x para *'+novoPrazo+'x*!\n'+
        '* 1º desconto: 2 meses de carência!\n'+
        '* 💚 Economia mensal: R$ '+fmt(econ2);
    }

    // Chamada e fecho adaptam conforme uma ou duas opções
    var chamada=temOpcao2
      ? 'Consegui 2 ótimas opções para resolver tudo isso pra você:'
      : 'Consegui uma ótima opção pra você:';
    var fecho=temOpcao2
      ? 'Nas duas opções você quita '+quitaTxt+' com taxa alta, reduz o desconto em folha e ainda fica 2 meses sem desconto! 🔥\n\nQual das opções faz mais sentido pra você?'
      : 'Com essa opção você quita '+quitaTxt+' com taxa alta, reduz o desconto em folha e ainda fica 2 meses sem desconto! 🔥\n\nO que acha? Faz sentido pra você?';

    var msg=
saud+'\n'+
apres+'\n\n'+
lista+'\n\n'+
'💳 Total em parcelas: R$ '+fmt(totalParc)+'/mês\n'+
'💰 Total para quitação: R$ '+fmt(totalSaldo)+'\n\n'+
chamada+'\n\n'+
linha+'\n'+
blocoOp1+
blocoOp2+'\n\n'+
linha+'\n'+
fecho;

    $('msg').value=msg;
    $('empty').style.display='none'; $('msgWrap').style.display='block';
    $('msgSub').textContent='Proposta pronta';
  }

  function copiar(){
    var ta=$('msg'); ta.select(); ta.setSelectionRange(0,999999);
    var done=function(){var t=$('toast');t.classList.add('show');setTimeout(function(){t.classList.remove('show');},1600);};
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(ta.value).then(done,function(){document.execCommand('copy');done();});
    }else{document.execCommand('copy');done();}
  }

  $('addCartao').addEventListener('click',novoCartao);
  $('gerar').addEventListener('click',gerar);
  $('copiar').addEventListener('click',copiar);
  $('tipo').addEventListener('change',atualizarRotulos);

  // ---- Coeficiente por banco ----
  // Safra: 0,021540 (120x, 1,79% a.m.) | Padrão: 0,022526 (120x, 2% a.m.)
  function aplicarCoefBanco(){
    var b=$('bancoCoef').value;
    if(b==='safra'){
      $('coef').value='0,021540';
      $('hintBanco').textContent='120x · 1,79% a.m.';
    } else {
      $('coef').value='0,022526';
      $('hintBanco').textContent='120x · 2% a.m.';
    }
  }
  $('bancoCoef').addEventListener('change',aplicarCoefBanco);
  aplicarCoefBanco(); // aplica o padrão ao carregar

  // ---- Calculadora do Cidadão (financiamento com prestações fixas) ----
  // q0 = [1-(1+j)^-n]/j * p   (mesma fórmula do site oficial)
  function ccTravarTaxa(){
    var t=$('cc_tipo').value;
    if(t==='cartao'){ $('cc_taxa').value='4,00'; $('cc_taxa').readOnly=true; }
    else if(t==='emprestimo'){ $('cc_taxa').value='2,00'; $('cc_taxa').readOnly=true; }
    else { $('cc_taxa').readOnly=false; }  // manual
  }
  function ccCalcular(){
    $('cc_erro').textContent='';
    var n=parseInt($('cc_meses').value,10);
    var p=parseBR($('cc_parcela').value);
    var j=parseBR($('cc_taxa').value);
    if(isNaN(n)||n<1){ $('cc_erro').textContent='Informe o nº de meses.'; return; }
    if(isNaN(p)||p<=0){ $('cc_erro').textContent='Informe o valor da prestação.'; return; }
    if(isNaN(j)||j<=0){ $('cc_erro').textContent='Informe a taxa mensal.'; return; }
    var i=j/100;
    var vf=(1-Math.pow(1+i,-n))/i*p;
    var total=p*n;
    var juros=total-vf;
    $('cc_vf').textContent=real(vf);
    $('cc_total').textContent=real(total);
    $('cc_juros').textContent=real(juros);
    $('cc_resultado').style.display='block';
  }
  $('cc_tipo').addEventListener('change',ccTravarTaxa);
  $('cc_calcular').addEventListener('click',ccCalcular);
  ccTravarTaxa(); // trava inicial (cartão 4%)

  novoCartao();
})();
