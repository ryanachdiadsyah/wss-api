#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '.env');

// Função para gerar uma chave secreta aleatória
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Função para atualizar o arquivo .env
async function updateEnvFile() {
  console.log('\n===== Configuração de Autenticação =====');
  console.log('Este script irá configurar as variáveis de ambiente necessárias para autenticação.');
  
  try {
    // Verificar se o arquivo .env existe
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      console.log('\nArquivo .env encontrado. Atualizando...');
    } else {
      console.log('\nArquivo .env não encontrado. Criando um novo...');
      // Copiar do .env.example se existir
      if (fs.existsSync(path.join(__dirname, '.env.example'))) {
        envContent = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8');
      }
    }
    
    // Perguntar ao usuário sobre as credenciais
    const username = await new Promise(resolve => {
      rl.question('\nDigite o nome de usuário para autenticação [admin]: ', (answer) => {
        resolve(answer.trim() || 'admin');
      });
    });
    
    const password = await new Promise(resolve => {
      rl.question('Digite a senha para autenticação [password]: ', (answer) => {
        resolve(answer.trim() || 'password');
      });
    });
    
    // Gerar JWT Secret
    const jwtSecret = generateSecret();
    console.log('\nChave JWT gerada com sucesso!');
    
    // Atualizar ou adicionar as variáveis de ambiente
    const envVars = {
      ADMIN_USERNAME: username,
      ADMIN_PASSWORD: password,
      JWT_SECRET: jwtSecret
    };
    
    // Verificar se as variáveis já existem no arquivo
    Object.keys(envVars).forEach(key => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        // Substituir a variável existente
        envContent = envContent.replace(regex, `${key}="${envVars[key]}"`);
      } else {
        // Adicionar a nova variável
        envContent += `\n${key}="${envVars[key]}"`;
      }
    });
    
    // Salvar o arquivo .env atualizado
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ Configuração de autenticação concluída com sucesso!');
    console.log('\nVariáveis configuradas:');
    console.log(`- ADMIN_USERNAME: ${username}`);
    console.log(`- ADMIN_PASSWORD: ${password}`);
    console.log(`- JWT_SECRET: ${jwtSecret.substring(0, 8)}...`);
    
    console.log('\nAgora você pode iniciar o servidor e acessar a aplicação.');
    console.log('Use as credenciais configuradas para fazer login.\n');
    
  } catch (error) {
    console.error('\n❌ Erro ao configurar autenticação:', error.message);
  } finally {
    rl.close();
  }
}

// Executar a função principal
updateEnvFile();
