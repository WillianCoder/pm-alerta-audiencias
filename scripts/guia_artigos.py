"""Textos do Guia de audiências. Cada artigo: slug, ícone, título, descrição e corpo em HTML.
O marcador <!--meio--> indica onde entra o espaço de anúncio no meio do texto.
Base legal citada: CPC (Lei 13.105/2015), CLT, CPP, Código Penal, Lei 9.099/1995 e resoluções do CNJ.
"""

ARTIGOS = [
    {
        'slug': 'o-que-e-audiencia-de-conciliacao',
        'icone': '🤝',
        'titulo': 'O que é audiência de conciliação e mediação e como funciona',
        'desc': 'Entenda para que serve a audiência de conciliação, quem participa, se você é obrigado a fazer acordo e o que acontece se faltar.',
        'corpo': '''
<h2>Para que serve</h2>
<p>A audiência de conciliação (ou de mediação) é um encontro para tentar resolver o conflito por <b>acordo</b>, antes de o juiz decidir. Ela é conduzida por um conciliador ou mediador, que ajuda as partes a conversar e a encontrar uma solução. Em muitos processos cíveis, ela é a primeira audiência (artigo 334 do Código de Processo Civil).</p>
<h2>Conciliação ou mediação: qual a diferença?</h2>
<ul>
<li><b>Conciliação:</b> usada quando as partes não tinham relação antes do problema (ex.: consumidor e empresa). O conciliador pode sugerir soluções.</li>
<li><b>Mediação:</b> usada quando existe uma relação que continua (ex.: família, vizinhos, sócios). O mediador ajuda as pessoas a dialogarem, sem impor nada.</li>
</ul>
<!--meio-->
<h2>Sou obrigado a aceitar o acordo?</h2>
<p><b>Não.</b> Ninguém é obrigado a fazer acordo. Se não houver acordo, o processo continua normalmente e o juiz decide depois. Mas você <b>é obrigado a comparecer</b>: no processo comum, a falta sem justificativa é considerada ato atentatório à dignidade da justiça e pode gerar multa de até 2% do valor da causa (CPC, art. 334, § 8º).</p>
<h2>Preciso de advogado?</h2>
<p>No processo comum, as partes devem estar acompanhadas de advogado ou defensor público. Nos Juizados Especiais Cíveis (pequenas causas), causas de até 20 salários mínimos podem ser feitas sem advogado (Lei 9.099/1995, art. 9º).</p>
<h2>Dicas para a audiência</h2>
<ul>
<li>Pense antes no que você aceitaria: valor, prazo, forma de pagamento.</li>
<li>Leve documentos que comprovem o que você diz (contratos, comprovantes, conversas).</li>
<li>Se fizer acordo, leia com calma antes de assinar: ele tem força de decisão judicial.</li>
<li>Muitas conciliações hoje são <a href="audiencia-virtual-como-participar.html">virtuais</a>: teste o link antes.</li>
</ul>
<p>Veja também: <a href="o-que-acontece-se-faltar-audiencia.html">o que acontece se faltar à audiência</a>.</p>
'''
    },
    {
        'slug': 'como-se-preparar-para-uma-audiencia',
        'icone': '✅',
        'titulo': 'Como se preparar para uma audiência: guia completo e o que levar',
        'desc': 'Lista prática do que levar, como se vestir, a que horas chegar e como se comportar numa audiência presencial ou virtual.',
        'corpo': '''
<h2>Antes do dia</h2>
<ul>
<li><b>Confira a intimação:</b> data, hora, endereço (ou link), número do processo e o tipo de audiência.</li>
<li><b>Fale com seu advogado ou com a Defensoria Pública</b> se você for parte (autor ou réu).</li>
<li><b>Separe as provas:</b> contratos, comprovantes, notas fiscais, prints de conversas, fotos.</li>
<li><b>Avise suas testemunhas</b> da data, hora e local.</li>
<li><b>Programe lembretes</b> para não esquecer: 7 dias, 1 dia e 2 horas antes.</li>
</ul>
<!--meio-->
<h2>O que levar</h2>
<ul>
<li>Documento oficial com foto (RG, CNH ou carteira de trabalho).</li>
<li>A intimação ou carta que você recebeu.</li>
<li>Cópias dos documentos importantes do caso.</li>
<li>Caneta e um papel para anotar.</li>
<li>Se for trabalhista: carteira de trabalho, holerites e extrato do FGTS.</li>
</ul>
<h2>No dia</h2>
<ul>
<li><b>Chegue 30 minutos antes:</b> há fila e revista na entrada dos fóruns.</li>
<li><b>Vista-se de forma discreta:</b> muitos fóruns não permitem bermuda, regata ou chinelo.</li>
<li><b>Desligue o som do celular</b> e espere ser chamado pelo nome.</li>
<li><b>Fale com calma e só a verdade.</b> Se não souber ou não lembrar, diga isso.</li>
<li><b>Se for testemunha,</b> peça a declaração de comparecimento para apresentar no trabalho.</li>
</ul>
<h2>E se a audiência for virtual?</h2>
<p>Veja o passo a passo em <a href="audiencia-virtual-como-participar.html">como participar de uma audiência virtual</a>.</p>
'''
    },
    {
        'slug': 'audiencia-virtual-como-participar',
        'icone': '🎥',
        'titulo': 'Audiência virtual: como participar pelo celular ou computador',
        'desc': 'Passo a passo para entrar numa audiência por videochamada (Zoom, Teams, Webex), testar câmera e áudio e evitar problemas.',
        'corpo': '''
<h2>A audiência virtual vale como a presencial?</h2>
<p>Sim. As audiências por videoconferência são regulamentadas pelo Conselho Nacional de Justiça (Resolução CNJ 354/2020) e têm o mesmo valor das presenciais. Faltar tem as mesmas consequências.</p>
<h2>Passo a passo</h2>
<ol>
<li><b>Ache o link</b> na intimação, no e-mail ou na mensagem do tribunal. Guarde-o no app de lembretes.</li>
<li><b>Instale o aplicativo</b> indicado (Zoom, Microsoft Teams, Webex ou Google Meet) um dia antes.</li>
<li><b>Teste câmera, microfone e internet.</b> Prefira Wi-Fi e deixe o celular carregando.</li>
<li><b>Escolha um lugar silencioso e iluminado,</b> de frente para a luz, sem pessoas passando.</li>
<li><b>Entre 10 minutos antes</b> com seu nome completo, como está no processo.</li>
<li><b>Tenha o documento com foto à mão:</b> o juiz ou servidor pode pedir para mostrar na câmera.</li>
</ol>
<!--meio-->
<h2>Durante a audiência</h2>
<ul>
<li>Mantenha o microfone desligado até ser chamado a falar.</li>
<li>Não grave nem divulgue a audiência sem autorização.</li>
<li>Testemunhas não podem estar acompanhadas nem ouvir os outros depoimentos.</li>
</ul>
<h2>Deu problema na conexão?</h2>
<p>Tente entrar de novo imediatamente. Se não conseguir, ligue ou mande e-mail para a vara (o contato costuma estar na intimação ou no site do tribunal) e guarde prints que mostrem a tentativa. Informe também seu advogado ou a Defensoria.</p>
'''
    },
    {
        'slug': 'intimado-como-testemunha',
        'icone': '🗣️',
        'titulo': 'Fui intimado como testemunha: o que fazer, direitos e deveres',
        'desc': 'Testemunha é obrigada a ir? Pode faltar ao trabalho? O que acontece se mentir? Veja seus direitos e deveres.',
        'corpo': '''
<h2>Sou obrigado a comparecer?</h2>
<p><b>Sim.</b> Quem é intimado como testemunha tem o dever de comparecer. Se faltar sem motivo justificado, pode ser levado por oficial de justiça ou pela polícia (condução coercitiva), pagar as despesas do adiamento e até multa (CPC, art. 455, § 5º; CPP, arts. 218 e 219).</p>
<h2>E o meu trabalho?</h2>
<p>Depor em juízo é considerado serviço público. A testemunha com carteira assinada <b>não pode ter desconto no salário</b> nem perder tempo de serviço por comparecer (CPC, art. 463; CLT, arts. 473 e 822). Peça a <b>declaração de comparecimento</b> no fórum e entregue ao empregador.</p>
<!--meio-->
<h2>Como é o depoimento</h2>
<ul>
<li>Você presta o compromisso de dizer a verdade.</li>
<li>O juiz e os advogados fazem perguntas sobre o que você viu ou sabe.</li>
<li>Responda só o que sabe. "Não sei" ou "não me lembro" são respostas válidas.</li>
<li>Você não é obrigado a responder sobre fatos que possam lhe causar grave dano ou que deva manter em sigilo profissional (CPC, art. 448).</li>
</ul>
<h2>Cuidado: mentir é crime</h2>
<p>Fazer afirmação falsa, negar ou esconder a verdade como testemunha é crime de falso testemunho (Código Penal, art. 342).</p>
<h2>Não posso ir na data. E agora?</h2>
<p>Avise com antecedência a vara (pelo telefone ou e-mail da intimação) e apresente a justificativa com documento, como atestado médico. Quem chamou a testemunha (geralmente o advogado de uma das partes) também deve ser avisado.</p>
'''
    },
    {
        'slug': 'o-que-acontece-se-faltar-audiencia',
        'icone': '⚠️',
        'titulo': 'O que acontece se eu faltar à audiência?',
        'desc': 'As consequências de faltar à audiência para autor, réu, trabalhador, empresa, testemunha e jurado — e como justificar a falta.',
        'corpo': '''
<p>Faltar à audiência pode trazer prejuízos sérios. As consequências mudam conforme o seu papel e o tipo de processo:</p>
<h2>Se você é o autor (quem entrou com a ação)</h2>
<ul>
<li><b>Juizado Especial Cível:</b> o processo é encerrado (extinto) e você pode ter que pagar as custas (Lei 9.099/1995, art. 51).</li>
<li><b>Justiça do Trabalho:</b> o processo é arquivado e o trabalhador pode ser condenado às custas, salvo motivo justificado comprovado em 15 dias (CLT, art. 844).</li>
<li><b>Processo comum, na conciliação:</b> multa de até 2% do valor da causa (CPC, art. 334, § 8º).</li>
</ul>
<!--meio-->
<h2>Se você é o réu (quem está sendo processado)</h2>
<ul>
<li><b>Juizado Especial e Justiça do Trabalho:</b> pode haver <b>revelia</b>, ou seja, o juiz pode considerar verdadeiro o que a outra parte disse (Lei 9.099/1995, art. 20; CLT, art. 844).</li>
<li><b>Processo comum, na conciliação:</b> a mesma multa de até 2%.</li>
</ul>
<h2>Se você é testemunha</h2>
<p>Pode ser conduzido coercitivamente, pagar as despesas do adiamento e multa (CPC, art. 455; CPP, arts. 218 e 219). Veja <a href="intimado-como-testemunha.html">direitos e deveres da testemunha</a>.</p>
<h2>Se você foi sorteado jurado</h2>
<p>Faltar sem causa legítima gera multa de 1 a 10 salários mínimos (CPP, art. 442).</p>
<h2>Como justificar a falta</h2>
<ol>
<li>Avise <b>antes</b>, se possível: à vara, ao seu advogado ou à Defensoria.</li>
<li>Guarde o documento que comprova o motivo (atestado, boletim de ocorrência, comprovante de viagem a trabalho etc.).</li>
<li>Peça a remarcação o quanto antes.</li>
</ol>
<p>O melhor remédio é a prevenção: <a href="como-se-preparar-para-uma-audiencia.html">como se preparar para a audiência</a>.</p>
'''
    },
    {
        'slug': 'audiencia-trabalhista-como-funciona',
        'icone': '👷',
        'titulo': 'Audiência trabalhista: como funciona e o que levar',
        'desc': 'Audiência inicial, una e de instrução na Justiça do Trabalho: o que acontece, quantas testemunhas levar e documentos necessários.',
        'corpo': '''
<h2>Os tipos de audiência trabalhista</h2>
<ul>
<li><b>Inicial:</b> tentativa de acordo e entrega da defesa da empresa.</li>
<li><b>Instrução:</b> depoimentos do trabalhador, do representante da empresa e das testemunhas.</li>
<li><b>Una:</b> tudo no mesmo dia — acordo, defesa, depoimentos e testemunhas.</li>
</ul>
<p>A intimação informa qual é o seu caso. Na dúvida, prepare-se como se fosse <b>una</b>.</p>
<!--meio-->
<h2>Testemunhas</h2>
<p>Na Justiça do Trabalho, normalmente <b>a própria parte leva suas testemunhas</b>, que comparecem sem precisar de intimação (CLT, art. 825). Cada parte pode levar até 3 testemunhas no rito ordinário e até 2 no rito sumaríssimo (CLT, arts. 821 e 852-H). As testemunhas não podem ter desconto no salário por comparecer (CLT, art. 822).</p>
<h2>O que levar</h2>
<ul>
<li>Documento com foto e carteira de trabalho (física ou digital).</li>
<li>Holerites, extrato do FGTS, contrato, termo de rescisão.</li>
<li>Provas de horário: mensagens, e-mails, fotos, registros de ponto.</li>
</ul>
<h2>Faltar é muito arriscado</h2>
<p>Se o trabalhador faltar, o processo é arquivado. Se a empresa faltar, pode ser considerada revel e confessa quanto aos fatos (CLT, art. 844). Veja <a href="o-que-acontece-se-faltar-audiencia.html">o que acontece se faltar</a>.</p>
'''
    },
    {
        'slug': 'pericia-inss-o-que-levar',
        'icone': '🩺',
        'titulo': 'Perícia médica do INSS: como se preparar e o que levar',
        'desc': 'Checklist de documentos para a perícia do INSS, como remarcar e dicas para não ter o benefício negado por falta de prova.',
        'corpo': '''
<h2>Como saber a data e o local</h2>
<p>A perícia é agendada pelo aplicativo ou site <b>Meu INSS</b> ou pelo telefone <b>135</b>. Confira data, hora e endereço da agência no comprovante de agendamento e cadastre no app de lembretes.</p>
<h2>O que levar</h2>
<ul>
<li>Documento oficial com foto e CPF.</li>
<li><b>Laudos e atestados médicos recentes,</b> com diagnóstico (CID), tempo de afastamento sugerido, assinatura e carimbo do médico.</li>
<li>Exames (imagem, laboratório), receitas e comprovantes de tratamento.</li>
<li>Carteira de trabalho e documentos que mostrem sua atividade.</li>
<li>Originais e cópias.</li>
</ul>
<!--meio-->
<h2>No dia</h2>
<ul>
<li>Chegue com 30 minutos de antecedência.</li>
<li>Explique com clareza suas limitações no dia a dia e no trabalho.</li>
<li>Responda com sinceridade; não exagere nem minimize.</li>
</ul>
<h2>Não posso ir. Posso remarcar?</h2>
<p>Em geral, é possível pedir a remarcação pelo Meu INSS ou pelo 135, de preferência antes da data. Faltar sem remarcar pode levar ao indeferimento do pedido.</p>
<p>Se o benefício for negado, você pode recorrer administrativamente ou procurar a Justiça — nesse caso, pode haver uma <b>perícia judicial</b>, e as mesmas dicas valem.</p>
'''
    },
    {
        'slug': 'como-consultar-processo-pelo-nome',
        'icone': '🔎',
        'titulo': 'Como saber se tenho processo ou intimação pelo nome',
        'desc': 'Onde consultar de graça comunicações processuais, diários oficiais e processos pelo seu nome — e os cuidados com homônimos.',
        'corpo': '''
<h2>Onde procurar (de graça)</h2>
<ul>
<li><b>Comunicações processuais do CNJ (Diário de Justiça Eletrônico Nacional):</b> reúne intimações publicadas pelos tribunais de todo o país. A consulta é pública em <i>comunica.pje.jus.br</i>.</li>
<li><b>Sites dos tribunais:</b> cada tribunal (estadual, federal, do trabalho) tem sua consulta processual. Muitos permitem buscar pelo nome da parte ou pelo CPF.</li>
<li><b>Diários oficiais municipais:</b> o projeto Querido Diário reúne diários de centenas de cidades e permite buscar por nome.</li>
</ul>
<!--meio-->
<h2>Cuidados importantes</h2>
<ul>
<li><b>Homônimos são comuns.</b> Confira o número do processo, a cidade e outros dados antes de concluir que é com você.</li>
<li>Nem todo processo aparece em consulta pública: casos de família e outros em <b>segredo de justiça</b> não são exibidos.</li>
<li>A publicação no diário não substitui a intimação pessoal quando a lei a exige. Em caso de dúvida, procure um advogado ou a Defensoria.</li>
</ul>
<h2>Jeito mais fácil</h2>
<p>No <b>Alerta Audiência</b>, a opção <b>Buscar meu nome</b> consulta essas fontes públicas de uma vez e, se achar algo, você cadastra a audiência com um toque. O plano grátis inclui buscas mensais; o Premium permite buscar todos os dias.</p>
'''
    },
]
