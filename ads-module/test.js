// Teste simples para o Ads Module
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3003';

async function testAdsModule() {
  console.log('🧪 Testando Ads Module...\n');

  try {
    // Teste 1: Health Check
    console.log('1. Testando Health Check...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    
    if (healthData.success) {
      console.log('✅ Health Check: OK');
      console.log(`   Mensagem: ${healthData.message}`);
      console.log(`   Versão: ${healthData.version}\n`);
    } else {
      console.log('❌ Health Check: FALHOU\n');
      return;
    }

    // Teste 2: Listar Anúncios
    console.log('2. Testando Listagem de Anúncios...');
    const adsResponse = await fetch(`${BASE_URL}/api/ads`);
    const adsData = await adsResponse.json();
    
    if (adsData.success) {
      console.log('✅ Listagem de Anúncios: OK');
      console.log(`   Total de anúncios: ${adsData.total}\n`);
    } else {
      console.log('❌ Listagem de Anúncios: FALHOU\n');
    }

    // Teste 3: Criar Anúncio
    console.log('3. Testando Criação de Anúncio...');
    const newAd = {
      title: 'Teste de Promoção',
      description: 'Este é um anúncio de teste',
      restaurantId: 'test-rest',
      startDate: '2024-01-15',
      endDate: '2024-01-20',
      isActive: true,
      priority: 2
    };

    const createResponse = await fetch(`${BASE_URL}/api/ads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newAd)
    });

    const createData = await createResponse.json();
    
    if (createData.success) {
      console.log('✅ Criação de Anúncio: OK');
      console.log(`   ID criado: ${createData.data.id}\n`);
      
      // Teste 4: Buscar Anúncio por ID
      console.log('4. Testando Busca por ID...');
      const getResponse = await fetch(`${BASE_URL}/api/ads/${createData.data.id}`);
      const getData = await getResponse.json();
      
      if (getData.success) {
        console.log('✅ Busca por ID: OK');
        console.log(`   Título: ${getData.data.title}\n`);
      } else {
        console.log('❌ Busca por ID: FALHOU\n');
      }

      // Teste 5: Atualizar Anúncio
      console.log('5. Testando Atualização...');
      const updateData = {
        title: 'Promoção Atualizada',
        description: 'Descrição atualizada',
        priority: 3
      };

      const updateResponse = await fetch(`${BASE_URL}/api/ads/${createData.data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const updateResult = await updateResponse.json();
      
      if (updateResult.success) {
        console.log('✅ Atualização: OK');
        console.log(`   Novo título: ${updateResult.data.title}\n`);
      } else {
        console.log('❌ Atualização: FALHOU\n');
      }

      // Teste 6: Deletar Anúncio
      console.log('6. Testando Deleção...');
      const deleteResponse = await fetch(`${BASE_URL}/api/ads/${createData.data.id}`, {
        method: 'DELETE'
      });

      const deleteData = await deleteResponse.json();
      
      if (deleteData.success) {
        console.log('✅ Deleção: OK\n');
      } else {
        console.log('❌ Deleção: FALHOU\n');
      }

    } else {
      console.log('❌ Criação de Anúncio: FALHOU');
      console.log(`   Erro: ${createData.message}\n`);
    }

    // Teste 7: Anúncios por Restaurante
    console.log('7. Testando Anúncios por Restaurante...');
    const restaurantResponse = await fetch(`${BASE_URL}/api/ads/restaurant/test-rest`);
    const restaurantData = await restaurantResponse.json();
    
    if (restaurantData.success) {
      console.log('✅ Anúncios por Restaurante: OK');
      console.log(`   Total: ${restaurantData.total}\n`);
    } else {
      console.log('❌ Anúncios por Restaurante: FALHOU\n');
    }

    console.log('🎉 Todos os testes concluídos!');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    console.log('\n💡 Certifique-se de que o Ads Module está rodando na porta 3003');
  }
}

// Executar testes se o arquivo for executado diretamente
if (require.main === module) {
  testAdsModule();
}

module.exports = { testAdsModule };
