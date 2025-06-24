const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware para permitir o uso de JSON no corpo das requisições
app.use(express.json());

// Servir arquivos estáticos (CSS, JS, imagens)
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.static(path.join(__dirname, 'templates')));
app.use(express.static(path.join(__dirname, 'data')));

// Rota para a página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'opcoes.html'));
});
// Retorna todos os clientes
app.get('/api/clientes', (req, res) => {
  const filePath = path.join(__dirname, 'data', 'clientes.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ erro: 'Erro ao ler clientes' });
    res.json(JSON.parse(data));
  });
});

// Retorna todas as ordens de serviço
app.get('/api/os', (req, res) => {
  const filePath = path.join(__dirname, 'data', 'os.comnull.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ erro: 'Erro ao ler ordens' });
    res.json(JSON.parse(data));
  });
});
app.post('/api/clientes', (req, res) => {
  const filePath = path.join(__dirname, 'data', 'clientes.json');
  const novoCliente = req.body;

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ erro: 'Erro ao ler clientes' });

    const clientes = JSON.parse(data);

    // Gera novo ID somando 1 ao maior ID existente
    const maiorId = clientes.reduce((max, c) => c.id > max ? c.id : max, 0);
    novoCliente.id = maiorId + 1;

    clientes.push(novoCliente);

    fs.writeFile(filePath, JSON.stringify(clientes, null, 2), (err) => {
      if (err) return res.status(500).json({ erro: 'Erro ao salvar cliente' });
      res.status(201).json({ mensagem: 'Cliente adicionado com sucesso' });
    });
  });
});
// Atualiza um cliente existente
app.put('/api/clientes/:id', (req, res) => {
  const filePath = path.join(__dirname, 'data', 'clientes.json');
  const id = parseInt(req.params.id);
  const dadosAtualizados = req.body;

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ erro: 'Erro ao ler clientes' });

    let clientes = JSON.parse(data);
    const index = clientes.findIndex(c => parseInt(c.id) === id);

    if (index === -1) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

    clientes[index] = { ...clientes[index], ...dadosAtualizados, id };

    fs.writeFile(filePath, JSON.stringify(clientes, null, 2), err => {
      if (err) return res.status(500).json({ erro: 'Erro ao salvar cliente' });
      res.json({ mensagem: 'Cliente atualizado com sucesso' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// Adiciona uma nova ordem de serviço
app.post('/api/os', (req, res) => {
  const fileClientes = path.join(__dirname, 'data', 'clientes.json');
  const fileOS = path.join(__dirname, 'data', 'os.comnull.json');
  const novaOS = req.body;

  // Verifica se todos os campos obrigatórios foram enviados
  if (!novaOS.nome || !novaOS.entrada || !novaOS.codigo || !novaOS.defeito) {
    return res.status(400).json({ erro: 'Campos obrigatórios ausentes' });
  }

  // Lê os clientes para verificar se o nome existe
  fs.readFile(fileClientes, 'utf8', (err, dataClientes) => {
    if (err) return res.status(500).json({ erro: 'Erro ao ler clientes' });

    const clientes = JSON.parse(dataClientes);
    const cliente = clientes.find(c => c.nome.toLowerCase() === novaOS.nome.toLowerCase());

    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

    // Atribui o id do cliente como idOS
    const idOS = cliente.id;

    // Lê o arquivo de ordens de serviço
    fs.readFile(fileOS, 'utf8', (err, dataOS) => {
      if (err) return res.status(500).json({ erro: 'Erro ao ler ordens de serviço' });

      let ordens = [];
      try {
        ordens = JSON.parse(dataOS);
      } catch (parseError) {
        return res.status(500).json({ erro: 'Erro ao interpretar os.comnull.json' });
      }

      const novoId = ordens.reduce((max, os) => os.id > max ? os.id : max, 0) + 1;

      // Cria a nova OS com base no corpo da requisição
      const novaOrdem = {
        id: novoId, // <<<<<< AQUI ESTÁ O ID GERADO
        idOS: idOS,
        entrada: novaOS.entrada,
        saida: novaOS.saida || null,
        aparelho: novaOS.aparelho || null,
        codigo: novaOS.codigo,
        marca: novaOS.marca || null,
        modelo: novaOS.modelo || null,
        serie: novaOS.serie || null,
        defeito: novaOS.defeito,
        observacao: novaOS.observacao || null,
        valorpecas: novaOS.valorpecas || 0,
        valorservico: novaOS.valorservico || 0,
        desconto: novaOS.desconto || 0
      };

      ordens.push(novaOrdem);

      fs.writeFile(fileOS, JSON.stringify(ordens, null, 2), (err) => {
        if (err) return res.status(500).json({ erro: 'Erro ao salvar nova OS' });
        res.status(201).json({ mensagem: 'Ordem de serviço adicionada com sucesso' });
      });
    });
  });
});

app.put('/api/os/:id', (req, res) => {
  const filePath = path.join(__dirname, 'data', 'os.comnull.json');
  const id = parseInt(req.params.id);
  const dadosAtualizados = req.body;

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ erro: 'Erro ao ler OS' });

    let ordens = JSON.parse(data);
    const index = ordens.findIndex(os => os.id === id);

    if (index === -1) return res.status(404).json({ erro: 'OS não encontrada' });

    ordens[index] = { ...ordens[index], ...dadosAtualizados, id };

    fs.writeFile(filePath, JSON.stringify(ordens, null, 2), err => {
      if (err) return res.status(500).json({ erro: 'Erro ao salvar OS' });
      res.json({ mensagem: 'OS atualizada com sucesso' });
    });
  });
});
